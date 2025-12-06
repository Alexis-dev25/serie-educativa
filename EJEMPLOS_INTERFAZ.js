/*
  EJEMPLOS VISUALES DEL SISTEMA DE MODERACIÓN
  ============================================
  
  Este archivo muestra cómo se vería en la interfaz del navegador
*/

// ESCENARIO 1: Usuario escribe un comentario válido
// ════════════════════════════════════════════════════════════

Usuario escribe: "¿Cómo puedo aprender JavaScript de forma rápida?"

Sistema valida:
  ✅ Longitud: 50 caracteres (entre 3-500)
  ✅ No contiene palabras ofensivas
  ✅ No es intento de evasión
  ✅ No tiene repetición excesiva
  ✅ No contiene spam/URLs
  ✅ No contiene lenguaje amenazante

Resultado: ACEPTADO ✅

Acción:
  ┌─────────────────────────────────────┐
  │ Comentario publicado correctamente  │
  │                                     │
  │ ¿Cómo puedo aprender JavaScript... │
  │                                     │
  │ Estudiante Curioso - hace 5 segundos│
  │ ❤️ 0                                │
  └─────────────────────────────────────┘


// ESCENARIO 2: Usuario intenta publicar palabra ofensiva
// ════════════════════════════════════════════════════════════

Usuario escribe: "Esto es una pendejada total"

Sistema valida:
  ✅ Longitud: 28 caracteres (entre 3-500)
  ❌ Detecta: "pendejada" en lista española de palabras ofensivas
  ❌ RECHAZO

Resultado: RECHAZADO

Acción en pantalla:
  ┌─────────────────────────────────────────────────────────────┐
  │ ⚠️  Tu comentario contiene lenguaje inapropiado.            │
  │    Por favor, sé respetuoso.                                │
  │                                                             │
  │ ❌ (El comentario NO se publica)                           │
  │ El usuario puede intentar editar su mensaje                │
  └─────────────────────────────────────────────────────────────┘


// ESCENARIO 3: Usuario intenta evasión con números
// ════════════════════════════════════════════════════════════

Usuario escribe: "P1d3j4d4 total"

Sistema valida:
  ✅ Longitud: 13 caracteres
  ❌ Detecta intento de evasión:
     - Reemplaza números: "P1d3j4d4" → "Pidejada"
     - Coincide con "pendejada" en lista española
  ❌ RECHAZO

Resultado: RECHAZADO

Acción en pantalla:
  ┌─────────────────────────────────────────────────────────────┐
  │ ⚠️  Detectamos un intento de evasión de filtro.             │
  │    Por favor, usa lenguaje apropiado.                       │
  │                                                             │
  │ ❌ (El comentario NO se publica)                           │
  └─────────────────────────────────────────────────────────────┘


// ESCENARIO 4: Usuario intenta repetición excesiva
// ════════════════════════════════════════════════════════════

Usuario escribe: "Jajajajajajajajajaja"

Sistema valida:
  ✅ Longitud: 20 caracteres
  ✅ No contiene palabras ofensivas
  ❌ Detecta más de 3 caracteres 'a' repetidos consecutivamente
  ❌ RECHAZO

Resultado: RECHAZADO

Acción en pantalla:
  ┌─────────────────────────────────────────────────────────────┐
  │ ⚠️  Evita repetir caracteres excesivamente                  │
  │    (ej: "jajajaja").                                        │
  │                                                             │
  │ ❌ (El comentario NO se publica)                           │
  └─────────────────────────────────────────────────────────────┘


// ESCENARIO 5: Usuario intenta spam/URL
// ════════════════════════════════════════════════════════════

Usuario escribe: "Compra aquí: www.estafa.com - Mejor precio!"

Sistema valida:
  ✅ Longitud: 43 caracteres
  ✅ No contiene palabras ofensivas
  ❌ Detecta URL: "www.estafa.com"
  ❌ Detecta contenido comercial
  ❌ RECHAZO

Resultado: RECHAZADO

Acción en pantalla:
  ┌─────────────────────────────────────────────────────────────┐
  │ 🚫 No se permite contenido comercial, URLs ni emails.       │
  │                                                             │
  │ ❌ (El comentario NO se publica)                           │
  └─────────────────────────────────────────────────────────────┘


// ESCENARIO 6: Usuario intenta lenguaje amenazante
// ════════════════════════════════════════════════════════════

Usuario escribe: "Te voy a matar"

Sistema valida:
  ✅ Longitud: 14 caracteres
  ❌ Detecta patrón amenazante: "voy a matar"
  ❌ RECHAZO

Resultado: RECHAZADO

Acción en pantalla:
  ┌─────────────────────────────────────────────────────────────┐
  │ 🚫 No se permiten comentarios amenazantes.                 │
  │    Todos nos merecemos respeto.                             │
  │                                                             │
  │ ❌ (El comentario NO se publica)                           │
  │ ⚠️  Intento registrado en historial de moderación           │
  └─────────────────────────────────────────────────────────────┘


// ESCENARIO 7: Usuario escribe comentario muy corto
// ════════════════════════════════════════════════════════════

Usuario escribe: "Hi"

