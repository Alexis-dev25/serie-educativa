// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const database = firebase.database();

class GitHubStats {
    constructor() {
        this.stats = { totalVisits: 0, totalLikes: 0, todayVisits: 0 };
        this.userLiked = localStorage.getItem('userLiked') === 'true';
        this.userId = this.getUserId();
        this.init();
    }
    
    getUserId() {
        let userId = localStorage.getItem('githubUserId');
        if (!userId) {
            userId = 'gh_' + Date.now() + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('githubUserId', userId);
        }
        return userId;
    }
    
    async init() {
        try {
            await this.registerVisit();
            this.setupRealtimeListeners();
        } catch (error) {
            console.log("Usando modo offline:", error);
            this.useOfflineMode();
        }
    }
    
    async registerVisit() {
        const today = new Date().toISOString().split('T')[0];
        const visitRef = database.ref('visits/' + today + '/' + this.userId);
        
        const snapshot = await visitRef.once('value');
        if (!snapshot.exists()) {
            await visitRef.set({
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                source: 'github_pages'
            });
            
            // Incrementar contadores
            const todayRef = database.ref('stats/today');
            todayRef.transaction(current => (current || 0) + 1);
            
            const totalRef = database.ref('stats/total');
            totalRef.transaction(current => (current || 0) + 1);
        }
    }
    
    setupRealtimeListeners() {
        // Escuchar estadísticas
        database.ref('stats').on('value', (snapshot) => {
            const data = snapshot.val() || {};
            this.stats.totalVisits = data.total || 0;
            this.stats.totalLikes = data.likes || 0;
            this.stats.todayVisits = data.today || 0;
            this.display();
        });
        
        // Verificar like del usuario
        database.ref('userLikes/' + this.userId).once('value', (snapshot) => {
            if (snapshot.exists()) {
                this.userLiked = true;
                localStorage.setItem('userLiked', 'true');
                this.updateButton();
            }
        });
    }
    
    async addLike() {
        if (!this.userLiked) {
            try {
                // Registrar like del usuario
                await database.ref('userLikes/' + this.userId).set({
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    from: 'github_pages'
                });
                
                // Incrementar contador global
                await database.ref('stats/likes').transaction(current => (current || 0) + 1);
                
                this.userLiked = true;
                localStorage.setItem('userLiked', 'true');
                
                this.updateButton();
                this.showConfetti();
                this.showSuccessMessage();
                
                return true;
            } catch (error) {
                console.error("Error con Firebase:", error);
                this.showOfflineMessage();
                return false;
            }
        }
        return false;
    }
    
    useOfflineMode() {
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
        
        document.getElementById('total-visits').textContent = format(this.stats.totalVisits);
        document.getElementById('total-likes').textContent = format(this.stats.totalLikes);
        document.getElementById('today-visits').textContent = this.stats.todayVisits;
        
        const engagement = this.stats.totalVisits > 0 ?
            ((this.stats.totalLikes / this.stats.totalVisits) * 100).toFixed(1) + '%' : '0%';
        document.getElementById('engagement').textContent = engagement;
    }
    
    updateButton() {
        if (this.userLiked) {
            const btn = document.getElementById('edu-like-btn');
            btn.innerHTML = '✅ ¡Gracias!';
            btn.classList.add('liked');
            btn.disabled = true;
        }
    }
    
    showConfetti() {
        // ... código de confetti (mismo que antes)
    }
    
    showSuccessMessage() {
        alert('¡Gracias por tu like! Tu apoyo ayuda a que más estudiantes encuentren este contenido.');
    }
    
    showOfflineMessage() {
        alert('Modo offline activado. Tu like se guardará localmente.');
    }
}

// Inicializar cuando la página cargue
document.addEventListener('DOMContentLoaded', () => {
    window.statsSystem = new GitHubStats();
    
    document.getElementById('edu-like-btn').addEventListener('click', async () => {
        await window.statsSystem.addLike();
    });
});