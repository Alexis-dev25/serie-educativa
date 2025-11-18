function elegirAleatorio(lista) {
        let indice = Math.floor(Math.random() * lista.length);
        return lista[indice];
}

const readline = require('readline');

const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
});

let caras  = ["sello", "cruz"];
let cpu = elegirAleatorio(caras);
console.log("Opciones: (Sello)  (cruz)");
rl.question("¿Que cara escojes? ".toLocaleLowerCase() , function(user){
    if (user == cpu) {
        console.log("Ganaste!!")
    }
    else {
        console.log("Has perdido!! callo" , cpu)
    }
});
