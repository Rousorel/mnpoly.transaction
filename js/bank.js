// js/bank.js

let gameData = null;
let players = [];
let transactions = [];

// Inicializar dashboard del banco
async function initBankDashboard() {
    checkAuth();
    
    // Obtener datos de la sesión
    const session = localStorage.getItem('monopolyBankGame');
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    
    currentGame = JSON.parse(session);
    
    // Cargar datos del juego
    await loadGameData();
    
    // Configurar información del juego
    document.getElementById('displayGameName').textContent = currentGame.gameName;
    document.getElementById('displayGamePin').textContent = currentGame.pin;
    document.getElementById('currentGameInfo').textContent = `Juego: ${currentGame.gameName}`;
    
    // Configurar eventos
    document.getElementById('addPlayerBtn').addEventListener('click', addPlayer);
    const bankPayForm = document.getElementById('bankPayForm');
    if (bankPayForm) bankPayForm.addEventListener('submit', payToPlayerFromBank);
    const endGameBtn = document.getElementById('endGameBtn');
    if (endGameBtn) endGameBtn.addEventListener('click', endGame);
    
    // Cargar jugadores y transacciones
    await loadPlayers();
    await loadTransactions();
    
    // Actualizar contador
    updatePlayersCount();
}

// Cargar datos del juego desde Firestore
async function loadGameData() {
    try {
        const gameRef = db.collection('games').doc(currentGame.gameName);
        const gameDoc = await gameRef.get();
        
        if (gameDoc.exists) {
            gameData = gameDoc.data();
            document.getElementById('displayInitialMoney').textContent = `$${gameData.initialMoney || 1500}`;
        } else {
            alert('Juego no encontrado. Serás redirigido al inicio.');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Error cargando juego:', error);
    }
}

// Cargar lista de jugadores
async function loadPlayers() {
    try {
        const playersRef = db.collection('games').doc(currentGame.gameName).collection('players');
        const snapshot = await playersRef.get();
        
        players = [];
        const playersList = document.getElementById('playersList');
        const emptyMsg = document.getElementById('emptyPlayersMessage');
        
        // If no players, show the empty message inside the players list and return
        if (snapshot.empty) {
            playersList.innerHTML = '<p class="empty-message" id="emptyPlayersMessage">No hay jugadores creados aún.</p>';
            updatePlayersCount();
            return;
        }
        
        // Ensure the empty message is hidden (if present) and clear the list for rendering
        if (emptyMsg) {
            emptyMsg.style.display = 'none';
        }
        playersList.innerHTML = '';
        
        snapshot.forEach(doc => {
            const player = { id: doc.id, ...doc.data() };
            players.push(player);
            
            const playerItem = document.createElement('div');
            playerItem.className = 'player-item';
            playerItem.innerHTML = `
                <div class="player-avatar-small">
                    <i class="fas fa-user"></i>
                </div>
                <div class="player-details-small">
                    <h4>${player.id}</h4>
                    <p>$${player.balance || 0}</p>
                </div>
            `;
            
            playersList.appendChild(playerItem);
        });

        // Populate bank pay select if present
        const bankSelect = document.getElementById('bankToPlayer');
        if (bankSelect) {
            bankSelect.innerHTML = '<option value="">Selecciona un jugador</option>';
            players.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = p.id;
                bankSelect.appendChild(opt);
            });
        }

        updatePlayersCount();
    } catch (error) {
        console.error('Error cargando jugadores:', error);
    }
}

// Cargar transacciones
async function loadTransactions() {
    try {
        const transactionsRef = db.collection('games').doc(currentGame.gameName)
            .collection('transactions')
            .orderBy('timestamp', 'desc')
            .limit(10);
        
        const snapshot = await transactionsRef.get();
        
        const transactionsList = document.getElementById('transactionsList');
        transactionsList.innerHTML = '';
        
        if (snapshot.empty) {
            transactionsList.innerHTML = '<p class="empty-message">No hay transacciones registradas.</p>';
            return;
        }
        
        snapshot.forEach(doc => {
            const transaction = doc.data();
            const transactionItem = document.createElement('div');
            transactionItem.className = 'transaction-item';
            
            const typeClass = transaction.type === 'sent' ? 'type-sent' : 'type-received';
            const typeText = transaction.type === 'sent' ? 'Enviado' : 'Recibido';
            
            const ts = transaction.timestamp && transaction.timestamp.toDate ? transaction.timestamp.toDate() : (transaction.timestamp ? new Date(transaction.timestamp) : null);
            const dateStr = ts ? ts.toLocaleString() : '';

            transactionItem.innerHTML = `
                <div>
                    <strong>${transaction.from} → ${transaction.to}</strong>
                    <p>${dateStr}</p>
                </div>
                <div>
                    <span class="transaction-type ${typeClass}">${typeText}</span>
                    <h3>$${transaction.amount}</h3>
                </div>
            `;
            
            transactionsList.appendChild(transactionItem);
        });
    } catch (error) {
        console.error('Error cargando transacciones:', error);
    }
}

