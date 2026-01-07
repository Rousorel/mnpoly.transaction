// js/player.js

let playerData = null;
let otherPlayers = [];
let playerTransactions = [];

// Inicializar dashboard del jugador
async function initPlayerDashboard() {
    checkAuth();
    
    // Obtener datos de la sesión
    const session = localStorage.getItem('monopolyPlayer');
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    
    currentPlayer = JSON.parse(session);
    
    // Cargar datos del jugador
    await loadPlayerData();
    
    // Configurar información del jugador
    document.getElementById('playerNameDisplay').textContent = currentPlayer.playerName;
    document.getElementById('playerGameInfo').textContent = `Juego: ${currentPlayer.gameName}`;
    
    // Configurar tabs
    setupTabs();
    
    // Cargar otros jugadores para el select
    await loadOtherPlayers();
    
    // Configurar formularios
    document.getElementById('payPlayerForm').addEventListener('submit', payToPlayer);
    document.getElementById('payBankForm').addEventListener('submit', payToBank);
    
    // Cargar transacciones del jugador
    await loadPlayerTransactions();


    
    // Actualizar saldo cada 5 segundos
    setInterval(async () => {
        await loadPlayerData();
    }, 5000);
}












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







// Cargar datos del jugador
async function loadPlayerData() {
    try {
        const playerRef = db.collection('games').doc(currentPlayer.gameName)
            .collection('players').doc(currentPlayer.playerName);
        
        const playerDoc = await playerRef.get();
        
        if (playerDoc.exists) {
            playerData = { id: playerDoc.id, ...playerDoc.data() };
            document.getElementById('playerBalance').textContent = `$${playerData.balance || 0}`;
        }
    } catch (error) {
        console.error('Error cargando datos del jugador:', error);
    }
}

// Cargar otros jugadores (excluyendo al actual)
async function loadOtherPlayers() {
    try {
        const playersRef = db.collection('games').doc(currentPlayer.gameName).collection('players');
        const snapshot = await playersRef.get();
        
        otherPlayers = [];
        const select = document.getElementById('toPlayer');
        select.innerHTML = '<option value="">Selecciona un jugador</option>';
        
        snapshot.forEach(doc => {
            if (doc.id !== currentPlayer.playerName) {
                otherPlayers.push({ id: doc.id, ...doc.data() });
                
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = doc.id;
                select.appendChild(option);
            }
        });
    } catch (error) {
        console.error('Error cargando otros jugadores:', error);
    }
}