Sistema valida:
  ❌ Longitud: 2 caracteres (mínimo 3)
  ❌ RECHAZO

Resultado: RECHAZADO

Acción en pantalla:
  ┌─────────────────────────────────────────────────────────────┐
  │ ❌ Tu comentario es muy corto                               │
  │    (mínimo 3 caracteres).                                   │
  │                                                             │
  │ Sugerencia: Intenta escribir algo más detallado             │
  └─────────────────────────────────────────────────────────────┘


// ESCENARIO 8: Usuario escribe comentario muy largo
// ════════════════════════════════════════════════════════════

Usuario escribe: "aaaaaaa..." (501 caracteres)

Sistema valida:
  ❌ Longitud: 501 caracteres (máximo 500)
  ❌ RECHAZO

Resultado: RECHAZADO

Acción en pantalla:
  ┌─────────────────────────────────────────────────────────────┐
  │ ❌ Tu comentario es muy largo                               │
  │    (máximo 500 caracteres).                                 │
  │                                                             │
  │ Actual: 501 caracteres - Reduce a 500 o menos              │
  └─────────────────────────────────────────────────────────────┘


// ESCENARIO 9: Usuario intenta palabra ofensiva en inglés
// ════════════════════════════════════════════════════════════

Usuario escribe: "This is damn good code, asshole!"

Sistema valida:
  ✅ Longitud: 32 caracteres
  ❌ Detecta: "damn" en lista inglesa
  ❌ Detecta: "asshole" en lista inglesa
  ❌ RECHAZO

Resultado: RECHAZADO

Acción en pantalla:
  ┌─────────────────────────────────────────────────────────────┐
  │ ⚠️  Tu comentario contiene lenguaje inapropiado.            │
  │    Por favor, sé respetuoso.                                │
  │                                                             │
  │ Palabras detectadas: damn, asshole                          │
  └─────────────────────────────────────────────────────────────┘


// ESCENARIO 10: Múltiples rechazos - Historial de moderación
// ════════════════════════════════════════════════════════════

Después de varios intentos fallidos, el historial se ve así:

localStorage.getItem('moderationHistory'):

[
  {
    timestamp: 1733007600000,
    text: "P1d3j4d4 total...",
    reason: "Posible intento de evadir filtro de contenido",
    flaggedWord: "pendejada"
  },
  {
    timestamp: 1733007500000,
    text: "Te voy a matar...",
    reason: "Lenguaje amenazante detectado",
    flaggedWord: null
  },
  {
    timestamp: 1733007400000,
    text: "Esto es una pendejada total...",
    reason: "Contiene lenguaje inapropiado (palabra ofensiva detectada)",
    flaggedWord: "pendejada"
  }
]

Ver en consola:
  console.log(JSON.parse(localStorage.getItem('moderationHistory')));


// INDICADOR DE MODO EN LA INTERFAZ
// ════════════════════════════════════════════════════════════

En la parte superior de la sección de comentarios:

┌────────────────────────────────────────┐
│ 💬 Comentarios de Estudiantes          │
│ Modo: Firebase (en línea) 🟢           │
│                                        │
│ ┌─────────────────────────────────────┐│
│ │ Escribe un comentario...            ││
│ │                                     ││
│ │ [📤 Publicar Comentario]            ││
│ └─────────────────────────────────────┘│
│                                        │
│ 📝 No hay comentarios aún              │
│ ¡Sé el primero en comentar!            │
└────────────────────────────────────────┘

LEYENDA DE COLORES:
  🟢 Verde: Firebase funcionando (modo online)
  🟠 Naranja: localStorage (modo fallback/local)


// NOTIFICACIONES DE ÉXITO
// ════════════════════════════════════════════════════════════

Cuando un comentario se publica exitosamente:

┌──────────────────────────────┐
│ ✅ ¡Comentario publicado!    │
│    Aparecerá en la lista en  │
│    segundos.                 │
└──────────────────────────────┘
     (Aparece en esquina inferior derecha por 3 segundos)


// FLUJO VISUAL COMPLETO
// ════════════════════════════════════════════════════════════

ENTRADA:          VALIDACIÓN:           RESULTADO:
┌────────┐        ┌─────────────────┐   ┌─────────────────┐
│Usuario │───────▶│ Moderador       │──▶│ ACEPTADO ✅     │
│escribe │        │                 │   │ Se publica      │
└────────┘        │ • Palabras      │   └─────────────────┘
                  │ • Evasión       │
                  │ • Repetición    │   ┌─────────────────┐
                  │ • Spam          │──▶│ RECHAZADO ❌    │
                  │ • Amenazas      │   │ Error amigable  │
                  │ • Longitud      │   └─────────────────┘
                  └─────────────────┘


═══════════════════════════════════════════════════════════════════════════════

RESUMEN:
  • Sistema de moderación automático e invisible
  • Mensajes de error claros y constructivos
  • Protección contra insultos, spam y amenazas
  • Funciona en español e inglés
  • Detecta intentos de evasión
  • Mantiene historial de intentos fallidos
  • Interfaz amigable para el usuario

═══════════════════════════════════════════════════════════════════════════════
*/
