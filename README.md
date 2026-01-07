# Banca Electrónica para Monopoly

Aplicación web para gestionar las finanzas de una partida de Monopoly usando HTML, CSS, JavaScript y Firebase.

## Características

### Para el Banco:
- Crear un nuevo juego con nombre único y PIN
- Establecer monto inicial para los jugadores
- Crear cuentas para 2-8 jugadores
- Ver todas las transacciones realizadas
- Monitorear saldos de todos los jugadores

### Para los Jugadores:
- Acceder con nombre del juego, PIN y nombre de jugador
- Ver saldo actual en tiempo real
- Pagar a otros jugadores
- Pagar al banco
- Ver historial de transacciones

## Configuración

### 1. Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto
3. Habilita Firestore Database
4. Ve a Configuración del proyecto > Configuración general
5. Copia los valores de configuración
6. Reemplázalos en `js/firebase-config.js`

### 2. Estructura de Firestore

La aplicación creará automáticamente:
- Colección `games`: Contiene los juegos creados
- Subcolección `players`: Jugadores de cada juego
- Subcolección `transactions`: Historial de transacciones

### 3. Despliegue

Puedes desplegar la aplicación en:
- Firebase Hosting
- GitHub Pages
- Cualquier servidor web estático

## Uso

1. **El Banco crea un juego:**
   - Accede como banco
   - Crea nombre de juego y PIN
   - Establece monto inicial (ej: $1500)

2. **El Banco crea jugadores:**
   - Agrega nombres de jugadores (2-8)
   - Cada jugador recibe el monto inicial

3. **Los Jugadores acceden:**
   - Usan nombre del juego y PIN
   - Seleccionan su nombre de jugador
   - Realizan transacciones durante el juego

## Seguridad

- Cada juego tiene PIN único
- Los jugadores solo ven su propia información
- Transacciones validadas en tiempo real
- Sin saldos negativos permitidos

## Tecnologías

- HTML5, CSS3, JavaScript ES6
- Firebase Firestore (Base de datos en tiempo real)
- Firebase Hosting (Opcional para despliegue)

## Notas

- Esta aplicación es para uso recreativo
- Recomendado para partidas presenciales de Monopoly
- Los datos se almacenan en Firestore de Firebase