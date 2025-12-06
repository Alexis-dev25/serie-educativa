// Sistema de Comentarios con Firebase
class CommentSystem {
    constructor() {
        this.database = firebase.database();
        this.commentsRef = this.database.ref('comments');
        this.moderator = new CommentModerator();
        
        // Historial de moderación (para admin)
        this.moderationHistory = JSON.parse(localStorage.getItem('moderationHistory')) || [];
        this.userId = localStorage.getItem('githubUserId') || 'anonymous_' + Math.random().toString(36).substr(2, 9);
        this.userName = this.generateRandomName();
        
        this.init();
    }
    async submitComment() {
        const textarea = document.getElementById('comment-text');
        const text = textarea.value.trim();
        const submitBtn = document.getElementById('submit-comment');
        
        if (!text) {
            this.showMessage('Por favor escribe un comentario', 'error');
            return;
        }
        
        // 1. Moderar el texto
        const moderationResult = this.moderator.moderate(text);
        
        if (!moderationResult.safe) {
            // Mostrar mensaje específico de moderación
            const userMessage = this.getUserFriendlyMessage(moderationResult);
            this.showMessage(userMessage, 'error');
            
            // Guardar en historial de moderación
            this.saveModerationLog(text, moderationResult);
            
            // Opcional: ofrecer versión censurada
            if (this.shouldOfferCensoredVersion(moderationResult)) {
                this.offerCensoredVersion(text);
            }
            
            return;
        }
        
        // 2. Si pasa moderación, continuar...
        // ... resto del código de submitComment ...
    }
    
    getUserFriendlyMessage(moderationResult) {
        const messages = {
            'Texto inválido': 'El comentario no es válido',
            'El comentario es muy corto': 'El comentario debe tener al menos 3 caracteres',
            'El comentario es muy largo': 'El comentario no puede exceder 500 caracteres',
            'Contiene palabras no permitidas': 'El comentario contiene lenguaje inapropiado',
            'Intento de evadir filtro detectado': 'Por favor, usa lenguaje apropiado',
            'Combinación de palabras peligrosa detectada': 'El comentario podría interpretarse como amenazante',
            'Repetición excesiva de caracteres': 'Evita repetir caracteres innecesariamente',
            'Posible intento de dividir palabras prohibidas': 'Usa lenguaje apropiado',
            'Lenguaje amenazante detectado': 'No se permiten comentarios amenazantes',
            'Demasiados enlaces (posible spam)': 'No se permiten múltiples enlaces',
            'Contenido sospechoso de spam/comercial': 'No se permite contenido comercial',
            'Uso excesivo de mayúsculas': 'Por favor, no uses mayúsculas excesivas'
        };
        
        return messages[moderationResult.reason] || 'El comentario no cumple con nuestras normas. Por favor, sé respetuoso.';
    }
    
    saveModerationLog(originalText, result) {
        const logEntry = {
            timestamp: Date.now(),
            text: originalText.substring(0, 100), // Solo primeros 100 chars
            reason: result.reason,
            flaggedWord: result.flaggedWord,
            combination: result.combination,
            urlCount: result.urlCount,
            upperCaseRatio: result.upperCaseRatio
        };
        
        this.moderationHistory.unshift(logEntry);
        
        // Mantener solo los últimos 100 registros
        if (this.moderationHistory.length > 100) {
            this.moderationHistory = this.moderationHistory.slice(0, 100);
        }
        
        localStorage.setItem('moderationHistory', JSON.stringify(this.moderationHistory));
    }
    
    shouldOfferCensoredVersion(result) {
        // Solo ofrecer censura para palabras específicas, no para spam/amenazas
        return result.reason.includes('palabras no permitidas') || result.reason.includes('evadir filtro');
    }
    
    offerCensoredVersion(text) {
        const censored = this.moderator.censorText(text);
        
        if (censored !== text && confirm('¿Quieres publicar una versión censurada?')) {
            document.getElementById('comment-text').value = censored;
            this.submitComment(); // Intentar nuevamente
        }
    }
    
