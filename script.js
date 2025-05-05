// Configuración de Firebase (la obtendrás en el Paso 5)
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  databaseURL: "https://TU_PROYECTO.firebaseio.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Variables del juego
let tablero = [];
let tamaño = 3;
let partidaId = Date.now().toString(); // ID único para cada partida

function crearTablero() {
  tamaño = parseInt(document.getElementById("tamano").value);
  const contenedor = document.getElementById("tablero");
  contenedor.innerHTML = "";
  contenedor.style.gridTemplateColumns = `repeat(${tamaño}, 1fr)`;
  
  // Inicializar tablero
  tablero = Array(tamaño).fill().map(() => Array(tamaño).fill(null));
  
  // Posiciones iniciales
  tablero[0][0] = { color: 'blanco' };
  tablero[0][tamaño-1] = { color: 'blanco' };
  tablero[tamaño-1][0] = { color: 'negro' };
  tablero[tamaño-1][tamaño-1] = { color: 'negro' };
  
  // Dibujar tablero
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
      
      celda.addEventListener("click", manejarClick);
      contenedor.appendChild(celda);
    }
  }
}

function manejarClick(e) {
  const fila = parseInt(e.target.dataset.fila);
  const columna = parseInt(e.target.dataset.columna);
  console.log(`Clic en: ${fila}, ${columna}`);
  
  // Guardar movimiento en Firebase
  database.ref('partidas/' + partidaId + '/movimientos').push({
    fila,
    columna,
    timestamp: Date.now()
  });
}

// Inicializar
window.onload = crearTablero;
