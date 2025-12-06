// comments.js - Sistema de Comentarios para Página Educativa
console.log("comments.js cargado");

// Verificar si Firebase está disponible
function checkFirebase() {
    if (typeof firebase === 'undefined') {
        console.error("Firebase no está disponible");
        return false;
    }
    if (!firebase.apps.length) {
        console.error("Firebase no está inicializado");
        return false;
    }
    return true;
}

// Sistema de Comentarios
class CommentSystem {
    constructor() {
        if (!checkFirebase()) {
            console.error("No se puede iniciar CommentSystem - Firebase no disponible");
            return;
        }
        
        console.log("Iniciando CommentSystem...");
        
        this.database = firebase.database();
        this.commentsRef = this.database.ref('comments');
        this.userId = this.getUserId();
        this.userName = this.generateRandomName();
        
        // Inicializar moderador
        this.moderator = new (window.CommentModerator || function() {
            // Modo de emergencia si no existe moderador
            console.warn("Moderator no disponible, usando versión simple");
            return {
                moderate: (text) => ({ safe: text.length > 0 && text.length <= 500 }),
                censorText: (text) => text
            };
        })();
        
        this.moderationHistory = JSON.parse(localStorage.getItem('moderationHistory')) || [];
        
        this.init();
    }
    
    getUserId() {
        let userId = localStorage.getItem('commentUserId');
        if (!userId) {
            userId = 'comment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('commentUserId', userId);
        }
        return userId;
    }
    
    generateRandomName() {
        const names = [
            "Estudiante Curioso", "Programador Novato", "Aprendiz de Código",
            "Explorador Digital", "Navegante del Saber", "Buscador de Conocimiento",
            "Estudiante Anónimo", "Visitante", "Aprendiz",
            "Código Nuevo", "Byte Feliz", "Debugger en Formación",
            "Estudiante Programador", "Fan del Código", "Amante de JS",
            "Pythonista", "Desarrollador Web", "Estudiante Frontend"
        ];
        return names[Math.floor(Math.random() * names.length)];
    }
    
