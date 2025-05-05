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
let turnoActual = 'negro'; // Empiezan los negros
let totalReinicios = 0;
let jugadorId = localStorage.getItem('jugadorId') || Date.now().toString();
let partidaActiva = true;

// Almacenar ID del jugador si no existe
if (!localStorage.getItem('jugadorId')) {
  localStorage.setItem('jugadorId', jugadorId);
}

// Elementos del DOM
const contenedorTablero = document.getElementById("tablero");
const inputTamaño = document.getElementById("tamano");
const btnReiniciar = document.getElementById("reiniciar-btn");
const indicadorTurno = document.createElement("div");
indicadorTurno.id = "indicador-turno";
document.querySelector(".controls").appendChild(indicadorTurno);

// Inicializar datos en Firebase
function inicializarDatosJugador() {
  database.ref('jugadores/' + jugadorId).once('value').then((snapshot) => {
    if (!snapshot.exists()) {
      database.ref('jugadores/' + jugadorId).set({
        fechaRegistro: new Date().toISOString(),
        totalPartidas: 0,
        totalReinicios: 0,
        totalMovimientos: 0,
        partidasGanadas: 0
      });
    }
  });
}

// Funciones principales
function inicializarJuego() {
  inicializarDatosJugador();
  registrarNuevaPartida();
  crearTablero();
  actualizarContador();
  actualizarIndicadorTurno();
  configurarEventos();
}

function registrarNuevaPartida() {
  partidaId = Date.now().toString();
  partidaActiva = true;
  totalReinicios = 0;
  
  database.ref('partidas/' + partidaId).set({
    jugadorId: jugadorId,
    fechaInicio: new Date().toISOString(),
    tamañoTablero: tamaño,
    estado: "en_progreso",
    reinicios: 0,
    movimientos: 0
  });
  
  // Actualizar contador de partidas del jugador
  database.ref('jugadores/' + jugadorId + '/totalPartidas').transaction((current) => {
    return (current || 0) + 1;
  });
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
        
        // Deshabilitar visualmente caballos que no son del turno actual
        if (tablero[i][j].color !== turnoActual) {
          caballo.style.opacity = "0.6";
          caballo.style.cursor = "not-allowed";
        }
        
        celda.appendChild(caballo);
      }
      
      celda.addEventListener("click", () => manejarClick(i, j));
      contenedorTablero.appendChild(celda);
    }
  }
}

function manejarClick(fila, columna) {
  // Si no hay caballo seleccionado
  if (!caballoSeleccionado) {
    // Verificar que el caballo clickeado es del color del turno actual
    if (tablero[fila][columna] && tablero[fila][columna].color === turnoActual) {
      caballoSeleccionado = { fila, columna, color: tablero[fila][columna].color };
      dibujarTablero();
    }
    return;
  }

  // Si ya hay un caballo seleccionado y se hace clic en una celda vacía
  if (caballoSeleccionado && !tablero[fila][columna]) {
    if (esMovimientoValido(caballoSeleccionado, { fila, columna })) {
      // Realizar movimiento
      tablero[fila][columna] = { color: caballoSeleccionado.color };
      tablero[caballoSeleccionado.fila][caballoSeleccionado.columna] = null;
      movimientos++;
      
      // Cambiar turno
      turnoActual = turnoActual === 'negro' ? 'blanco' : 'negro';
      
      // Actualizar interfaz
      actualizarContador();
      actualizarIndicadorTurno();
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

function actualizarIndicadorTurno() {
  indicadorTurno.textContent = `Turno: ${turnoActual === 'negro' ? 'Negros (▲)' : 'Blancos (▼)'}`;
  indicadorTurno.style.color = turnoActual === 'negro' ? '#333' : '#fff';
  indicadorTurno.style.backgroundColor = turnoActual === 'negro' ? '#ddd' : '#666';
  indicadorTurno.style.padding = '5px 10px';
  indicadorTurno.style.borderRadius = '4px';
  indicadorTurno.style.fontWeight = 'bold';
  indicadorTurno.style.margin = '0 10px';
}

function esMovimientoValido(origen, destino) {
  const dx = Math.abs(destino.fila - origen.fila);
  const dy = Math.abs(destino.columna - origen.columna);
  return (dx === 2 && dy === 1) || (dx === 1 && dy === 2);
}

function guardarMovimiento(origen, destino) {
  if (!partidaActiva) return;
  
  const movimientoData = {
    origen,
    destino,
    timestamp: new Date().toISOString(),
    movimientoNumero: movimientos,
    turno: turnoActual === 'negro' ? 'blanco' : 'negro' // Guardamos el turno que acaba de mover
  };
  
  // Guardar movimiento en la partida actual
  database.ref('partidas/' + partidaId + '/movimientos').push(movimientoData);
  
  // Actualizar contador de movimientos de la partida
  database.ref('partidas/' + partidaId).update({
    movimientos: movimientos
  });
  
  // Actualizar contador total de movimientos del jugador
  database.ref('jugadores/' + jugadorId + '/totalMovimientos').transaction((current) => {
    return (current || 0) + 1;
  });
}

function verificarVictoria() {
  const victoriaBlancos = tablero[tamaño-1][0]?.color === 'blanco' && 
                         tablero[tamaño-1][tamaño-1]?.color === 'blanco';
  const victoriaNegros = tablero[0][0]?.color === 'negro' && 
                        tablero[0][tamaño-1]?.color === 'negro';

  if (victoriaBlancos && victoriaNegros) {
    partidaActiva = false;
    mostrarMensaje(`¡Ganaste en ${movimientos} movimientos!`);
    
    // Registrar partida completada en Firebase
    database.ref('partidas/' + partidaId).update({ 
      estado: "completada",
      fechaFin: new Date().toISOString(),
      movimientosTotales: movimientos,
      reinicios: totalReinicios
    });
    
    // Registrar estadísticas de victoria
    database.ref('jugadores/' + jugadorId + '/partidasGanadas').transaction((current) => {
      return (current || 0) + 1;
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
  if (!partidaActiva) return;
  
  // Registrar reinicio
  totalReinicios++;
  
  // Actualizar contadores en Firebase
  database.ref('partidas/' + partidaId).update({
    reinicios: totalReinicios,
    ultimoReinicio: new Date().toISOString()
  });
  
  database.ref('jugadores/' + jugadorId + '/totalReinicios').transaction((current) => {
    return (current || 0) + 1;
  });
  
  // Reiniciar variables del juego (pero mantener la misma partida)
  movimientos = 0;
  caballoSeleccionado = null;
  turnoActual = 'negro';
  
  // Volver a crear el tablero
  crearTablero();
  actualizarContador();
  actualizarIndicadorTurno();
  
  console.log("Partida reiniciada. Total de reinicios:", totalReinicios);
}

function actualizarContador() {
  const contadorElement = document.getElementById('contador-movimientos');
  if (contadorElement) {
    contadorElement.textContent = `Movimientos: ${movimientos} | Reinicios: ${totalReinicios}`;
  }
}

function configurarEventos() {
  if (btnReiniciar) {
    btnReiniciar.addEventListener('click', reiniciarPartida);
  }
  
  // Opcional: Cambiar tamaño del tablero
  const crearTableroBtn = document.getElementById('crear-tablero-btn');
  if (crearTableroBtn) {
    crearTableroBtn.addEventListener('click', () => {
      reiniciarPartida();
    });
  }
}

// Inicialización
window.onload = inicializarJuego;
