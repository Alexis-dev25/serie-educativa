# ❓ Preguntas Frecuentes - Sistema de Moderación

## Funcionamiento

### P: ¿Cómo funciona el sistema de moderación?
**R:** Cuando un usuario intenta publicar un comentario, el sistema ejecuta automáticamente una serie de validaciones:
1. Verifica que no sea vacío y tenga entre 3-500 caracteres
2. Busca palabras ofensivas en español e inglés
3. Detecta intentos de evasión (números por letras, caracteres especiales, etc.)
4. Verifica repetición excesiva de caracteres
5. Busca URLs, emails y contenido comercial
6. Detecta lenguaje amenazante

Si pasa todas las pruebas, se publica. Si falla, muestra un mensaje de error amigable.

### P: ¿El usuario ve que su comentario fue rechazado?
**R:** Sí. Se muestra un mensaje de error clara en una notificación (esquina inferior derecha) explicando por qué fue rechazado.

### P: ¿Se guardan los intentos rechazados?
**R:** Sí, en `localStorage`. Se puede acceder con:
```javascript
JSON.parse(localStorage.getItem('moderationHistory'))
```

---

## Palabras Ofensivas

### P: ¿Cuántas palabras se detectan?
**R:** 
- Español: 60+ palabras
- Inglés: 400+ palabras
- Total: 460+ palabras ofensivas

### P: ¿Puedo agregar más palabras ofensivas?
**R:** Sí. Abre `moderator.js` y en el constructor, encuentra `this.bannedWords` y agrega tu palabra:
```javascript
this.bannedWords.spanish.push('mipalabra');
this.buildRegexes();
```

### P: ¿Qué pasa si una palabra inocente coincide?
**R:** Puede haber falsos positivos. Usa límites de palabra (`\b`) en la regex para minimizarlo. El sistema intenta evitar esto.

Ejemplo: La palabra "ass" en "assistant" NO coincide porque usa límites.

### P: ¿Los acentos son importantes?
**R:** Sí. La regex es sensible a acentos, así que "pendejo" y "pendêjo" se detectan por separado. Puedes agregar ambas variantes.

---

## Evasión de Filtros

### P: ¿Qué es una "evasión de filtro"?
**R:** Cuando un usuario intenta escribir una palabra ofensiva reemplazando letras con números o caracteres especiales:
- `p1d3j0` → detectado como "pendejo"
- `p@$!@` → detectado
- `p e n d e j o` → detectado

### P: ¿Cómo lo detecta?
**R:** El sistema limpia el texto reemplazando:
- Números con letras: `1` → `i`, `3` → `e`, `4` → `a`, `0` → `o`
- Caracteres especiales
- Espacios

Luego busca en la lista de palabras prohibidas.

### P: ¿Puedo escribir "1nt3r3s4nt3" (interesante con números)?
**R:** El sistema primero valida si LIMPIO el texto coincide con palabras ofensivas. "Interesante" NO está en la lista, así que pasará.

Pero si intentas "p1d3j0", será rechazado porque "pendejo" SÍ está en la lista.

---

## Spam y URLs

### P: ¿Puedo compartir un link?
**R:** No. El sistema rechaza automáticamente comentarios que contienen:
- `http://` o `https://`
- `www.`
- `.com`, `.net`, `.org`, `.es`
- Emails
- Números de teléfono

**Motivo:** Evitar publicidad y phishing.

### P: ¿Qué pasa si escribo "punto com"?
**R:** Pasará porque está escrito con palabras, no como dominio real.

### P: ¿Puedo escribir mi correo?
**R:** No. El sistema detecta formato de email (`usuario@ejemplo.com`).

---

## Lenguaje Amenazante

### P: ¿Qué se considera "amenazante"?
**R:** Comentarios que contienen:
- "Te voy a matar" / "Voy a matarte"
- "Te voy a golpear" / "Voy a pegarte"
- Referencias a armas (pistola, cuchillo, bomba)
- Menciones de suicidio
- Palabras clave: "kill", "hurt", "death threat"

### P: ¿Qué pasa si escribo "Como mencionó Sócrates sobre la muerte..."?
**R:** Puede ser rechazado como falso positivo si contiene "muerte" o "death". Se recomienda ser específico en el contexto.

---

## Historial de Moderación

### P: ¿Dónde se guarda el historial?
**R:** En `localStorage` bajo la clave `'moderationHistory'`.

### P: ¿Cuánto tiempo se conserva?
**R:** Indefinidamente, hasta que el usuario limpie su cache/localStorage. El sistema mantiene máximo 100 entradas.

### P: ¿Cómo borro el historial?
**R:** En la consola:
```javascript
localStorage.removeItem('moderationHistory');
```