    init() {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    setup() {
        console.log("Configurando sistema de comentarios...");
        
        // Verificar que existan los elementos HTML
        if (!document.getElementById('comment-text')) {
            console.error("No se encontró el textarea de comentarios");
            this.createCommentSection();
        }
        
        this.setupEventListeners();
        this.loadComments();
    }
    
    createCommentSection() {
        console.log("Creando sección de comentarios...");
        
        const container = document.createElement('div');
        container.id = 'comments-container';
        container.innerHTML = `
            <div class="comments-section">
                <h3>💬 Comentarios de Estudiantes</h3>
                
                <div class="comment-form">
                    <textarea id="comment-text" 
                              placeholder="Comparte tus dudas, ejemplos o comentarios sobre programación... (máx. 500 caracteres)"
                              maxlength="500" 
                              rows="4"></textarea>
                    <div class="comment-form-footer">
                        <span id="char-count">0/500</span>
                        <button id="submit-comment" class="comment-submit-btn">
                            📤 Publicar Comentario
                        </button>
                    </div>
                    <p class="comment-note">
                        Los comentarios son anónimos y se comparten entre todos los estudiantes.
                    </p>
                </div>
                
                <div class="comments-list" id="comments-list">
                    <div class="loading-comments">Cargando comentarios...</div>
                </div>
            </div>
        `;
        
        // Agregar estilos si no existen
        this.addStyles();
        
        // Agregar al final del body
        document.body.appendChild(container);
    }
    
    addStyles() {
        if (document.getElementById('comments-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'comments-styles';
        styles.textContent = `
            .comments-section {
                max-width: 800px;
                margin: 40px auto;
                padding: 20px;
                background: white;
                border-radius: 15px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                font-family: Arial, sans-serif;
            }
            
            .comment-form {
                margin-bottom: 30px;
            }
            
            .comment-form textarea {
                width: 100%;
                padding: 15px;
                border: 2px solid #ddd;
                border-radius: 10px;
                font-family: inherit;
                font-size: 16px;
                resize: vertical;
                transition: border 0.3s;
            }
            
            .comment-form textarea:focus {
                outline: none;
                border-color: #3498db;
            }
            
            .comment-form-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 10px;
            }
            
            #char-count {
                font-size: 14px;
                color: #7f8c8d;
            }
            
            .comment-submit-btn {
                background: linear-gradient(135deg, #3498db, #2980b9);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 25px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s;
            }
            
            .comment-submit-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
            }
            
            .comment-submit-btn:disabled {
                background: #95a5a6;
                cursor: not-allowed;
            }
            
            .comment-note {
                font-size: 12px;
                color: #95a5a6;
                margin-top: 10px;
                text-align: center;
            }
            
            .comments-list {
                margin-top: 30px;
            }
            
            .comment-card {
                background: #f8f9fa;
                border-radius: 10px;
                padding: 15px;
                margin-bottom: 15px;
                border-left: 4px solid #3498db;
                animation: fadeIn 0.5s;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .comment-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                font-size: 14px;
            }
            
            .comment-author {
                font-weight: bold;
                color: #2c3e50;
            }
            
            .comment-time {
                color: #7f8c8d;
            }
            
            .comment-content {
                line-height: 1.5;
                color: #333;
                white-space: pre-wrap;
                word-break: break-word;
            }
            
            .comment-actions {
                display: flex;
                gap: 15px;
                margin-top: 10px;
            }
            
            .comment-like-btn {
                background: none;
                border: none;
                color: #7f8c8d;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 14px;
            }
            
            .comment-like-btn:hover {
                color: #e74c3c;
            }
            
            .comment-like-btn.liked {
                color: #e74c3c;
            }
            
            .loading-comments {
                text-align: center;
                padding: 20px;
                color: #7f8c8d;
            }
            
            .empty-comments {
                text-align: center;
                padding: 40px;
                color: #95a5a6;
                font-style: italic;
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    setupEventListeners() {
        const textarea = document.getElementById('comment-text');
        const charCount = document.getElementById('char-count');
        const submitBtn = document.getElementById('submit-comment');
        
        if (!textarea || !charCount || !submitBtn) {
            console.error("Elementos del formulario no encontrados");
            return;
        }
        
        // Contador de caracteres
        textarea.addEventListener('input', () => {
            const length = textarea.value.length;
            charCount.textContent = `${length}/500`;
            
            if (length > 450) {
                charCount.style.color = '#e74c3c';
            } else if (length > 400) {
                charCount.style.color = '#f39c12';
            } else {
                charCount.style.color = '#7f8c8d';
            }
        });
        
        // Enviar comentario
        submitBtn.addEventListener('click', () => {
            this.submitComment();
        });
        
        // Enviar con Ctrl+Enter
        textarea.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.submitComment();
            }
        });
    }
    
    async submitComment() {
        const textarea = document.getElementById('comment-text');
        const submitBtn = document.getElementById('submit-comment');
        
        if (!textarea || !submitBtn) return;
        
        const text = textarea.value.trim();
        
        if (!text) {
            this.showMessage('Por favor escribe un comentario', 'error');
            return;
        }
        
        // Verificar moderación
        if (this.moderator && this.moderator.moderate) {
            const moderationResult = this.moderator.moderate(text);
            
            if (!moderationResult.safe) {
                const userMessage = this.getUserFriendlyMessage(moderationResult);
                this.showMessage(userMessage, 'error');
                
                // Guardar en historial
                this.saveModerationLog(text, moderationResult);
                return;
            }
        } else if (text.length > 500) {
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
    
    loadComments() {
        try {
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
            }, (error) => {
                console.error("Error cargando comentarios:", error);
                this.showCommentsError();
            });
        } catch (error) {
            console.error("Error inicializando listeners:", error);
            this.showCommentsError();
        }
    }
    
    displayComments(comments) {
        const container = document.getElementById('comments-list');
        if (!container) return;
        
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
    
    showCommentsError() {
        const container = document.getElementById('comments-list');
        if (container) {
            container.innerHTML = `
                <div class="empty-comments">
                    <p>⚠️ No se pudieron cargar los comentarios</p>
                    <p><small>Verifica tu conexión a internet</small></p>
                </div>
            `;
        }
    }
    
    async likeComment(commentId) {
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
            this.showMessage('No se pudo registrar el like', 'error');
        }
    }
    
    getTimeAgo(timestamp) {
        if (!timestamp) return 'reciente';
        
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        
        if (seconds < 60) return 'justo ahora';
        if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
        if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`;
        if (seconds < 2592000) return `hace ${Math.floor(seconds / 86400)} días`;
        if (seconds < 31536000) return `hace ${Math.floor(seconds / 2592000)} meses`;
        return `hace ${Math.floor(seconds / 31536000)} años`;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
        
        return messages[moderationResult.reason] || 
               'El comentario no cumple con nuestras normas. Por favor, sé respetuoso.';
    }
    
    saveModerationLog(originalText, result) {
        const logEntry = {
            timestamp: Date.now(),
            text: originalText.substring(0, 100),
            reason: result.reason,
            flaggedWord: result.flaggedWord
        };
        
        this.moderationHistory.unshift(logEntry);
        
        if (this.moderationHistory.length > 100) {
            this.moderationHistory = this.moderationHistory.slice(0, 100);
        }
        
        localStorage.setItem('moderationHistory', JSON.stringify(this.moderationHistory));
    }
    
    showMessage(message, type) {
        // Crear notificación simple
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
            max-width: 300px;
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

// Inicializar cuando todo esté listo
function initCommentSystem() {
    console.log("Intentando inicializar CommentSystem...");
    
    // Esperar a que Firebase esté listo
    const checkFirebaseReady = setInterval(() => {
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            clearInterval(checkFirebaseReady);
            console.log("Firebase listo, iniciando CommentSystem");
            
            // Crear instancia global
            window.commentSystem = new CommentSystem();
            
            // Agregar atajo de teclado para panel de moderación
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.shiftKey && e.key === 'M' && window.commentSystem) {
                    e.preventDefault();
                    window.commentSystem.showModerationPanel();
                }
            });
        }
    }, 1000);
    
    // Timeout por si Firebase nunca se carga
    setTimeout(() => {
        if (!window.commentSystem) {
            console.warn("CommentSystem no se pudo inicializar - Firebase no disponible");
        }
    }, 5000);
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCommentSystem);
} else {
    initCommentSystem();
}

// Exportar para uso global
window.CommentSystem = CommentSystem;