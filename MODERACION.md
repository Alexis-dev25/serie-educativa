/*
  SISTEMA DE MODERACIÓN DE COMENTARIOS
  =====================================
  
  Este módulo (moderator.js) implementa un sistema robusto de moderación para comentarios.
  
  CARACTERÍSTICAS:
  
  1. DETECCIÓN DE PALABRAS OFENSIVAS
     - Detecta palabras ofensivas en español e inglés
     - Utiliza expresiones regulares con límites de palabra para evitar falsos positivos
     - Ejemplo: "ass" no coincidirá en "assistant"
  
  2. EVASIÓN DE FILTROS
     - Detecta intentos de evadir el filtro reemplazando vocales con números
     - Ejemplo: "p1d3j0" será detectado como "pendejo"
     - También detecta caracteres especiales y espacios insertados
  
  3. REPETICIÓN EXCESIVA
     - Detecta repetición de caracteres (más de 3 consecutivos)
     - Ejemplo: "jajajajaja" o "ooooooh" serán rechazados
  
  4. DETECCIÓN DE SPAM
     - Detecta URLs (http, https, www, .com, .net, etc.)
     - Detecta emails
     - Detecta números de teléfono
     - Detecta proporción excesiva de números en el texto
  
  5. LENGUAJE AMENAZANTE
     - Detecta patrones de amenazas de violencia
     - Detecta referencias a armas, explosivos, etc.
     - Detecta menciones de suicidio
  
  6. VALIDACIONES BÁSICAS
     - Verificar longitud mínima y máxima (3-500 caracteres)
     - Rechazar comentarios vacíos
  
  PALABRAS OFENSIVAS DETECTADAS:
  
  En español se detectan términos como:
  - Palabras ofensivas directas (pendejo, mierda, puta, etc.)
  - Insultos hacia grupos (mogólico, boludo, etc.)
  - Términos discriminatorios (racistas, homofóbicos, etc.)
  - Más de 200+ palabras ofensivas
  
  En inglés se detectan términos como:
  - Palabras ofensivas directas (ass, bitch, fuck, shit, etc.)
  - Insultos hacia grupos (nigga, faggot, dyke, etc.)
  - Términos discriminatorios y ofensivos
  - Más de 400+ palabras ofensivas
  
  EJEMPLO DE USO EN COMENTARIOS:
  
  El sistema está integrado en comments.js y se usa automáticamente:
  
  1. Usuario escribe un comentario
  2. Sistema llama a moderator.moderate(text)
  3. Si el comentario pasa todas las validaciones, se publica
  4. Si falla, se muestra un mensaje de error amigable
  5. El intento se guarda en el historial (localStorage)
  
  EJEMPLO DE INTENTOS RECHAZADOS:
  
  ❌ "p1d3j0" → Detectado como intento de evasión de "pendejo"
  ❌ "JAJAJAJAJAJA" → Repetición excesiva
  ❌ "Hola, compra en www.ejemplo.com" → Spam/contenido comercial
  ❌ "Te voy a matar" → Lenguaje amenazante
  ❌ "@#$%!" → Caracteres especiales excesivos
  
  EJEMPLO DE INTENTOS ACEPTADOS:
  
  ✅ "¿Cuál es la mejor forma de aprender JavaScript?"
  ✅ "Excelente tutorial, muy útil"
  ✅ "Tengo una duda sobre Python"
  ✅ "Gracias por compartir este contenido"
  
  MENSAJES DE ERROR AMIGABLES:
  
  El sistema proporciona mensajes claros y constructivos:
  
  - "❌ Tu comentario es muy corto (mínimo 3 caracteres)."
  - "❌ Tu comentario es muy largo (máximo 500 caracteres)."
  - "⚠️ Tu comentario contiene lenguaje inapropiado. Por favor, sé respetuoso."
  - "⚠️ Detectamos un intento de evasión de filtro. Por favor, usa lenguaje apropiado."
  - "🚫 No se permite contenido comercial, URLs ni emails."
  - "🚫 No se permiten comentarios amenazantes. Todos nos merecemos respeto."
  
  HISTORIAL DE MODERACIÓN:
  
  El sistema guarda en localStorage:
  - Intentos rechazados
  - Razón del rechazo
  - Palabra ofensiva detectada
  - Timestamp del intento
  - Máximo 100 entradas en el historial
  
  CÓMO ACCEDER AL MODERADOR:
  
  Desde la consola (F12):
  
  // Ver instancia del moderador
  window.commentSystem.moderator
  
  // Probar manualmente
  window.commentSystem.moderator.moderate("Tu texto aquí")
  
  // Ver historial de moderación
  JSON.parse(localStorage.getItem('moderationHistory'))
  
  NOTAS DE SEGURIDAD:
  
  ⚠️ Este sistema es educativo y de buena fe
  ⚠️ No es 100% impenetrable (usuarios determinados pueden encontrar formas de evasión)
  ⚠️ Se recomienda revisar periódicamente los intentos rechazados
  ⚠️ Para producción, combinar con moderación manual/admin
  ⚠️ Respetar privacidad: no almacenar datos sensibles de usuarios sin consentimiento
  
  PERSONALIZACIÓN:
  
  Para agregar palabras ofensivas:
  
  1. Abre moderator.js
  2. En el constructor, ve a this.bannedWords
  3. Agrega tus palabras a this.bannedWords.spanish o this.bannedWords.english
  4. Ejecuta this.buildRegexes() para reconstruir las expresiones regulares
  5. Guarda y recarga la página
  
  Ejemplo:
  
  constructor() {
      this.bannedWords = {
          spanish: [
              // ... palabras existentes
              'miPalabra', 'otraPalabra'
          ],
          english: [
              // ... palabras existentes
              'myWord', 'anotherWord'
          ]
      };
      this.buildRegexes();
  }
*/

console.log("📋 Sistema de Moderación Cargado");
console.log("ℹ️ Ver documentación en moderator.js para más detalles");
