// counter.js - VERSIÓN CORREGIDA
console.log("counter.js cargado - verificando Firebase...");

// Esperar a que Firebase SDK se cargue
function waitForFirebase() {
    return new Promise((resolve) => {
        if (typeof firebase !== 'undefined' && firebase.app) {
            console.log("Firebase detectado");
            resolve();
        } else {
            console.log("Esperando Firebase...");
            setTimeout(() => waitForFirebase().then(resolve), 100);
        }
    });
}

// Configuración Firebase - REEMPLAZA CON TUS DATOS REALES
const firebaseConfig = {
  apiKey: "AIzaSyCbm7LYeDnXJTk9bJJs9FyOvkmqxMs7f8U",
  authDomain: "serie-educativa.firebaseapp.com",
  databaseURL: "https://serie-educativa-default-rtdb.firebaseio.com",
  projectId: "serie-educativa",
  storageBucket: "serie-educativa.firebasestorage.app",
  messagingSenderId: "419592658892",
  appId: "1:419592658892:web:11a70ffa88f853a4920769",
  measurementId: "G-81N5THENWD"
};

// Clase principal
class FirebaseStats {
    constructor() {
        console.log("Iniciando FirebaseStats...");
        this.stats = { totalVisits: 0, totalLikes: 0, todayVisits: 0 };
        this.userLiked = localStorage.getItem('userLiked') === 'true';
        this.userId = this.getUserId();
    }
    
