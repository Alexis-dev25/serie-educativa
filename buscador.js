const buscador = document.getElementById("buscador");
    const lista = document.getElementById("lista").getElementsByTagName("li");

    buscador.addEventListener("keyup", function() {
        let filtro = buscador.value.toLowerCase();
        for (let i = 0; i < lista.length; i++) {
        let texto = lista[i].textContent.toLowerCase();
        lista[i].style.display = texto.includes(filtro) ? "" : "none";
        }
    });