    // Panel de administración de moderación
    showModerationPanel() {
        const panel = document.createElement('div');
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 30px rgba(0,0,0,0.3);
            z-index: 9999;
            max-width: 80%;
            max-height: 80vh;
            overflow-y: auto;
            font-family: monospace;
        `;
        
        let html = `
            <h3>📊 Panel de Moderación</h3>
            <p>Total de comentarios bloqueados: ${this.moderationHistory.length}</p>
            <hr>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="border: 1px solid #ccc; padding: 8px;">Hora</th>
                        <th style="border: 1px solid #ccc; padding: 8px;">Texto</th>
                        <th style="border: 1px solid #ccc; padding: 8px;">Razón</th>
                        <th style="border: 1px solid #ccc; padding: 8px;">Detalles</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        this.moderationHistory.forEach(entry => {
            const time = new Date(entry.timestamp).toLocaleTimeString();
            const text = entry.text.length > 50 ? entry.text.substring(0, 50) + '...' : entry.text;
            
            html += `
                <tr>
                    <td style="border: 1px solid #ccc; padding: 8px;">${time}</td>
                    <td style="border: 1px solid #ccc; padding: 8px;">${this.escapeHtml(text)}</td>
                    <td style="border: 1px solid #ccc; padding: 8px;">${entry.reason}</td>
                    <td style="border: 1px solid #ccc; padding: 8px;">
                        ${entry.flaggedWord ? `Palabra: ${entry.flaggedWord}<br>` : ''}
                        ${entry.combination ? `Combo: ${entry.combination}<br>` : ''}
                        ${entry.urlCount ? `URLs: ${entry.urlCount}<br>` : ''}
                        ${entry.upperCaseRatio ? `Mayús: ${entry.upperCaseRatio}` : ''}
                    </td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
            <hr>
            <button onclick="this.parentElement.remove()" style="padding: 10px 20px; margin-top: 10px;">
                Cerrar
            </button>
            <button onclick="window.commentSystem.clearModerationHistory()" style="padding: 10px 20px; margin-top: 10px; background: #e74c3c; color: white;">
                Limpiar Historial
            </button>
        `;
        
        panel.innerHTML = html;
        document.body.appendChild(panel);
    }
    
    clearModerationHistory() {
        if (confirm('¿Borrar todo el historial de moderación?')) {
            this.moderationHistory = [];
            localStorage.removeItem('moderationHistory');
            document.querySelector('[style*="position: fixed"]').remove();
            this.showModerationPanel(); // Recargar panel vacío
        }
    }
}

// Acceso al panel: Ctrl+Shift+M
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'M' && window.commentSystem) {
        e.preventDefault();
        window.commentSystem.showModerationPanel();
    }
});

    generateRandomName(); {
        const names = [
            "Estudiante Curioso", "Programador Novato", "Aprendiz de Código",
            "Explorador Digital", "Navegante del Saber", "Buscador de Conocimiento",
            "Estudiante Anónimo", "Visitante", "Aprendiz",
            "Código Nuevo", "Byte Feliz", "Debugger en Formación"
        ];
        return names[Math.floor(Math.random() * names.length)];
    }
    
    init(); {
        this.setupEventListeners();
        this.loadComments();
    }
    
    setupEventListeners(); {
        // Contador de caracteres
        const textarea = document.getElementById('comment-text');
        const charCount = document.getElementById('char-count');
        
        textarea.addEventListener('input', () => {
            const length = textarea.value.length;
            charCount.textContent = `${length}/500`;
            
            // Cambiar color cuando se acerca al límite
            if (length > 450) {
                charCount.style.color = '#e74c3c';
            } else if (length > 400) {
                charCount.style.color = '#f39c12';
            } else {
                charCount.style.color = '#7f8c8d';
            }
        });
        
        // Enviar comentario
        document.getElementById('submit-comment').addEventListener('click', () => {
            this.submitComment();
        });
        
        // Enviar con Enter (Ctrl+Enter)
        textarea.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.submitComment();
            }
        });
    }
    
    async submitComment(); {
        const textarea = document.getElementById('comment-text');
        const text = textarea.value.trim();
        const submitBtn = document.getElementById('submit-comment');
        
        if (!text) {
            this.showMessage('Por favor escribe un comentario', 'error');
            return;
        }
        
        if (text.length > 500) {
            this.showMessage('El comentario es muy largo (máx. 500 caracteres)', 'error');
            return;
        }
        
        // Deshabilitar botón temporalmente
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Publicando...';
        
        try {
            const commentData = {
                text: text,
                author: this.userName,
                userId: this.userId,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                likes: 0,
                likedBy: {}
            };
            
            // Guardar en Firebase
            const newCommentRef = this.commentsRef.push();
            await newCommentRef.set(commentData);
            
            // Limpiar textarea
            textarea.value = '';
            document.getElementById('char-count').textContent = '0/500';
            
            this.showMessage('¡Comentario publicado!', 'success');
            
        } catch (error) {
            console.error('Error publicando comentario:', error);
            this.showMessage('Error al publicar. Intenta nuevamente.', 'error');
        } finally {
            // Restaurar botón
            submitBtn.disabled = false;
            submitBtn.innerHTML = '📤 Publicar Comentario';
        }
    }
    
    loadComments(); {
        // Escuchar comentarios en tiempo real
        this.commentsRef.orderByChild('timestamp').on('value', (snapshot) => {
            const comments = [];
            snapshot.forEach((childSnapshot) => {
                const comment = childSnapshot.val();
                comment.id = childSnapshot.key;
                comments.push(comment);
            });
            
            // Ordenar por timestamp (más reciente primero)
            comments.sort((a, b) => b.timestamp - a.timestamp);
            
            this.displayComments(comments);
        });
    }
    
    displayComments(comments); {
        const container = document.getElementById('comments-list');
        
        if (comments.length === 0) {
            container.innerHTML = '<div class="empty-comments">No hay comentarios aún. ¡Sé el primero!</div>';
            return;
        }
        
        let html = '';
        
        comments.forEach(comment => {
            const timeAgo = this.getTimeAgo(comment.timestamp);
            const isLiked = comment.likedBy && comment.likedBy[this.userId];
            
            html += `
                <div class="comment-card" data-id="${comment.id}">
                    <div class="comment-header">
                        <span class="comment-author">${comment.author}</span>
                        <span class="comment-time">${timeAgo}</span>
                    </div>
                    <div class="comment-content">${this.escapeHtml(comment.text)}</div>
                    <div class="comment-actions">
                        <button class="comment-like-btn ${isLiked ? 'liked' : ''}" 
                                onclick="window.commentSystem.likeComment('${comment.id}')">
                            ${isLiked ? '❤️' : '🤍'} 
                            <span class="like-count">${comment.likes || 0}</span>
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    async likeComment(commentId); {
        try {
            const commentRef = this.database.ref(`comments/${commentId}`);
            const likeRef = this.database.ref(`comments/${commentId}/likedBy/${this.userId}`);
            
            // Verificar si ya dio like
            const snapshot = await likeRef.once('value');
            
            if (snapshot.exists()) {
                // Quitar like
                await likeRef.remove();
                await commentRef.child('likes').transaction(current => Math.max(0, (current || 0) - 1));
            } else {
                // Dar like
                await likeRef.set(true);
                await commentRef.child('likes').transaction(current => (current || 0) + 1);
            }
            
        } catch (error) {
            console.error('Error dando like:', error);
        }
    }
    
    getTimeAgo(timestamp); {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        
        const intervals = {
            año: 31536000,
            mes: 2592000,
            semana: 604800,
            día: 86400,
            hora: 3600,
            minuto: 60,
            segundo: 1
        };
        
        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `hace ${interval} ${unit}${interval !== 1 ? 's' : ''}`;
            }
        }
        
        return 'justo ahora';
    }
    
    escapeHtml(text); {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showMessage(message, type); {
        const messageEl = document.createElement('div');
        messageEl.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? '#2ecc71' : '#e74c3c'};
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            z-index: 10000;
            animation: slideIn 0.3s;
        `;
        
        // Agregar animación si no existe
        if (!document.getElementById('message-animation')) {
            const style = document.createElement('style');
            style.id = 'message-animation';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        messageEl.textContent = message;
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.style.animation = 'slideIn 0.3s reverse';
            setTimeout(() => messageEl.remove(), 300);
        }, 3000);
    }
}

// Inicializar cuando Firebase esté listo
document.addEventListener('DOMContentLoaded', async () => {
    // Esperar a que Firebase esté listo
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.error('Firebase no está disponible');
        return;
    }
    
    // Inicializar sistema de comentarios
    window.commentSystem = new CommentSystem();
    
});