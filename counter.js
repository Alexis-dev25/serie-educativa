// CONFIGURACIÓN (reemplaza con tus datos)
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROYECTO.firebaseapp.com",
    databaseURL: "https://TU_PROYECTO-default-rtdb.firebaseio.com",
    projectId: "TU_PROYECTO",
    storageBucket: "TU_PROYECTO.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
};

// INICIALIZACIÓN SEGURA
if (typeof firebase === 'undefined') {
    console.error('Firebase SDK no cargado');
} else if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase inicializado');
} else {
    console.log('Usando Firebase ya inicializado');
}

// VARIABLE GLOBAL (sin const/let si ya existe)
if (typeof database === 'undefined') {
    var database = firebase.database();
}

// ========== CLASE PRINCIPAL ==========
class CounterSystem {
    constructor() {
        this.userId = this.getUserId();
        this.userLiked = localStorage.getItem('liked_' + this.userId) === 'true';
        this.init();
    }
    
    getUserId() {
        let id = localStorage.getItem('visitorId');
        if (!id) {
            id = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('visitorId', id);
        }
        return id;
    }
    
    async init() {
        await this.registerVisit();
        this.listenToStats();
    }
    
    async registerVisit() {
        try {
            const today = new Date().toISOString().split('T')[0];
            await database.ref('visits/' + today + '/' + this.userId).set({
                timestamp: Date.now(),
                source: 'github'
            });
            
            // Actualizar contadores
            database.ref('stats/totalVisits').transaction(c => (c || 0) + 1);
            database.ref('stats/visitsToday').transaction(c => (c || 0) + 1);
        } catch (error) {
            console.log('Error registrando visita:', error);
        }
    }
    
    listenToStats() {
        // Escuchar estadísticas en tiempo real
        database.ref('stats').on('value', (snapshot) => {
            const data = snapshot.val() || {};
            this.updateDisplay(data);
        });
        
        // Verificar si ya dio like
        database.ref('likes/' + this.userId).once('value', (snap) => {
            if (snap.exists()) {
                this.userLiked = true;
                this.updateLikeButton();
            }
        });
    }
    
    updateDisplay(data) {
        const visits = data.totalVisits || 0;
        const likes = data.totalLikes || 0;
        const today = data.visitsToday || 0;
        
        // Actualizar HTML
        if (document.getElementById('total-visits')) {
            document.getElementById('total-visits').textContent = 
                this.formatNumber(visits);
        }
        if (document.getElementById('total-likes')) {
            document.getElementById('total-likes').textContent = 
                this.formatNumber(likes);
        }
        if (document.getElementById('today-visits')) {
            document.getElementById('today-visits').textContent = today;
        }
        if (document.getElementById('engagement')) {
            const engagement = visits > 0 ? ((likes / visits) * 100).toFixed(1) + '%' : '0%';
            document.getElementById('engagement').textContent = engagement;
        }
    }
    
    async addLike() {
        if (!this.userLiked && database) {
            try {
                // Registrar like del usuario
                await database.ref('likes/' + this.userId).set({
                    timestamp: Date.now(),
                    userAgent: navigator.userAgent.substring(0, 100)
                });
                
                // Incrementar contador global
                await database.ref('stats/totalLikes').transaction(c => (c || 0) + 1);
                
                this.userLiked = true;
                localStorage.setItem('liked_' + this.userId, 'true');
                
                this.updateLikeButton();
                this.showSuccess();
                
            } catch (error) {
                console.error('Error dando like:', error);
                this.showError();
            }
        }
    }
    
    updateLikeButton() {
        const btn = document.getElementById('edu-like-btn');
        if (btn && this.userLiked) {
            btn.innerHTML = '<span class="btn-icon">✅</span> <span class="btn-text">¡Gracias!</span>';
            btn.classList.add('liked');
            btn.disabled = true;
        }
    }
    
    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num;
    }
    
    showSuccess() {
        // Confetti simple
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.cssText = `
                    position: fixed;
                    width: 10px;
                    height: 10px;
                    background: #${Math.floor(Math.random()*16777215).toString(16)};
                    border-radius: 50%;
                    z-index: 9999;
                    pointer-events: none;
                    left: ${Math.random() * 100}vw;
                    top: -10px;
                `;
                document.body.appendChild(confetti);
                
                confetti.animate([
                    { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
                    { transform: `translateY(${window.innerHeight}px) rotate(360deg)`, opacity: 0 }
                ], {
                    duration: 1000 + Math.random() * 2000,
                    easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)'
                }).onfinish = () => confetti.remove();
            }, i * 30);
        }
    }
    
    showError() {
        alert('Hubo un error. Por favor, recarga la página e inténtalo de nuevo.');
    }
}

// ========== INICIALIZAR CUANDO EL DOM ESTÉ LISTO ==========
document.addEventListener('DOMContentLoaded', function() {
    // Crear instancia
    window.pageCounter = new CounterSystem();
    
    // Configurar botón
    const likeBtn = document.getElementById('edu-like-btn');
    if (likeBtn) {
        likeBtn.addEventListener('click', function() {
            window.pageCounter.addLike();
        });
    }
    
    // Atajo para profesor (Ctrl+Shift+L para ver stats)
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'L') {
            e.preventDefault();
            const stats = database.ref('stats');
            stats.once('value').then(snap => {
                console.log('📊 ESTADÍSTICAS PARA EL PROFESOR:');
                console.log(snap.val());
                alert('Estadísticas en consola (F12)');
            });
        }
    });
});