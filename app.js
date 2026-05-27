// === ESTADO DE LA APLICACIÓN ===
const estado = {
    equipo1: { piedras: 0, amarrakos: 0, juegos: 0 },
    equipo2: { piedras: 0, amarrakos: 0, juegos: 0 },
    apuestas: { grande: 0, chica: 0, pares: 0, juego: 0 }
};

const PIEDRAS_POR_AMARRAKO = 5;
const AMARRAKOS_POR_JUEGO = 8; // 8 amarrakos x 5 piedras = 40 puntos

// === CARGAR ESTADO GUARDADO ===
function cargarEstado() {
    const guardado = localStorage.getItem('mus-estado');
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
    localStorage.setItem('mus-estado', JSON.stringify(estado));
}

// === ACTUALIZAR PANTALLA ===
function actualizarPantalla() {
    document.getElementById('piedras1').textContent = estado.equipo1.piedras;
    document.getElementById('amarrakos1').textContent = estado.equipo1.amarrakos;
    document.getElementById('juegos1').textContent = estado.equipo1.juegos;
    
    document.getElementById('piedras2').textContent = estado.equipo2.piedras;
    document.getElementById('amarrakos2').textContent = estado.equipo2.amarrakos;
    document.getElementById('juegos2').textContent = estado.equipo2.juegos;
    
    document.getElementById('apuesta-grande').textContent = estado.apuestas.grande;
    document.getElementById('apuesta-chica').textContent = estado.apuestas.chica;
    document.getElementById('apuesta-pares').textContent = estado.apuestas.pares;
    document.getElementById('apuesta-juego').textContent = estado.apuestas.juego;
    
    guardarEstado();
}

// === LÓGICA DE PUNTOS ===
function sumarPiedras(equipo, cantidad) {
    const e = estado[equipo];
    e.piedras += cantidad;
    
    // Convertir piedras a amarrakos
    while (e.piedras >= PIEDRAS_POR_AMARRAKO) {
        e.piedras -= PIEDRAS_POR_AMARRAKO;
        e.amarrakos += 1;
    }
    
    // Convertir amarrakos a juego
    if (e.amarrakos >= AMARRAKOS_POR_JUEGO) {
        e.amarrakos = 0;
        e.piedras = 0;
        e.juegos += 1;
        // También reseteamos el otro equipo (nueva partida)
        const otroEquipo = equipo === 'equipo1' ? 'equipo2' : 'equipo1';
        estado[otroEquipo].piedras = 0;
        estado[otroEquipo].amarrakos = 0;
        // Vibración para celebrar
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
    }
    
    actualizarPantalla();
}

function restarPiedras(equipo, cantidad) {
    const e = estado[equipo];
    let totalPiedras = e.amarrakos * PIEDRAS_POR_AMARRAKO + e.piedras;
    totalPiedras = Math.max(0, totalPiedras - cantidad);
    e.amarrakos = Math.floor(totalPiedras / PIEDRAS_POR_AMARRAKO);
    e.piedras = totalPiedras % PIEDRAS_POR_AMARRAKO;
    actualizarPantalla();
}

// === GESTIÓN DEL TOQUE / DESLIZAMIENTO EN EQUIPOS ===
function configurarEquipo(elementoId, equipo) {
    const el = document.getElementById(elementoId);
    let inicioY = 0;
    let inicioX = 0;
    let tiempoInicio = 0;
    let arrastrando = false;
    let yaResto = false;
    
    el.addEventListener('touchstart', (e) => {
        // Ignorar si el toque viene de la zona central
        if (e.target.closest('.centro')) return;
        
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
        let deltaY = t.clientY - inicioY;
        
        // Si el equipo está rotado (equipo 2), invertimos la lógica
        if (equipo === 'equipo2') deltaY = -deltaY;
        
        // Si desliza hacia abajo más de 40px, mostrar indicador
        if (deltaY > 40) {
            el.classList.add('deslizando');
            // Restar una piedra (solo una vez por gesto)
            if (deltaY > 60 && !yaResto) {
                restarPiedras(equipo, 1);
                yaResto = true;
                if (navigator.vibrate) navigator.vibrate(30);
            }
        } else {
            el.classList.remove('deslizando');
        }
    }, { passive: true });
    
    el.addEventListener('touchend', (e) => {
        if (!arrastrando) return;
        arrastrando = false;
        el.classList.remove('deslizando');
        
        const tiempo = Date.now() - tiempoInicio;
        const t = e.changedTouches[0];
        const deltaY = Math.abs(t.clientY - inicioY);
        const deltaX = Math.abs(t.clientX - inicioX);
        
        // Si fue un toque rápido sin moverse → sumar
        if (tiempo < 300 && deltaY < 15 && deltaX < 15 && !yaResto) {
            // Verificar que no se toque la zona central
            if (!e.target.closest('.centro') && !e.target.closest('.modal')) {
                sumarPiedras(equipo, 1);
                if (navigator.vibrate) navigator.vibrate(20);
            }
        }
    }, { passive: true });
}

