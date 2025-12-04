const buscador = document.getElementById("buscador");

// Selecciona todos los elementos <li> dentro de la lista
const items = document.querySelectorAll("#lista li");

// Escuchar cambios en el input (keyup + input para mayor compatibilidad)
function filtrarPorTitulo() {
    const filtro = buscador.value.trim().toLowerCase();
    items.forEach(li => {
        const titulo = li.querySelector("h2");
        const textoTitulo = titulo ? titulo.textContent.trim().toLowerCase() : "";
        // Mostrar u ocultar el <li> según si el título contiene el filtro
        li.style.display = textoTitulo.includes(filtro) ? "" : "none";
    });
}

buscador.addEventListener("keyup", filtrarPorTitulo);
buscador.addEventListener("input", filtrarPorTitulo);