const buscador = document.getElementById("buscador");

// Selecciona todos los elementos <li> (tarjetas) dentro de la lista
const items = Array.from(document.querySelectorAll("#lista .point"));

// Guardar si no existe el buscador (evitar errores en otras páginas)
if (!buscador) {
    console.warn('buscador.js: elemento #buscador no encontrado — búsquedas deshabilitadas');
}

// Debounce para evitar ejecutar la búsqueda en cada pulsación muy rápido
function debounce(fn, wait = 150) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

function filtrarPorTitulo() {
    if (!buscador) return;
    const filtro = (buscador.value || "").trim().toLowerCase();
    if (!filtro) {
        // mostrar todos
        items.forEach(li => li.classList.remove('hidden'));
        return;
    }
    items.forEach(li => {
        const titulo = li.querySelector('h2');
        const texto = titulo ? titulo.textContent.trim().toLowerCase() : '';
        li.classList.toggle('hidden', !texto.includes(filtro));
    });
}

if (buscador) {
    const filtrarDebounced = debounce(filtrarPorTitulo, 150);
    buscador.addEventListener('input', filtrarDebounced);
    buscador.addEventListener('keyup', (e) => { if (e.key === 'Enter') filtrarPorTitulo(); });

    // Inicializar (por si hay texto prellenado)
    filtrarPorTitulo();
}