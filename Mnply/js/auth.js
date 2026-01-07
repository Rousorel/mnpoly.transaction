// js/auth.js

// Variables globales
let currentGame = null;
let currentPlayer = null;

// Función para determinar el rol desde la URL
function getRoleFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('role') || 'bank';
}

// Configurar la página de login según el rol
function setupLoginPage() {
    const role = getRoleFromUrl();
    const roleIndicator = document.getElementById('roleIndicator');
    const loginInstructions = document.getElementById('loginInstructions');
    const playerNameField = document.getElementById('playerNameField');
    const submitBtn = document.getElementById('submitBtn');
    const createSection = document.getElementById('createGameSection');
    
    if (role === 'bank') {
        roleIndicator.innerHTML = '<i class="fas fa-university"></i> Acceso como Banco';
        roleIndicator.className = 'role-indicator role-bank';
        loginInstructions.innerHTML = 'Ingresa el nombre del juego y el PIN que creaste para acceder al panel del banco.';
        playerNameField.style.display = 'none';
        submitBtn.innerHTML = '<i class="fas fa-university"></i> Acceder como Banco';
        if (createSection) createSection.style.display = 'block';
    } else {
        roleIndicator.innerHTML = '<i class="fas fa-user"></i> Acceso como Jugador';
        roleIndicator.className = 'role-indicator role-player';
        loginInstructions.innerHTML = 'Ingresa el nombre del juego, el PIN proporcionado por el banco y selecciona tu nombre de jugador.';
        playerNameField.style.display = 'block';
        submitBtn.innerHTML = '<i class="fas fa-user"></i> Acceder como Jugador';
        if (createSection) createSection.style.display = 'none';
    }
}

// Manejar el login
async function handleLogin(e) {
    e.preventDefault();
    
    const gameName = document.getElementById('gameName').value.trim();
    const pin = document.getElementById('pin').value.trim();
    const role = getRoleFromUrl();
    
    if (!gameName || !pin) {
        alert('Por favor, completa todos los campos requeridos.');
        return;
    }
    
    try {
        // Buscar el juego en Firestore
        const gameRef = db.collection('games').doc(gameName);
        const gameDoc = await gameRef.get();
        
        if (!gameDoc.exists) {
            alert('Juego no encontrado. Verifica el nombre del juego.');
            return;
        }
        
        const gameData = gameDoc.data();
        
        // Verificar el PIN
        if (gameData.pin !== pin) {
            alert('PIN incorrecto. Verifica el PIN proporcionado.');
            return;
        }
        
        if (role === 'bank') {
            // Acceso como banco
            localStorage.setItem('monopolyBankGame', JSON.stringify({
                gameName: gameName,
                pin: pin
            }));
            window.location.href = 'bank-dashboard.html';
        } else {
            // Acceso como jugador
            const playerName = document.getElementById('playerName').value.trim();
            
            if (!playerName) {
                alert('Por favor, ingresa tu nombre de jugador.');
                return;
            }
            
            // Verificar que el jugador exista
            const playerRef = gameRef.collection('players').doc(playerName);
            const playerDoc = await playerRef.get();
            
            if (!playerDoc.exists) {
                alert('Jugador no encontrado en este juego. Verifica tu nombre.');
                return;
            }
            
            localStorage.setItem('monopolyPlayer', JSON.stringify({
                gameName: gameName,
                pin: pin,
                playerName: playerName
            }));
            
            window.location.href = 'player-dashboard.html';
        }
    } catch (error) {
        console.error('Error en login:', error);
        alert('Error al acceder al juego. Intenta nuevamente.');
    }
}

// Crear un nuevo juego (solo para el banco)
async function createGame(e) {
    e.preventDefault();

    const gameName = document.getElementById('createGameName').value.trim();
    const pin = document.getElementById('createPin').value.trim();
    const initialMoney = parseInt(document.getElementById('initialMoney').value, 10) || 1500;

    if (!gameName || !pin) {
        alert('Por favor, completa el nombre del juego y el PIN.');
        return;
    }

    try {
        const gameRef = db.collection('games').doc(gameName);
        const gameDoc = await gameRef.get();

        if (gameDoc.exists) {
            alert('Ya existe un juego con ese nombre. Elige otro nombre.');
            return;
        }

        await gameRef.set({
            pin: pin,
            initialMoney: initialMoney,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Guardar sesión del banco y redirigir al dashboard
        localStorage.setItem('monopolyBankGame', JSON.stringify({
            gameName: gameName,
            pin: pin
        }));

        window.location.href = 'bank-dashboard.html';

    } catch (error) {
        console.error('Error creando el juego:', error);
        alert('Error al crear el juego. Intenta nuevamente.');
    }
}

// Verificar si hay sesión activa
function checkAuth() {
    const bankSession = localStorage.getItem('monopolyBankGame');
    const playerSession = localStorage.getItem('monopolyPlayer');
    
    if (window.location.pathname.includes('bank-dashboard.html')) {
        if (!bankSession) {
            window.location.href = 'index.html';
            return;
        }
        
        try {
            currentGame = JSON.parse(bankSession);
        } catch (e) {
            localStorage.removeItem('monopolyBankGame');
            window.location.href = 'index.html';
        }
    }
    
    if (window.location.pathname.includes('player-dashboard.html')) {
        if (!playerSession) {
            window.location.href = 'index.html';
            return;
        }
        
        try {
            currentPlayer = JSON.parse(playerSession);
        } catch (e) {
            localStorage.removeItem('monopolyPlayer');
            window.location.href = 'index.html';
        }
    }
}

// Logout
function logout() {
    if (window.location.pathname.includes('bank-dashboard.html')) {
        localStorage.removeItem('monopolyBankGame');
    } else {
        localStorage.removeItem('monopolyPlayer');
    }
    window.location.href = 'index.html';
}

// Inicializar eventos cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Configurar página de login
    if (window.location.pathname.includes('login.html')) {
        setupLoginPage();
        
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }

        // Crear juego (solo en la vista de banco)
        const createGameForm = document.getElementById('createGameForm');
        if (createGameForm) {
            createGameForm.addEventListener('submit', createGame);
        }
    }
    
    // Configurar botones de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Verificar autenticación en dashboards
    if (window.location.pathname.includes('dashboard.html')) {
        checkAuth();
    }
});