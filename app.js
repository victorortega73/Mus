// === ESTADO DE LA APLICACIÓN ===
const estado = {
    equipo1: { puntos: 0, juegos: 0 },
    equipo2: { puntos: 0, juegos: 0 },
    apuestas: { grande: 0, chica: 0, pares: 0, juego: 0 }
};

// === CARGAR / GUARDAR ESTADO ===
function cargarEstado() {
    const guardado = localStorage.getItem('mus-estado-v2');
    if (guardado) {
        try {
            const datos = JSON.parse(guardado);
            Object.assign(estado, datos);
        } catch (e) {
            console.log('Error cargando estado');
        }
    }
    actualizarPantalla();
}

function guardarEstado() {
    localStorage.setItem('mus-estado-v2', JSON.stringify(estado));
}

// === ACTUALIZAR PANTALLA ===
function actualizarPantalla() {
    document.getElementById('puntos1').textContent = estado.equipo1.puntos;
    document.getElementById('juegos1').textContent = estado.equipo1.juegos;
    
    document.getElementById('puntos2').textContent = estado.equipo2.puntos;
    document.getElementById('juegos2').textContent = estado.equipo2.juegos;
    
    document.getElementById('apuesta-grande').textContent = estado.apuestas.grande;
    document.getElementById('apuesta-chica').textContent = estado.apuestas.chica;
    document.getElementById('apuesta-pares').textContent = estado.apuestas.pares;
    document.getElementById('apuesta-juego').textContent = estado.apuestas.juego;
    
    guardarEstado();
}

// === LÓGICA DE PUNTOS ===
function sumarPuntos(equipo, cantidad) {
    estado[equipo].puntos = Math.max(0, estado[equipo].puntos + cantidad);
    actualizarPantalla();
}

function sumarJuego(equipo, cantidad) {
    estado[equipo].juegos = Math.max(0, estado[equipo].juegos + cantidad);
    actualizarPantalla();
    if (cantidad > 0 && navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 200]);
    } else if (navigator.vibrate) {
        navigator.vibrate(30);
    }
}

// === TOQUE EN LOS EQUIPOS (sumar puntos) ===
function configurarEquipo(elementoId, equipo) {
    const el = document.getElementById(elementoId);
    let inicioY = 0;
    let inicioX = 0;
    let tiempoInicio = 0;
    let arrastrando = false;
    let yaResto = false;
    
    el.addEventListener('touchstart', (e) => {
        // Ignorar si el toque viene de un botón
        if (e.target.tagName === 'BUTTON') return;
        
        const t = e.touches[0];
        inicioY = t.clientY;
        inicioX = t.clientX;
        tiempoInicio = Date.now();
        arrastrando = true;
        yaResto = false;
    }, { passive: true });
    
    el.addEventListener('touchmove', (e) => {
        if (!arrastrando) return;
        
        const t = e.touches[0];
        const deltaY = t.clientY - inicioY;
        
        // Deslizar hacia abajo → restar punto
        if (deltaY > 60 && !yaResto) {
            sumarPuntos(equipo, -1);
            yaResto = true;
            if (navigator.vibrate) navigator.vibrate(30);
        }
    }, { passive: true });
    
    el.addEventListener('touchend', (e) => {
        if (!arrastrando) return;
        arrastrando = false;
        
        const tiempo = Date.now() - tiempoInicio;
        const t = e.changedTouches[0];
        const deltaY = Math.abs(t.clientY - inicioY);
        const deltaX = Math.abs(t.clientX - inicioX);
        
        // Toque rápido sin moverse → sumar punto
        if (tiempo < 300 && deltaY < 15 && deltaX < 15 && !yaResto) {
            if (e.target.tagName !== 'BUTTON') {
                sumarPuntos(equipo, 1);
                if (navigator.vibrate) navigator.vibrate(20);
            }
        }
    }, { passive: true });
}