// Agregar nuevo jugador
async function addPlayer() {
    const playerNameInput = document.getElementById('newPlayerName');
    const playerName = playerNameInput.value.trim();
    
    if (!playerName) {
        alert('Por favor, ingresa un nombre para el jugador.');
        return;
    }
    
    // Verificar máximo de jugadores
    if (players.length >= 8) {
        alert('No puedes agregar más de 8 jugadores.');
        return;
    }
    
    // Verificar si el jugador ya existe
    if (players.some(p => p.id === playerName)) {
        alert('Ya existe un jugador con ese nombre.');
        return;
    }
    
    try {
        const playerRef = db.collection('games').doc(currentGame.gameName)
            .collection('players').doc(playerName);
        
        // Crear jugador con saldo inicial
        await playerRef.set({
            balance: gameData.initialMoney || 1500,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Crear transacción inicial
        await db.collection('games').doc(currentGame.gameName)
            .collection('transactions').add({
                from: 'Banco',
                to: playerName,
                amount: gameData.initialMoney || 1500,
                type: 'sent',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        
        playerNameInput.value = '';
        alert(`Jugador ${playerName} creado exitosamente con $${gameData.initialMoney || 1500}.`);
        
        // Recargar lista de jugadores y transacciones
        await loadPlayers();
        await loadTransactions();
        updatePlayersCount();
        
    } catch (error) {
        console.error('Error agregando jugador:', error);
        alert('Error al agregar jugador. Intenta nuevamente.');
    }
}

// Pagar a un jugador (desde Banco)
async function payToPlayerFromBank(e) {
    e.preventDefault();
    const toPlayer = document.getElementById('bankToPlayer').value;
    const amount = parseInt(document.getElementById('bankAmount').value, 10);

    if (!toPlayer) {
        alert('Por favor, selecciona un jugador.');
        return;
    }
    if (!amount || amount <= 0) {
        alert('Por favor, ingresa un monto válido.');
        return;
    }

    try {
        const playerRef = db.collection('games').doc(currentGame.gameName).collection('players').doc(toPlayer);
        await playerRef.update({
            balance: firebase.firestore.FieldValue.increment(amount)
        });

        await db.collection('games').doc(currentGame.gameName).collection('transactions').add({
            from: 'Banco',
            to: toPlayer,
            amount: amount,
            type: 'sent',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });



        // Mostrar toast de éxito al banco
        showToast(`Pago de $${amount} a ${toPlayer} realizado por el banco.`, 'success', 3500);
        document.getElementById('bankPayForm').reset();
        await Promise.all([loadPlayers(), loadTransactions()]);
    } catch (error) {
        console.error('Error pagando desde el banco:', error);
        alert('Error al procesar el pago. Intenta nuevamente.');
    }
}

// Eliminar una colección (borrado simple en lote)
async function deleteCollection(collectionRef) {
    const snapshot = await collectionRef.get();
    if (snapshot.empty) return;
    const batch = db.batch();
    snapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
}

// Terminar la partida: borrar players, transactions y el documento de juego
async function endGame(e) {
    e.preventDefault();

    if (!confirm('¿Confirmas terminar la partida? Esto eliminará todos los jugadores y transacciones.')) return;

    try {
        const gameRef = db.collection('games').doc(currentGame.gameName);
        await deleteCollection(gameRef.collection('players'));
        await deleteCollection(gameRef.collection('transactions'));
        await gameRef.delete();

        // Limpiar sesión y redirigir
        localStorage.removeItem('monopolyBankGame');
        alert('Partida finalizada y datos eliminados. Serás redirigido al inicio.');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error terminando la partida:', error);
        alert('Error al terminar la partida. Intenta nuevamente.');
    }
}

// Toasts
function showToast(message, type = 'info', timeout = 4000) {
    const container = document.getElementById('toastContainer') || document.body;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, timeout);
}

// Actualizar contador de jugadores
function updatePlayersCount() {
    document.getElementById('activePlayersCount').textContent = `${players.length}/8`;
}

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', initBankDashboard);