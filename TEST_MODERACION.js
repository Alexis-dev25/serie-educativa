// TEST MODERACIÓN - Copiar y pegar en la consola (F12) para probar el moderador
// Prueba 1: Comentario válido
window.LOG && window.LOG("=== PRUEBA DE MODERACIÓN ===");
window.LOG && window.LOG("\n1️⃣ Comentario válido:");
const test1 = window.commentSystem.moderator.moderate("¡Excelente contenido sobre JavaScript!");
window.LOG && window.LOG("Entrada: '¡Excelente contenido sobre JavaScript!'");
window.LOG && window.LOG("Resultado:", test1);

// Prueba 2: Palabra ofensiva en español
window.LOG && window.LOG("\n2️⃣ Palabra ofensiva en español:");
const test2 = window.commentSystem.moderator.moderate("Esto es una pendejada total");
window.LOG && window.LOG("Entrada: 'Esto es una pendejada total'");
window.LOG && window.LOG("Resultado:", test2);

// Prueba 3: Palabra ofensiva en inglés
window.LOG && window.LOG("\n3️⃣ Palabra ofensiva en inglés:");
const test3 = window.commentSystem.moderator.moderate("This is damn good code");
window.LOG && window.LOG("Entrada: 'This is damn good code'");
window.LOG && window.LOG("Resultado:", test3);

// Prueba 4: Intento de evasión con números
window.LOG && window.LOG("\n4️⃣ Intento de evasión (números por letras):");
const test4 = window.commentSystem.moderator.moderate("P1d3j4d4 total");
window.LOG && window.LOG("Entrada: 'P1d3j4d4 total'");
window.LOG && window.LOG("Resultado:", test4);

// Prueba 5: Repetición excesiva
window.LOG && window.LOG("\n5️⃣ Repetición excesiva de caracteres:");
const test5 = window.commentSystem.moderator.moderate("Jajajajajajajaja");
window.LOG && window.LOG("Entrada: 'Jajajajajajajaja'");
window.LOG && window.LOG("Resultado:", test5);

// Prueba 6: URL (spam)
window.LOG && window.LOG("\n6️⃣ Contenido con URL (spam):");
const test6 = window.commentSystem.moderator.moderate("Compra en www.estafa.com");
window.LOG && window.LOG("Entrada: 'Compra en www.estafa.com'");
window.LOG && window.LOG("Resultado:", test6);

// Prueba 7: Email (spam)
window.LOG && window.LOG("\n7️⃣ Contenido con email (spam):");
const test7 = window.commentSystem.moderator.moderate("Contacta a spam@ejemplo.com");
window.LOG && window.LOG("Entrada: 'Contacta a spam@ejemplo.com'");
window.LOG && window.LOG("Resultado:", test7);

// Prueba 8: Lenguaje amenazante
window.LOG && window.LOG("\n8️⃣ Lenguaje amenazante:");
const test8 = window.commentSystem.moderator.moderate("Te voy a matar");
window.LOG && window.LOG("Entrada: 'Te voy a matar'");
window.LOG && window.LOG("Resultado:", test8);

// Prueba 9: Comentario muy corto
window.LOG && window.LOG("\n9️⃣ Comentario muy corto:");
const test9 = window.commentSystem.moderator.moderate("Hi");
window.LOG && window.LOG("Entrada: 'Hi'");
window.LOG && window.LOG("Resultado:", test9);

// Prueba 10: Comentario muy largo
window.LOG && window.LOG("\n1️⃣0️⃣ Comentario muy largo:");
const test10 = window.commentSystem.moderator.moderate("a".repeat(501));
window.LOG && window.LOG("Entrada: 'a' repetido 501 veces");
window.LOG && window.LOG("Resultado:", test10);

// Ver historial de moderación
window.LOG && window.LOG("\n📋 HISTORIAL DE MODERACIÓN:");
const historial = JSON.parse(localStorage.getItem('moderationHistory') || '[]');
window.LOG && window.LOG(`Total de intentos rechazados: ${historial.length}`);
if (historial.length > 0) {
    window.LOG && window.LOG("Últimos intentos:");
    historial.slice(0, 5).forEach((entry, index) => {
        window.LOG && window.LOG(`  ${index + 1}. [${new Date(entry.timestamp).toLocaleString()}] Razón: ${entry.reason}`);
        if (entry.flaggedWord) window.LOG && window.LOG(`     Palabra: "${entry.flaggedWord}"`);
    });
}

window.LOG && window.LOG("\n✅ Pruebas completadas. Revisa la consola para los resultados.");