// Cargar transacciones del jugador
async function loadPlayerTransactions() {
    try {
        // Fetch recent transactions (no composite where + orderBy to avoid needing a composite index)
        const transactionsRef = db.collection('games').doc(currentPlayer.gameName)
            .collection('transactions')
            .orderBy('timestamp', 'desc')
            .limit(50);
        
        const snapshot = await transactionsRef.get();
        
        const transactionsList = document.getElementById('playerTransactions');
        transactionsList.innerHTML = '';
        
        if (snapshot.empty) {
            transactionsList.innerHTML = '<p class="empty-message">No hay transacciones registradas.</p>';
            return;
        }
        
        // Collect transactions and filter for those related to the current player
        const all = [];
        snapshot.forEach(doc => {
            const data = { id: doc.id, ...doc.data() };
            all.push(data);
        });
        
        // Filter: show transactions where the current player is either sender or recipient
        const related = all.filter(t => t.from === currentPlayer.playerName || t.to === currentPlayer.playerName);
        
        if (related.length === 0) {
            transactionsList.innerHTML = '<p class="empty-message">No hay transacciones registradas.</p>';
            return;
        }
        
        // Ensure sorted by timestamp desc (defensive, in case of inconsistent data types)
        related.sort((a, b) => {
            const at = a.timestamp && a.timestamp.toDate ? a.timestamp.toDate().getTime() : (a.timestamp ? new Date(a.timestamp).getTime() : 0);
            const bt = b.timestamp && b.timestamp.toDate ? b.timestamp.toDate().getTime() : (b.timestamp ? new Date(b.timestamp).getTime() : 0);
            return bt - at;
        });
        
        // Limit to most recent 10
        const recent = related.slice(0, 10);
        
        playerTransactions = recent;
        
        recent.forEach(transaction => {
            const transactionItem = document.createElement('div');
            transactionItem.className = 'transaction-item';
            
            // Determinar tipo y clase CSS
            let typeClass, typeText, description;
            
            if (transaction.from === currentPlayer.playerName) {
                typeClass = 'type-sent';
                typeText = 'Enviado a';
                description = `${transaction.to}`;
            } else {
                typeClass = 'type-received';
                typeText = 'Recibido de';
                description = `${transaction.from}`;
            }
            
            const ts = transaction.timestamp && transaction.timestamp.toDate ? transaction.timestamp.toDate() : (transaction.timestamp ? new Date(transaction.timestamp) : null);
            const dateStr = ts ? ts.toLocaleString() : '';
            
            transactionItem.innerHTML = `
                <div>
                    <strong>${typeText}: ${description}</strong>
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

// Configurar tabs
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Remover clase active de todos
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Agregar clase active al tab seleccionado
            btn.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

// Pagar a otro jugador
async function payToPlayer(e) {
    e.preventDefault();
    
    const toPlayer = document.getElementById('toPlayer').value;
    const amount = parseInt(document.getElementById('amountToPlayer').value);
    
    if (!toPlayer) {
        alert('Por favor, selecciona un jugador.');
        return;
    }
    
    if (!amount || amount <= 0) {
        alert('Por favor, ingresa un monto válido.');
        return;
    }
    
    if (amount > playerData.balance) {
        alert('No tienes suficiente saldo para realizar esta transacción.');
        return;
    }
    
    try {
        const batch = db.batch();
        
        // Referencias a los documentos
        const fromPlayerRef = db.collection('games').doc(currentPlayer.gameName)
            .collection('players').doc(currentPlayer.playerName);
        
        const toPlayerRef = db.collection('games').doc(currentPlayer.gameName)
            .collection('players').doc(toPlayer);
        
        // Actualizar saldos
        batch.update(fromPlayerRef, {
            balance: firebase.firestore.FieldValue.increment(-amount)
        });
        
        batch.update(toPlayerRef, {
            balance: firebase.firestore.FieldValue.increment(amount)
        });
        
        // Crear transacción
        const transactionRef = db.collection('games').doc(currentPlayer.gameName)
            .collection('transactions').doc();
        
        batch.set(transactionRef, {
            from: currentPlayer.playerName,
            to: toPlayer,
            amount: amount,
            type: 'sent',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Ejecutar transacción
        await batch.commit();
        

        
        showToast('Transferencia con éxito', 'success', 3000);
        
        // Limpiar formulario
        document.getElementById('payPlayerForm').reset();
        
        // Actualizar datos
        await Promise.all([
            loadPlayerData(),
            loadOtherPlayers(),
            loadPlayerTransactions()
        ]);
        
    } catch (error) {
        console.error('Error realizando pago:', error);
        alert('Error al realizar el pago. Intenta nuevamente.');
    }
}

// Pagar al banco
async function payToBank(e) {
    e.preventDefault();
    
    const amount = parseInt(document.getElementById('amountToBank').value);
    
    if (!amount || amount <= 0) {
        alert('Por favor, ingresa un monto válido.');
        return;
    }
    
    if (amount > playerData.balance) {
        alert('No tienes suficiente saldo para realizar esta transacción.');
        return;
    }
    
    try {
        // Actualizar saldo del jugador
        const playerRef = db.collection('games').doc(currentPlayer.gameName)
            .collection('players').doc(currentPlayer.playerName);
        
        await playerRef.update({
            balance: firebase.firestore.FieldValue.increment(-amount)
        });
        
        // Crear transacción
        await db.collection('games').doc(currentPlayer.gameName)
            .collection('transactions').add({
                from: currentPlayer.playerName,
                to: 'Banco',
                amount: amount,
                type: 'sent',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        
        showToast(`Pago de $${amount} al banco realizado exitosamente.`, 'success', 3000);
        
        // Limpiar formulario
        document.getElementById('payBankForm').reset();
        
        // Actualizar datos
        await Promise.all([
            loadPlayerData(),
            loadPlayerTransactions()
        ]);
        
    } catch (error) {
        console.error('Error pagando al banco:', error);
        alert('Error al pagar al banco. Intenta nuevamente.');
    }
}

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', initPlayerDashboard);