    async init() {
        try {
            console.log("Inicializando Firebase...");
            
            // Inicializar Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
                console.log("Firebase inicializado correctamente");
            } else {
                console.log("Firebase ya estaba inicializado");
            }
            
            this.database = firebase.database();
            
            // Registrar visita y configurar listeners
            await this.registerVisit();
            this.setupRealtimeListeners();
            
        } catch (error) {
            console.error("Error inicializando Firebase:", error);
            this.useOfflineMode();
        }
    }
    
    getUserId() {
        let userId = localStorage.getItem('githubUserId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('githubUserId', userId);
        }
        return userId;
    }
    
    async registerVisit() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const visitRef = this.database.ref('visits/' + today + '/' + this.userId);
            
            const snapshot = await visitRef.once('value');
            if (!snapshot.exists()) {
                await visitRef.set({
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    source: 'github'
                });
                
                // Incrementar contadores
                await this.database.ref('stats/today').transaction(c => (c || 0) + 1);
                await this.database.ref('stats/total').transaction(c => (c || 0) + 1);
                
                console.log("Visita registrada");
            }
        } catch (error) {
            console.error("Error registrando visita:", error);
        }
    }
    
    setupRealtimeListeners() {
        console.log("Configurando listeners en tiempo real...");
        
        // Escuchar estadísticas
        this.database.ref('stats').on('value', (snapshot) => {
            const data = snapshot.val() || {};
            this.stats.totalVisits = data.total || 0;
            this.stats.totalLikes = data.likes || 0;
            this.stats.todayVisits = data.today || 0;
            this.display();
            
            console.log("Estadísticas actualizadas:", this.stats);
        });
        
        // Verificar si usuario ya dio like
        this.database.ref('likes/' + this.userId).once('value', (snapshot) => {
            if (snapshot.exists()) {
                this.userLiked = true;
                localStorage.setItem('userLiked', 'true');
                this.updateButton();
            }
        });
    }
    
    async addLike() {
        console.log("Intentando dar like...");
        
        if (!this.userLiked) {
            try {
                // Registrar like del usuario
                await this.database.ref('likes/' + this.userId).set({
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    from: 'github_pages'
                });
                
                // Incrementar contador global
                await this.database.ref('stats/likes').transaction(c => (c || 0) + 1);
                
                this.userLiked = true;
                localStorage.setItem('userLiked', 'true');
                
                this.updateButton();
                this.showSuccess();
                
                console.log("Like registrado exitosamente");
                return true;
                
            } catch (error) {
                console.error("Error dando like:", error);
                this.showError();
                return false;
            }
        }
        
        console.log("Usuario ya había dado like");
        return false;
    }
    
    useOfflineMode() {
        console.log("Activando modo offline...");
        const localStats = JSON.parse(localStorage.getItem('localStats')) || {
            total: 0,
            likes: 0,
            today: 0
        };
        
        localStats.total++;
        localStats.today++;
        
        this.stats.totalVisits = localStats.total;
        this.stats.totalLikes = localStats.likes;
        this.stats.todayVisits = localStats.today;
        
        localStorage.setItem('localStats', JSON.stringify(localStats));
        this.display();
    }
    
    display() {
        const format = (num) => {
            if (num >= 1000000) return (num/1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num/1000).toFixed(1) + 'k';
            return num;
        };
        
        const totalVisitsEl = document.getElementById('total-visits');
        const totalLikesEl = document.getElementById('total-likes');
        const todayVisitsEl = document.getElementById('today-visits');
        const engagementEl = document.getElementById('engagement');
        
        if (totalVisitsEl) totalVisitsEl.textContent = format(this.stats.totalVisits);
        if (totalLikesEl) totalLikesEl.textContent = format(this.stats.totalLikes);
        if (todayVisitsEl) todayVisitsEl.textContent = this.stats.todayVisits;
        
        if (engagementEl) {
            const engagement = this.stats.totalVisits > 0 ?
                ((this.stats.totalLikes / this.stats.totalVisits) * 100).toFixed(1) + '%' : '0%';
            engagementEl.textContent = engagement;
        }
    }
    
    updateButton() {
        const btn = document.getElementById('edu-like-btn');
        if (btn && this.userLiked) {
            btn.innerHTML = '<span class="btn-icon">🎉</span> <span class="btn-text">¡Gracias!</span>';
            btn.classList.add('liked');
            btn.disabled = true;
        }
    }
    
    showSuccess() {
        // Crear notificación simple
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2ecc71;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 10000;
            animation: fadeIn 0.3s;
        `;
        notification.textContent = '¡Gracias por tu like!';
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    }
    
    showError() {
        alert('Error de conexión. Intenta más tarde.');
    }
}

// Inicialización cuando todo esté listo
async function initApp() {
    console.log("Inicializando aplicación...");
    
    try {
        // Esperar a que Firebase se cargue
        await waitForFirebase();
        
        // Crear instancia
        window.statsSystem = new FirebaseStats();
        
        // Inicializar
        await window.statsSystem.init();
        
        // Configurar botón
        const likeBtn = document.getElementById('edu-like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', async () => {
                await window.statsSystem.addLike();
            });
        }
        
        console.log("Aplicación inicializada correctamente");
        
    } catch (error) {
        console.error("Error inicializando aplicación:", error);
        
        // Fallback básico
        const likeBtn = document.getElementById('edu-like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => {
                alert('Sistema temporalmente no disponible. ¡Gracias por tu intención!');
            });
        }
    }
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// 1. Cache de Firebase
localStorage.setItem('firebase_cache', JSON.stringify({
    data: window.statsSystem.stats,
    timestamp: Date.now()
}));

// 2. Offline support mejorado
if (!navigator.onLine) {
    document.getElementById('edu-like-btn').innerHTML = '🌐 Conéctate para dar like';
    document.getElementById('edu-like-btn').style.background = '#95a5a6';
}

// 3. Performance
window.addEventListener('beforeunload', () => {
    // Limpiar listeners de Firebase si es necesario
});

// Crea un "reporte para el profesor"
function generateTeacherReport() {
    const stats = window.statsSystem ? window.statsSystem.stats : {};
    const report = `
INFORME PARA EL PROFESOR
========================
PROYECTO: Página Educativa de Programación
ESTUDIANTE: [Tu Nombre]
FECHA: ${new Date().toLocaleDateString('es-ES')}

📈 IMPACTO DEL PROYECTO:
• Total de Visitas: ${stats.totalVisits || 0}
• Total de Likes: ${stats.totalLikes || 0}
• Visitas Únicas Hoy: ${stats.todayVisits || 0}
• Tasa de Engagement: ${stats.totalVisits ? ((stats.totalLikes/stats.totalVisits)*100).toFixed(1) : 0}%

🛠 TECNOLOGÍAS UTILIZADAS:
• Frontend: HTML5, CSS3, JavaScript ES6+
• Backend: Firebase Realtime Database
• Hosting: GitHub Pages
• APIs: Firebase SDK, LocalStorage

🎯 OBJETIVOS CUMPLIDOS:
✓ Sistema de likes funcional
✓ Estadísticas en tiempo real
✓ Persistencia de datos
✓ Interfaz responsive
✓ Código modular y documentado

🔗 ENLACE: ${window.location.href}
========================
"Este proyecto demuestra la aplicación práctica de desarrollo web full-stack"
    `;
    
    // Crear ventana con el reporte
    const reportWindow = window.open('', '_blank');
    reportWindow.document.write(`
        <html>
        <head>
            <title>Reporte del Proyecto</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                pre { background: #f5f5f5; padding: 20px; border-radius: 10px; }
                .print-btn { background: #3498db; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 20px 0; }
            </style>
        </head>
        <body>
            <h1>📊 Reporte del Proyecto Educativo</h1>
            <pre>${report}</pre>
            <button class="print-btn" onclick="window.print()">🖨 Imprimir Reporte</button>
            <button class="print-btn" onclick="navigator.clipboard.writeText(document.querySelector('pre').innerText)">📋 Copiar Texto</button>
        </body>
        </html>
    `);
}

// Acceso secreto: Ctrl+Shift+P
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        generateTeacherReport();
    }
});
// En counter.js, agrega al final:
document.addEventListener('keydown', function(e) {
    // Ctrl+Shift+L para ver datos completos
    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        
        const stats = window.statsSystem ? window.statsSystem.stats : {};
        const message = `
📊 ESTADÍSTICAS COMPLETAS:
=======================
👥 Visitas Totales: ${stats.totalVisits || 0}
❤️  Likes Totales: ${stats.totalLikes || 0}
📅 Visitas Hoy: ${stats.todayVisits || 0}
📈 Engagement: ${stats.totalVisits ? ((stats.totalLikes/stats.totalVisits)*100).toFixed(1) : 0}%
=======================
🔗 URL: ${window.location.href}
🕐 Fecha: ${new Date().toLocaleString()}
        `;
        
        console.log(message);
        alert(message);
    }
});