### P: ¿Puedo exportar el historial?
**R:** Sí:
```javascript
const historial = JSON.parse(localStorage.getItem('moderationHistory'));
console.log(JSON.stringify(historial, null, 2));
// Copiar y pegar en un archivo .txt o .json
```

---

## Personalización y Configuración

### P: ¿Cómo cambio el número máximo de caracteres?
**R:** 
1. En `moderator.js`, método `moderate()`, cambia:
```javascript
if (cleanedText.length > 500) { // Cambiar 500 a tu valor
```

2. En `comments.js`, en el formulario HTML, cambia:
```html
<textarea ... maxlength="500" rows="4"></textarea>
<!-- Cambiar 500 a tu valor -->
```

### P: ¿Cómo deshabilito una detección?
**R:** En `moderator.js`, método `moderate()`, comenta la sección:
```javascript
// // 4. Detectar spam/contenido comercial
// if (this.detectSpam(cleanedText)) {
//     return { safe: false, reason: '...' };
// }
```

### P: ¿Cómo cambio los mensajes de error?
**R:** En `comments.js`, método `getUserFriendlyMessage()`, edita el objeto `messages`:
```javascript
const messages = {
    'El comentario es muy corto': '❌ Tu comentario es muy corto (mínimo 3 caracteres).',
    // Edita aquí
};
```

---

## Rendimiento y Seguridad

### P: ¿Afecta al rendimiento?
**R:** Mínimamente. Las validaciones son rápidas (milisegundos). El usuario no notará lag.

### P: ¿Es seguro confiar 100% en este sistema?
**R:** **No**. Este es un filtro de **primera capa** educativo. Para aplicaciones de producción:
- Combina con moderación manual
- Usa servicios especializados (Google Cloud Content Moderation, IBM Watson, etc.)
- Implementa reportes de abuso
- Mantén un admin revisando periódicamente

### P: ¿Los usuarios pueden hackear el filtro?
**R:** Sí, con suficiente determinación. Usuarios avanzados pueden encontrar evasiones. Por eso se recomienda moderación manual.

### P: ¿Almacenan datos personales?
**R:** No. El historial es local (`localStorage`) y no se envía a servidores. Es completamente privado del usuario.

---

## Integración

### P: ¿Funciona con Firebase?
**R:** Sí. El sistema funciona con o sin Firebase:
- **Con Firebase**: Los comentarios se sincronizan en tiempo real
- **Sin Firebase**: Se usan `localStorage` como fallback

La moderación funciona igual en ambos casos.

### P: ¿Puedo usar esto en otro proyecto?
**R:** Sí. Solo copia:
- `moderator.js`
- Intégralo en tu HTML: `<script src="moderator.js"></script>`
- Usa: `new CommentModerator()`

---

## Problemas Comunes

### P: Mi comentario fue rechazado pero parece válido
**R:** Posibles razones:
1. Contiene una palabra en la lista (incluso inocente)
2. Intenta de evasión accidental (ej: números)
3. Demasiados caracteres repetidos
4. Contiene una URL o email

Intenta escribir de forma diferente o contacta al admin.

### P: El sistema rechaza todas mis palabras
**R:** Verifica:
1. ¿Has alcanzado 500 caracteres?
2. ¿Hay palabras ofensivas?
3. ¿Hay demasiadas exclamaciones o puntos?
4. ¿Hay intentos de evasión accidental?

### P: No veo el historial de moderación
**R:** Asegúrate de:
1. Estar en el mismo navegador/dispositivo
2. No haber limpiado el `localStorage`
3. Acceder correctamente:
```javascript
JSON.parse(localStorage.getItem('moderationHistory') || '[]')
```

---

## Soporte Técnico

### P: ¿Dónde reporto un bug?
**R:** 
1. Abre una issue en GitHub (si existe)
2. O contacta al desarrollador a través del email de feedback

### P: ¿Puedo sugerir mejoras?
**R:** Sí. Las mejoras sugeridas incluyen:
- Análisis de sentimientos (IA)
- Panel de admin
- Whitelist de usuarios
- Bloqueo temporal de usuarios
- Integración con sistemas de reputación

---

## Información Adicional

- **Documentación completa**: `README_MODERACION.md`
- **Ejemplos visuales**: `EJEMPLOS_INTERFAZ.js`
- **Pruebas automatizadas**: `TEST_MODERACION.js`
- **Guía rápida**: `GUIA_RAPIDA.md`

---

## Última Pregunta

### P: ¿A quién le debo esto?
**R:** 🤖 Sistema implementado por GitHub Copilot. ¡Disfrutalo!

---

**¿No encontraste tu pregunta? Contacta con el equipo de soporte o revisa la documentación detallada.**