// === APUESTAS DEL CENTRO ===
function configurarApuestas() {
    document.querySelectorAll('.apuesta').forEach(el => {
        const tipo = el.dataset.tipo;
        
        let tiempoToque = 0;
        
        el.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            tiempoToque = Date.now();
        }, { passive: true });
        
        el.addEventListener('touchend', (e) => {
            e.stopPropagation();
            const duracion = Date.now() - tiempoToque;
            
            if (duracion < 400) {
                // Toque corto: sumar
                estado.apuestas[tipo] += 1;
                el.classList.add('activa');
            }
            actualizarPantalla();
        }, { passive: true });
        
        // Pulsación larga: resetear ese marcador
        let timerLargo = null;
        el.addEventListener('touchstart', (e) => {
            timerLargo = setTimeout(() => {
                estado.apuestas[tipo] = 0;
                el.classList.remove('activa');
                actualizarPantalla();
                if (navigator.vibrate) navigator.vibrate(50);
            }, 600);
        }, { passive: true });
        
        el.addEventListener('touchend', () => {
            if (timerLargo) clearTimeout(timerLargo);
        }, { passive: true });
        
        el.addEventListener('touchmove', () => {
            if (timerLargo) clearTimeout(timerLargo);
        }, { passive: true });
    });
}

// === BOTONES DE RESOLVER LA RONDA ===
function totalApuestas() {
    return estado.apuestas.grande + estado.apuestas.chica + 
           estado.apuestas.pares + estado.apuestas.juego;
}

function resolverRonda(equipo) {
    const total = totalApuestas();
    if (total === 0) return;
    
    sumarPiedras(equipo, total);
    
    // Resetear las apuestas
    estado.apuestas.grande = 0;
    estado.apuestas.chica = 0;
    estado.apuestas.pares = 0;
    estado.apuestas.juego = 0;
    
    document.querySelectorAll('.apuesta').forEach(el => el.classList.remove('activa'));
    actualizarPantalla();
    
    if (navigator.vibrate) navigator.vibrate(40);
}

// === MODAL DE RESET ===
function mostrarModalReset() {
    document.getElementById('modal-reset').classList.add('visible');
}

function ocultarModalReset() {
    document.getElementById('modal-reset').classList.remove('visible');
}

function resetearPiedras() {
    estado.equipo1.piedras = 0;
    estado.equipo1.amarrakos = 0;
    estado.equipo2.piedras = 0;
    estado.equipo2.amarrakos = 0;
    estado.apuestas = { grande: 0, chica: 0, pares: 0, juego: 0 };
    document.querySelectorAll('.apuesta').forEach(el => el.classList.remove('activa'));
    actualizarPantalla();
    ocultarModalReset();
}

function resetearTodo() {
    estado.equipo1 = { piedras: 0, amarrakos: 0, juegos: 0 };
    estado.equipo2 = { piedras: 0, amarrakos: 0, juegos: 0 };
    estado.apuestas = { grande: 0, chica: 0, pares: 0, juego: 0 };
    document.querySelectorAll('.apuesta').forEach(el => el.classList.remove('activa'));
    actualizarPantalla();
    ocultarModalReset();
}

// === INICIALIZAR ===
document.addEventListener('DOMContentLoaded', () => {
    cargarEstado();
    configurarEquipo('equipo1', 'equipo1');
    configurarEquipo('equipo2', 'equipo2');
    configurarApuestas();
    
    document.getElementById('btn-resolver-1').addEventListener('click', (e) => {
        e.stopPropagation();
        resolverRonda('equipo1');
    });
    
    document.getElementById('btn-resolver-2').addEventListener('click', (e) => {
        e.stopPropagation();
        resolverRonda('equipo2');
    });
    
    document.getElementById('btn-reset').addEventListener('click', (e) => {
        e.stopPropagation();
        mostrarModalReset();
    });
    
    document.getElementById('reset-piedras').addEventListener('click', resetearPiedras);
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
