/**
 * Módulo de Chatbot educativo
 * Proporciona respuestas sobre programación y lenguajes específicos
 */

class EduChatbot {
    constructor(language = 'python') {
        this.language = language;
        this.conversationHistory = [];
        this.initializeResponses();
    }

    initializeResponses() {
        this.responses = {
            python: {
                'hola|hi|hey': '¡Hola! 👋 Soy tu asistente de Python. ¿Qué quieres aprender hoy?',
                'variables': 'En Python, las variables se crean asignando un valor: `x = 10`. No necesitas declarar el tipo, Python lo detecta automáticamente.',
                'funciones': 'Las funciones se definen con `def nombre(parámetros):`. Ejemplo:\n```python\ndef saludar(nombre):\n    return f"Hola {nombre}"\n```',
                'listas': 'Las listas son colecciones ordenadas: `numeros = [1, 2, 3]`. Accede con índices: `numeros[0]` → 1',
                'bucles': 'Usa `for` o `while` para bucles:\n```python\nfor i in range(5):\n    print(i)\n```',
                'condicionales': 'Usa `if`, `elif`, `else`:\n```python\nif x > 10:\n    print("Mayor")\nelse:\n    print("Menor")\n```',
                'diccionarios': 'Los diccionarios almacenan pares clave-valor: `persona = {"nombre": "Juan", "edad": 25}`',
                'default': '¿Podrías ser más específico? Pregunta sobre variables, funciones, listas, bucles, condicionales, diccionarios o strings.'
            },
            javascript: {
                'hola|hi|hey': '¡Hola! 👋 Soy tu asistente de JavaScript. ¿Qué quieres aprender?',
                'variables': 'En JavaScript declara variables con `let`, `const` o `var`:\n```javascript\nlet x = 10;\nconst PI = 3.14;\n```',
                'funciones': 'Las funciones son bloques de código reutilizable:\n```javascript\nfunction saludar(nombre) {\n    return `Hola ${nombre}`;\n}\n```',
                'arrays': 'Los arrays almacenan múltiples valores:\n```javascript\nlet numeros = [1, 2, 3, 4];\nnumeros[0]; // 1\n```',
                'objetos': 'Los objetos agrupan datos relacionados:\n```javascript\nlet persona = { nombre: "Juan", edad: 25 };\n```',
                'bucles': 'Usa `for`, `while` o `forEach`:\n```javascript\nfor (let i = 0; i < 5; i++) {\n    console.log(i);\n}\n```',
                'dom': 'Accede al DOM con `document.querySelector()` o `getElementById()`:\n```javascript\ndocument.querySelector(".clase").textContent = "Hola";\n```',
                'default': '¿Podrías ser más específico? Pregunta sobre variables, funciones, arrays, objetos, bucles o DOM.'
            },
            html: {
                'hola|hi|hey': '¡Hola! 👋 Soy tu asistente de HTML. ¿Qué quieres saber?',
                'etiquetas': 'Las etiquetas HTML definen la estructura. Algunas principales: `<div>`, `<section>`, `<header>`, `<footer>`, `<article>`',
                'formularios': 'Crea formularios con `<form>` y elementos como `<input>`, `<textarea>`, `<select>`:\n```html\n<form>\n    <input type="text" placeholder="Tu nombre">\n    <button type="submit">Enviar</button>\n</form>\n```',
                'semantica': 'Usa etiquetas semánticas para mejor SEO: `<header>`, `<nav>`, `<main>`, `<article>`, `<footer>`',
                'atributos': 'Los atributos proporcionan información: `<img src="foto.jpg" alt="descripción">`',
                'enlaces': 'Los enlaces se crean con `<a>`: `<a href="pagina.html">Ir a otra página</a>`',
                'meta': 'Los meta tags en `<head>` definen metadatos:\n```html\n<meta name="viewport" content="width=device-width">\n<meta name="description" content="Descripción de la página">\n```',
                'default': '¿Podrías ser más específico? Pregunta sobre etiquetas, formularios, semántica, atributos, enlaces o meta tags.'
            }
        };
    }

    getResponse(userInput) {
        const input = userInput.toLowerCase().trim();
        const langResponses = this.responses[this.language] || this.responses.python;

        // Buscar coincidencias exactas o parciales
        for (const [key, response] of Object.entries(langResponses)) {
            const patterns = key.split('|');
            for (const pattern of patterns) {
                if (input.includes(pattern)) {
                    return response;
                }
            }
        }

        return langResponses.default;
    }

    addMessage(role, content) {
        this.conversationHistory.push({ role, content, timestamp: new Date() });
    }

    getHistory() {
        return this.conversationHistory;
    }

    clearHistory() {
        this.conversationHistory = [];
    }
}

// Función para crear el UI del chatbot
function createChatbotUI(containerId, language = 'python') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const chatbot = new EduChatbot(language);

    container.innerHTML = `
        <div class="chatbot-widget">
            <div class="chatbot-header">
                <h3>💬 Asistente ${language.toUpperCase()}</h3>
                <button class="chatbot-close" aria-label="Cerrar chat">✕</button>
            </div>
            <div class="chatbot-messages" id="chatbot-messages"></div>
            <div class="chatbot-input-area">
                <input 
                    type="text" 
                    id="chatbot-input" 
                    placeholder="Pregunta algo..." 
                    aria-label="Mensaje del chat">
                <button id="chatbot-send" aria-label="Enviar mensaje">Enviar</button>
            </div>
        </div>
    `;

    const messagesDiv = document.getElementById('chatbot-messages');
    const input = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send');
    const closeBtn = container.querySelector('.chatbot-close');

    // Mensaje de bienvenida
    setTimeout(() => {
        addMessage('bot', '¡Hola! 👋 Pregúntame cualquier cosa sobre ' + language);
    }, 500);

    function addMessage(role, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chatbot-message ${role}`;
        msgDiv.textContent = text;
        messagesDiv.appendChild(msgDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function handleSend() {
        const message = input.value.trim();
        if (!message) return;

        addMessage('user', message);
        chatbot.addMessage('user', message);
        input.value = '';

        setTimeout(() => {
            const response = chatbot.getResponse(message);
            addMessage('bot', response);
            chatbot.addMessage('bot', response);
        }, 300);
    }

    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });

    closeBtn.addEventListener('click', () => {
        container.style.display = 'none';
    });
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EduChatbot, createChatbotUI };
}
