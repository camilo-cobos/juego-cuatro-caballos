// Configuración de Firebase (la obtendrás en el Paso 5)
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
let caballoSeleccionado = null; // Guardará la posición del caballo seleccionado

function crearTablero() {
  tamaño = parseInt(document.getElementById("tamano").value);
  const contenedor = document.getElementById("tablero");
  contenedor.innerHTML = "";
  contenedor.style.gridTemplateColumns = `repeat(${tamaño}, 1fr)`;
  
  // Inicializar tablero
  tablero = Array(tamaño).fill().map(() => Array(tamaño).fill(null));
  
  // Posiciones iniciales de los caballos
  tablero[0][0] = { color: 'blanco' };
  tablero[0][tamaño-1] = { color: 'blanco' };
  tablero[tamaño-1][0] = { color: 'negro' };
  tablero[tamaño-1][tamaño-1] = { color: 'negro' };
  
  // Dibujar tablero
  dibujarTablero();
}

function dibujarTablero() {
  const contenedor = document.getElementById("tablero");
  contenedor.innerHTML = "";
  
  for (let i = 0; i < tamaño; i++) {
    for (let j = 0; j < tamaño; j++) {
      const celda = document.createElement("div");
      celda.className = "celda";
      celda.dataset.fila = i;
      celda.dataset.columna = j;
      
      if (tablero[i][j]) {
        const caballo = document.createElement("div");
        caballo.className = `caballo ${tablero[i][j].color}`;
        celda.appendChild(caballo);
      }
      
      celda.addEventListener("click", () => manejarClick(i, j));
      contenedor.appendChild(celda);
    }
  }
}

function manejarClick(fila, columna) {
  // Si no hay caballo seleccionado y la celda tiene un caballo
  if (!caballoSeleccionado && tablero[fila][columna]) {
    caballoSeleccionado = { fila, columna, color: tablero[fila][columna].color };
    console.log(`Caballo seleccionado: ${fila}, ${columna}`);
    return;
  }

  // Si ya hay un caballo seleccionado y se hace clic en una celda vacía
  if (caballoSeleccionado && !tablero[fila][columna]) {
    if (esMovimientoValido(caballoSeleccionado, { fila, columna })) {
      // Mover el caballo
      tablero[fila][columna] = { color: caballoSeleccionado.color };
      tablero[caballoSeleccionado.fila][caballoSeleccionado.columna] = null;
      
      // Guardar movimiento en Firebase
      database.ref('partidas/' + partidaId + '/movimientos').push({
        origen: caballoSeleccionado,
        destino: { fila, columna },
        timestamp: Date.now()
      });
      
      // Redibujar tablero y resetear selección
      dibujarTablero();
      caballoSeleccionado = null;
    } else {
      console.log("Movimiento no válido (no es en 'L')");
    }
  }
}

function esMovimientoValido(origen, destino) {
  const dx = Math.abs(destino.fila - origen.fila);
  const dy = Math.abs(destino.columna - origen.columna);
  return (dx === 2 && dy === 1) || (dx === 1 && dy === 2);
}

let movimientos = 0;

function actualizarContador() {
  const contadorElement = document.getElementById('contador-movimientos');
  if (contadorElement) {
    contadorElement.textContent = `Movimientos: ${movimientos}`;
  }
}

function reiniciarContador() {
  movimientos = 0;
  actualizarContador();

// Inicializar el juego al cargar la página
window.onload = crearTablero;

// ... (configuración de Firebase y variables anteriores permanecen igual)

function verificarVictoria() {
  // Posiciones objetivo (inversas a las iniciales)
  const esquinaSuperiorIzquierda = tablero[0][0];
  const esquinaSuperiorDerecha = tablero[0][tamaño-1];
  const esquinaInferiorIzquierda = tablero[tamaño-1][0];
  const esquinaInferiorDerecha = tablero[tamaño-1][tamaño-1];

  // Condición de victoria: caballos negros arriba, blancos abajo
  const victoriaBlancosAbajo = 
    esquinaInferiorIzquierda?.color === 'blanco' && 
    esquinaInferiorDerecha?.color === 'blanco';
  const victoriaNegrosArriba = 
    esquinaSuperiorIzquierda?.color === 'negro' && 
    esquinaSuperiorDerecha?.color === 'negro';

  if (victoriaBlancosAbajo && victoriaNegrosArriba) {
    mostrarMensaje("¡Ganaste! Los caballos han intercambiado posiciones.");
    // Guardar en Firebase que la partida terminó
    database.ref('partidas/' + partidaId).update({ estado: "ganado" });
  }
}

function mostrarMensaje(texto) {
  const mensaje = document.createElement("div");
  mensaje.className = "mensaje-victoria";
  mensaje.textContent = texto;
  
  // Estilo básico (mejorable en CSS)
  mensaje.style.position = "fixed";
  mensaje.style.top = "50%";
  mensaje.style.left = "50%";
  mensaje.style.transform = "translate(-50%, -50%)";
  mensaje.style.backgroundColor = "white";
  mensaje.style.padding = "20px";
  mensaje.style.border = "2px solid gold";
  mensaje.style.zIndex = "1000";
  
  document.body.appendChild(mensaje);
  
  // Eliminar el mensaje después de 5 segundos
  setTimeout(() => mensaje.remove(), 5000);
}

// Añadir esta línea al final de la función `manejarClick` (después de mover el caballo):
verificarVictoria();
