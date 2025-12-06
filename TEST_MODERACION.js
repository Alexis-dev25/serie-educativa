// TEST MODERACIÓN - Copiar y pegar en la consola (F12) para probar el moderador
// Prueba 1: Comentario válido
console.log("=== PRUEBA DE MODERACIÓN ===");
console.log("\n1️⃣ Comentario válido:");
const test1 = window.commentSystem.moderator.moderate("¡Excelente contenido sobre JavaScript!");
console.log("Entrada: '¡Excelente contenido sobre JavaScript!'");
console.log("Resultado:", test1);

// Prueba 2: Palabra ofensiva en español
console.log("\n2️⃣ Palabra ofensiva en español:");
const test2 = window.commentSystem.moderator.moderate("Esto es una pendejada total");
console.log("Entrada: 'Esto es una pendejada total'");
console.log("Resultado:", test2);

// Prueba 3: Palabra ofensiva en inglés
console.log("\n3️⃣ Palabra ofensiva en inglés:");
const test3 = window.commentSystem.moderator.moderate("This is damn good code");
console.log("Entrada: 'This is damn good code'");
console.log("Resultado:", test3);

// Prueba 4: Intento de evasión con números
console.log("\n4️⃣ Intento de evasión (números por letras):");
const test4 = window.commentSystem.moderator.moderate("P1d3j4d4 total");
console.log("Entrada: 'P1d3j4d4 total'");
console.log("Resultado:", test4);

// Prueba 5: Repetición excesiva
console.log("\n5️⃣ Repetición excesiva de caracteres:");
const test5 = window.commentSystem.moderator.moderate("Jajajajajajajaja");
console.log("Entrada: 'Jajajajajajajaja'");
console.log("Resultado:", test5);

// Prueba 6: URL (spam)
console.log("\n6️⃣ Contenido con URL (spam):");
const test6 = window.commentSystem.moderator.moderate("Compra en www.estafa.com");
console.log("Entrada: 'Compra en www.estafa.com'");
console.log("Resultado:", test6);

// Prueba 7: Email (spam)
console.log("\n7️⃣ Contenido con email (spam):");
const test7 = window.commentSystem.moderator.moderate("Contacta a spam@ejemplo.com");
console.log("Entrada: 'Contacta a spam@ejemplo.com'");
console.log("Resultado:", test7);

// Prueba 8: Lenguaje amenazante
console.log("\n8️⃣ Lenguaje amenazante:");
const test8 = window.commentSystem.moderator.moderate("Te voy a matar");
console.log("Entrada: 'Te voy a matar'");
console.log("Resultado:", test8);

// Prueba 9: Comentario muy corto
console.log("\n9️⃣ Comentario muy corto:");
const test9 = window.commentSystem.moderator.moderate("Hi");
console.log("Entrada: 'Hi'");
console.log("Resultado:", test9);

// Prueba 10: Comentario muy largo
console.log("\n1️⃣0️⃣ Comentario muy largo:");
const test10 = window.commentSystem.moderator.moderate("a".repeat(501));
console.log("Entrada: 'a' repetido 501 veces");
console.log("Resultado:", test10);

// Ver historial de moderación
console.log("\n📋 HISTORIAL DE MODERACIÓN:");
const historial = JSON.parse(localStorage.getItem('moderationHistory') || '[]');
console.log(`Total de intentos rechazados: ${historial.length}`);
if (historial.length > 0) {
    console.log("Últimos intentos:");
    historial.slice(0, 5).forEach((entry, index) => {
        console.log(`  ${index + 1}. [${new Date(entry.timestamp).toLocaleString()}] Razón: ${entry.reason}`);
        if (entry.flaggedWord) console.log(`     Palabra: "${entry.flaggedWord}"`);
    });
}

console.log("\n✅ Pruebas completadas. Revisa la consola para los resultados.");
