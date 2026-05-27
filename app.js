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
    
    // Si se SUMA un juego, reseteamos los puntos de ambos equipos y las apuestas
    if (cantidad > 0) {
        estado.equipo1.puntos = 0;
        estado.equipo2.puntos = 0;
        estado.apuestas = { grande: 0, chica: 0, pares: 0, juego: 0 };
    }
    
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
        
        if (tiempo < 300 && deltaY < 15 && deltaX < 15 && !yaResto) {
            if (e.target.tagName !== 'BUTTON') {
                sumarPuntos(equipo, 1);
                if (navigator.vibrate) navigator.vibrate(20);
            }
        }
    }, { passive: true });
}

// === BOTONES DE LAS FLECHAS DE LAS APUESTAS ===
function configurarApuestas() {
    document.querySelectorAll('.apuesta-btn').forEach(btn => {
        const tipo = btn.dataset.tipo;
        const equipo = btn.dataset.equipo;
        let timerLargo = null;
        let yaResetee = false;
        
        btn.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            yaResetee = false;
            
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

// === TOQUE EN EL CENTRO DEL MINI-MARCADOR (sumar y deslizar para restar) ===
function configurarSumarApuestas() {
    document.querySelectorAll('.apuesta-info').forEach(el => {
        const tipo = el.parentElement.dataset.tipo;
        let timerLargo = null;
        let yaResetee = false;
        let inicioY = 0;
        let inicioX = 0;
        let tiempoInicio = 0;
        let yaResto = false;
        
        el.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            yaResetee = false;
            yaResto = false;
            
            const t = e.touches[0];
            inicioY = t.clientY;
            inicioX = t.clientX;
            tiempoInicio = Date.now();
            
            // Pulsación larga (600ms) → reset total
            timerLargo = setTimeout(() => {
                estado.apuestas[tipo] = 0;
                actualizarPantalla();
                if (navigator.vibrate) navigator.vibrate(60);
                yaResetee = true;
            }, 600);
        }, { passive: true });
        
        el.addEventListener('touchmove', (e) => {
            const t = e.touches[0];
            const deltaY = t.clientY - inicioY;
            const deltaXAbs = Math.abs(t.clientX - inicioX);
            
            // Si se mueve, cancela el timer de pulsación larga
            if (Math.abs(deltaY) > 8 || deltaXAbs > 8) {
                if (timerLargo) {
                    clearTimeout(timerLargo);
                    timerLargo = null;
                }
            }
            
            // Deslizar hacia abajo → restar 1 (solo una vez por gesto)
            if (deltaY > 30 && !yaResto) {
                if (estado.apuestas[tipo] > 0) {
                    estado.apuestas[tipo] -= 1;
                    actualizarPantalla();
                    if (navigator.vibrate) navigator.vibrate(20);
                }
                yaResto = true;
            }
        }, { passive: true });
        
        el.addEventListener('touchend', (e) => {
            e.stopPropagation();
            if (timerLargo) clearTimeout(timerLargo);
            
            const tiempo = Date.now() - tiempoInicio;
            const t = e.changedTouches[0];
            const deltaY = Math.abs(t.clientY - inicioY);
            const deltaX = Math.abs(t.clientX - inicioX);
            
            // Toque corto sin movimiento → sumar 1
            if (!yaResetee && !yaResto && tiempo < 400 && deltaY < 15 && deltaX < 15) {
                estado.apuestas[tipo] += 1;
                actualizarPantalla();
                if (navigator.vibrate) navigator.vibrate(15);
            }
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
    
    // === BLOQUEAR ZOOM EN iOS (varios métodos combinados) ===
    
    // 1. Bloquear doble toque (lo que más molesta)
    let ultimoTap = 0;
    document.addEventListener('touchend', (e) => {
        const ahora = Date.now();
        if (ahora - ultimoTap < 350) {
            e.preventDefault();
        }
        ultimoTap = ahora;
    }, { passive: false });
    
    // 2. Bloquear gesto de pellizco (pinch-to-zoom)
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('gesturechange', (e) => e.preventDefault());
    document.addEventListener('gestureend', (e) => e.preventDefault());
    
    // 3. Bloquear multi-touch (que es lo que detecta iOS para hacer zoom)
    document.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
    
    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
});
