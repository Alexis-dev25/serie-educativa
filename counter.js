// Sistema de Estadísticas Educativas - Versión Simplificada
class EduStats {
    constructor() {
        this.stats = JSON.parse(localStorage.getItem('eduStats')) || {
            totalVisits: 0,
            totalLikes: 0,
            todayVisits: 0,
            lastVisitDate: null,
            userLiked: false
        };
        
        this.init();
    }
    
    init() {
        const today = new Date().toDateString();
        
        // Incrementar visitas totales
        this.stats.totalVisits++;
        
        // Visitas de hoy
        if (this.stats.lastVisitDate !== today) {
            this.stats.todayVisits = 1;
            this.stats.lastVisitDate = today;
        } else {
            this.stats.todayVisits++;
        }
        
        this.save();
        this.display();
    }
    
    addLike() {
        if (!this.stats.userLiked) {
            this.stats.totalLikes++;
            this.stats.userLiked = true;
            this.save();
            this.display();
            
            // Efectos
            this.createConfetti();
            this.showNotification();
            
            return true;
        }
        return false;
    }
    
    getEngagement() {
        if (this.stats.totalVisits === 0) return "0%";
        const percentage = (this.stats.totalLikes / this.stats.totalVisits * 100);
        return percentage >= 1 ? `${percentage.toFixed(1)}%` : "<1%";
    }
    
    save() {
        localStorage.setItem('eduStats', JSON.stringify(this.stats));
    }
    
    display() {
        const formatNumber = (num) => {
            if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
            return num;
        };
        
        document.getElementById('total-visits').textContent = formatNumber(this.stats.totalVisits);
        document.getElementById('total-likes').textContent = formatNumber(this.stats.totalLikes);
        document.getElementById('today-visits').textContent = this.stats.todayVisits;
        document.getElementById('engagement').textContent = this.getEngagement();
        
        // Actualizar botón si ya dio like
        if (this.stats.userLiked) {
            const btn = document.getElementById('edu-like-btn');
            btn.innerHTML = '<span class="btn-icon">🎉</span> <span class="btn-text">¡Gracias!</span>';
            btn.classList.add('liked');
            btn.classList.remove('pulse');
            btn.disabled = true;
        }
    }
    
    createConfetti() {
        const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6'];
        
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.top = '-10px';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.width = (Math.random() * 10 + 5) + 'px';
                confetti.style.height = confetti.style.width;
                confetti.style.borderRadius = '50%';
                
                document.body.appendChild(confetti);
                
                // Animación
                const animation = confetti.animate([
                    { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
                    { transform: `translateY(${window.innerHeight}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
                ], {
                    duration: Math.random() * 2000 + 1000,
                    easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)'
                });
                
                animation.onfinish = () => confetti.remove();
            }, i * 30);
        }
    }
    
    showNotification() {
        const messages = [
            "¡Gracias! Tu like ayuda a otros estudiantes.",
            "¡Excelente! Motivación para crear más contenido.",
            "¡Gracias por apoyar la educación en programación!"
        ];
        
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        
        const notification = document.createElement('div');
        notification.className = 'like-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">🎓</span>
                <div class="notification-text">
                    <strong>¡Like registrado!</strong>
                    <small>${randomMsg}</small>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }
}

// Inicializar
const eduStats = new EduStats();

// Configurar botón
document.getElementById('edu-like-btn').addEventListener('click', () => {
    eduStats.addLike();
});

// Panel para el profesor (Ctrl+Shift+E)
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        showTeacherStats();
    }
    if (e.key === 'Escape') {
        hideTeacherStats();
    }
});

function showTeacherStats() {
    const stats = eduStats.stats;
    const panel = document.getElementById('teacher-stats');
    
    document.getElementById('stats-visits').textContent = stats.totalVisits;
    document.getElementById('stats-likes').textContent = stats.totalLikes;
    document.getElementById('stats-today').textContent = stats.todayVisits;
    document.getElementById('stats-engagement').textContent = eduStats.getEngagement();
    
    panel.style.display = 'flex';
    
    // Configurar botón cerrar
    document.getElementById('close-stats').onclick = hideTeacherStats;
}

function hideTeacherStats() {
    document.getElementById('teacher-stats').style.display = 'none';
}

// Cerrar al hacer clic fuera
document.getElementById('teacher-stats').addEventListener('click', function(e) {
    if (e.target === this) {
        hideTeacherStats();
    }
});

// Inicializar botón al cargar
document.addEventListener('DOMContentLoaded', () => {
    eduStats.display();
    
    // Mensaje en consola para el profesor
    console.log('%c🎓 Contador Educativo Activado', 'color: #3498db; font-size: 14px; font-weight: bold;');
    console.log('Presiona Ctrl+Shift+E para ver estadísticas detalladas');
});s