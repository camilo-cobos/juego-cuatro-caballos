// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDpHCOGmcURKva-4dZoLSjRSB8uDLRonvY",
  authDomain: "juego-cuatro-caballos.firebaseapp.com",
  databaseURL: "https://juego-cuatro-caballos-default-rtdb.firebaseio.com",
  projectId: "juego-cuatro-caballos",
  storageBucket: "juego-cuatro-caballos.firebasestorage.app",
  messagingSenderId: "237974220914",
  appId: "1:237974220914:web:c82f1a6cfed878d1eb92eb"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Variables del juego
let tablero = [];
let tamaño = 3;
let partidaId = Date.now().toString();
let caballoSeleccionado = null;
let movimientos = 0;

// Elementos del DOM
const contenedorTablero = document.getElementById("tablero");
const inputTamaño = document.getElementById("tamano");
const btnReiniciar = document.getElementById("reiniciar-btn");

// Funciones principales
function inicializarJuego() {
  crearTablero();
  actualizarContador();
  configurarEventos();
}

function crearTablero() {
  tamaño = parseInt(inputTamaño.value);
  contenedorTablero.innerHTML = "";
  contenedorTablero.style.gridTemplateColumns = `repeat(${tamaño}, 1fr)`;
  
  // Inicializar tablero
  tablero = Array(tamaño).fill().map(() => Array(tamaño).fill(null));
  
  // Posiciones iniciales
  tablero[0][0] = { color: 'blanco' };
  tablero[0][tamaño-1] = { color: 'blanco' };
  tablero[tamaño-1][0] = { color: 'negro' };
  tablero[tamaño-1][tamaño-1] = { color: 'negro' };
  
  dibujarTablero();
}

function dibujarTablero() {
  contenedorTablero.innerHTML = "";
  
  for (let i = 0; i < tamaño; i++) {
    for (let j = 0; j < tamaño; j++) {
      const celda = document.createElement("div");
      celda.className = "celda";
      celda.dataset.fila = i;
      celda.dataset.columna = j;
      
      if (caballoSeleccionado?.fila === i && caballoSeleccionado?.columna === j) {
        celda.classList.add("seleccionada");
      }
      
      if (tablero[i][j]) {
        const caballo = document.createElement("div");
        caballo.className = `caballo ${tablero[i][j].color}`;
        celda.appendChild(caballo);
      }
      
      celda.addEventListener("click", () => manejarClick(i, j));
      contenedorTablero.appendChild(celda);
    }
  }
}

function manejarClick(fila, columna) {
  // Selección de caballo
  if (!caballoSeleccionado && tablero[fila][columna]) {
    caballoSeleccionado = { fila, columna, color: tablero[fila][columna].color };
    dibujarTablero();
    return;
  }

  // Movimiento válido
  if (caballoSeleccionado && !tablero[fila][columna]) {
    if (esMovimientoValido(caballoSeleccionado, { fila, columna })) {
      // Realizar movimiento
      tablero[fila][columna] = { color: caballoSeleccionado.color };
      tablero[caballoSeleccionado.fila][caballoSeleccionado.columna] = null;
      movimientos++;
      
      // Actualizar interfaz
      actualizarContador();
      dibujarTablero();
      
      // Guardar en Firebase
      guardarMovimiento(caballoSeleccionado, { fila, columna });
      
      // Verificar victoria
      verificarVictoria();
      
      caballoSeleccionado = null;
    } else {
      console.log("Movimiento no válido");
    }
  }
}

function esMovimientoValido(origen, destino) {
  const dx = Math.abs(destino.fila - origen.fila);
  const dy = Math.abs(destino.columna - origen.columna);
  return (dx === 2 && dy === 1) || (dx === 1 && dy === 2);
}

function guardarMovimiento(origen, destino) {
  database.ref('partidas/' + partidaId + '/movimientos').push({
    origen,
    destino,
    timestamp: Date.now(),
    movimientoNumero: movimientos
  });
}

function verificarVictoria() {
  const victoriaBlancos = tablero[tamaño-1][0]?.color === 'blanco' && 
                         tablero[tamaño-1][tamaño-1]?.color === 'blanco';
  const victoriaNegros = tablero[0][0]?.color === 'negro' && 
                        tablero[0][tamaño-1]?.color === 'negro';

  if (victoriaBlancos && victoriaNegros) {
    mostrarMensaje(`¡Ganaste en ${movimientos} movimientos!`);
    database.ref('partidas/' + partidaId).update({ 
      estado: "ganado",
      movimientosTotales: movimientos,
      fechaFin: new Date().toISOString()
    });
  }
}

function mostrarMensaje(texto) {
  const mensaje = document.createElement("div");
  mensaje.className = "mensaje-victoria";
  mensaje.textContent = texto;
  document.body.appendChild(mensaje);
  setTimeout(() => mensaje.remove(), 5000);
}

function reiniciarPartida() {
  if (database && partidaId) {
    database.ref('partidas/' + partidaId).remove()
      .catch(error => console.error("Error al eliminar partida:", error));
  }
  
  partidaId = Date.now().toString();
  movimientos = 0;
  caballoSeleccionado = null;
  crearTablero();
  actualizarContador();
}

function actualizarContador() {
  const contadorElement = document.getElementById('contador-movimientos');
  if (contadorElement) {
    contadorElement.textContent = `Movimientos: ${movimientos}`;
  }
}

function configurarEventos() {
  if (btnReiniciar) {
    btnReiniciar.addEventListener('click', reiniciarPartida);
  }
}

// Inicialización
window.onload = inicializarJuego;