// === BOTONES DE LAS APUESTAS ===
function configurarApuestas() {
    document.querySelectorAll('.apuesta-btn').forEach(btn => {
        const tipo = btn.dataset.tipo;
        const equipo = btn.dataset.equipo;
        let timerLargo = null;
        let yaResetee = false;
        
        btn.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            yaResetee = false;
            
            // Pulsación larga → resetear esa apuesta
            timerLargo = setTimeout(() => {
                estado.apuestas[tipo] = 0;
                actualizarPantalla();
                if (navigator.vibrate) navigator.vibrate(60);
                yaResetee = true;
            }, 600);
        }, { passive: true });
        
        btn.addEventListener('touchend', (e) => {
            e.stopPropagation();
            if (timerLargo) clearTimeout(timerLargo);
            
            // Si no fue pulsación larga, sumamos los puntos de esa apuesta al equipo
            if (!yaResetee) {
                const puntosApuesta = estado.apuestas[tipo];
                if (puntosApuesta > 0) {
                    sumarPuntos(equipo, puntosApuesta);
                    estado.apuestas[tipo] = 0;
                    actualizarPantalla();
                    if (navigator.vibrate) navigator.vibrate(40);
                }
            }
        }, { passive: true });
        
        btn.addEventListener('touchmove', () => {
            if (timerLargo) clearTimeout(timerLargo);
        }, { passive: true });
    });
}

// === TOQUE EN LA ZONA CENTRAL DE LA APUESTA (sumar a la apuesta) ===
function configurarSumarApuestas() {
    document.querySelectorAll('.apuesta-info').forEach(el => {
        const tipo = el.parentElement.dataset.tipo;
        let timerLargo = null;
        let yaResetee = false;
        
        el.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            yaResetee = false;
            
            timerLargo = setTimeout(() => {
                estado.apuestas[tipo] = 0;
                actualizarPantalla();
                if (navigator.vibrate) navigator.vibrate(60);
                yaResetee = true;
            }, 600);
        }, { passive: true });
        
        el.addEventListener('touchend', (e) => {
            e.stopPropagation();
            if (timerLargo) clearTimeout(timerLargo);
            
            if (!yaResetee) {
                estado.apuestas[tipo] += 1;
                actualizarPantalla();
                if (navigator.vibrate) navigator.vibrate(15);
            }
        }, { passive: true });
        
        el.addEventListener('touchmove', () => {
            if (timerLargo) clearTimeout(timerLargo);
        }, { passive: true });
    });
}

// === BOTONES DE JUEGOS ===
function configurarBotonesJuego() {
    document.querySelectorAll('.btn-juego-mas').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            sumarJuego(btn.dataset.equipo, 1);
        });
    });
    
    document.querySelectorAll('.btn-juego-menos').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            sumarJuego(btn.dataset.equipo, -1);
        });
    });
}

// === MODAL DE RESET ===
function mostrarModalReset() {
    document.getElementById('modal-reset').classList.add('visible');
}

function ocultarModalReset() {
    document.getElementById('modal-reset').classList.remove('visible');
}

function resetearPuntos() {
    estado.equipo1.puntos = 0;
    estado.equipo2.puntos = 0;
    estado.apuestas = { grande: 0, chica: 0, pares: 0, juego: 0 };
    actualizarPantalla();
    ocultarModalReset();
}

function resetearTodo() {
    estado.equipo1 = { puntos: 0, juegos: 0 };
    estado.equipo2 = { puntos: 0, juegos: 0 };
    estado.apuestas = { grande: 0, chica: 0, pares: 0, juego: 0 };
    actualizarPantalla();
    ocultarModalReset();
}

// === INICIALIZAR ===
document.addEventListener('DOMContentLoaded', () => {
    cargarEstado();
    configurarEquipo('equipo1', 'equipo1');
    configurarEquipo('equipo2', 'equipo2');
    configurarApuestas();
    configurarSumarApuestas();
    configurarBotonesJuego();
    
    document.getElementById('btn-reset').addEventListener('click', (e) => {
        e.stopPropagation();
        mostrarModalReset();
    });
    
    document.getElementById('reset-puntos').addEventListener('click', resetearPuntos);
    document.getElementById('reset-todo').addEventListener('click', resetearTodo);
    document.getElementById('reset-cancelar').addEventListener('click', ocultarModalReset);
    
    // Evitar zoom por doble toque
    let ultimoTap = 0;
    document.addEventListener('touchend', (e) => {
        const ahora = Date.now();
        if (ahora - ultimoTap < 300) e.preventDefault();
        ultimoTap = ahora;
    });
});
