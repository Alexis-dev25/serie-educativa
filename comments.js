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
    // Agrega esta función y llámala después de init
forceDisplayComments() {
    console.log("Forzando visualización de comentarios...");
    
    if (!this.database) {
        console.error("Database no disponible");
        return;
    }
    
    // Obtener comentarios directamente
    this.commentsRef.once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                console.log(`Encontrados ${snapshot.numChildren()} comentarios`);
                this.handleCommentsSnapshot(snapshot);
            } else {
                console.log("No hay comentarios");
                this.displayComments([]);
            }
        })
        .catch(error => {
            console.error("Error forzando visualización:", error);
        });
}

// Llamar desde consola: window.commentSystem.forceDisplayComments()
    
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
                    <textarea id="comment-text" placeholder="Comparte tus dudas, ejemplos o comentarios sobre programación... (máx. 500 caracteres)"maxlength="500" rows="4"></textarea>
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
    console.log("Configurando event listeners...");
    
    // Esperar un momento para asegurar que el DOM esté listo
    setTimeout(() => {
        const textarea = document.getElementById('comment-text');
        const charCount = document.getElementById('char-count');
        const submitBtn = document.getElementById('submit-comment');
        const previewBtn = document.getElementById('preview-comment');
        
        console.log("Elementos encontrados:", {
            textarea: !!textarea,
            charCount: !!charCount,
            submitBtn: !!submitBtn,
            previewBtn: !!previewBtn
        });
        
        if (!textarea) {
            console.error("Textarea no encontrado, creando...");
            this.createCommentSection();
            return;
        }
        
        // Contador de caracteres
        textarea.addEventListener('input', () => {
            const length = textarea.value.length;
            if (charCount) {
                charCount.textContent = `${length}/500`;
                charCount.style.color = length > 450 ? '#e74c3c' : length > 400 ? '#f39c12' : '#7f8c8d';
            }
        });
        
        // Enviar comentario
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log("Botón de enviar clickeado");
                this.submitComment();
            });
        }
        
        // Vista previa
        if (previewBtn) {
            previewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log("Botón de vista previa clickeado");
                this.showPreview();
            });
        }
        
        // Enviar con Ctrl+Enter
        textarea.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                console.log("Ctrl+Enter detectado");
                this.submitComment();
            }
            
            // Shift+Enter para vista previa
            if (e.shiftKey && e.key === 'Enter') {
                e.preventDefault();
                this.showPreview();
            }
        });
        
    }, 100); // Pequeño delay para asegurar DOM
}
    
showPreview() {
    const textarea = document.getElementById('comment-text');
    if (!textarea) return;
    
    const text = textarea.value.trim();
    
    if (!text) {
        this.showMessage('Escribe algo para ver la vista previa', 'info');
        return;
    }
    
    // Verificar moderación
    if (this.moderator && this.moderator.moderate) {
        const moderationResult = this.moderator.moderate(text);
        if (!moderationResult.safe) {
            this.showMessage(`Vista previa rechazada: ${moderationResult.reason}`, 'error');
            return;
        }
    }
    
    // Crear o actualizar vista previa
    let previewDiv = document.getElementById('comment-preview');
    
    if (!previewDiv) {
        previewDiv = document.createElement('div');
        previewDiv.id = 'comment-preview';
        previewDiv.className = 'comment-preview';
        previewDiv.style.cssText = `
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            border: 2px dashed #3498db;
            font-family: Arial, sans-serif;
        `;
        
        const textareaParent = textarea.parentElement;
        if (textareaParent) {
            textareaParent.parentElement.insertBefore(previewDiv, textareaParent.nextSibling);
        } else {
            document.getElementById('comments-list').insertBefore(previewDiv, 
                document.getElementById('comments-list').firstChild);
        }
    }
    
    // Contenido de la vista previa
    previewDiv.innerHTML = `
        <h4 style="margin-top: 0; color: #2c3e50;">👁️ Vista Previa de tu Comentario:</h4>
        <div class="preview-content" style="background: white; padding: 15px; border-radius: 5px; margin: 10px 0; min-height: 50px;">
            <div class="preview-header" style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px;">
                <span style="font-weight: bold; color: #2c3e50;">${this.userName}</span>
                <span style="color: #7f8c8d;">Ahora mismo</span>
            </div>
            <div class="preview-text" style="line-height: 1.5; color: #333; white-space: pre-wrap; word-break: break-word;">
                ${this.escapeHtml(text)}
            </div>
            <div class="preview-actions" style="margin-top: 10px;">
                <button class="preview-like-btn" style="background: none; border: none; color: #7f8c8d; cursor: pointer; display: flex; align-items: center; gap: 5px; font-size: 14px;">
                    🤍 <span>0</span>
                </button>
            </div>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 15px;">
            <button onclick="window.commentSystem.submitComment()" 
                    style="background: #2ecc71; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                ✅ Publicar ahora
            </button>
            <button onclick="document.getElementById('comment-preview').remove()" 
                    style="background: #e74c3c; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                ❌ Cancelar
            </button>
            <button onclick="document.getElementById('comment-text').focus()" 
                    style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                ✏️ Editar
            </button>
        </div>
        <div style="margin-top: 10px; font-size: 12px; color: #95a5a6;">
            <strong>Recordatorio:</strong> Tu nombre será "${this.userName}" y no podrás editarlo después.
        </div>
    `;
    
    // Asegurarse de que esté visible
    previewDiv.style.display = 'block';
    
    // Desplazarse a la vista previa
    previewDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
    async submitComment() {
    console.log("submitComment llamado");
    
    const textarea = document.getElementById('comment-text');
    const submitBtn = document.getElementById('submit-comment');
    
    if (!textarea || !submitBtn) {
        console.error("Elementos no encontrados");
        this.showMessage('Error: elementos del formulario no encontrados', 'error');
        return;
    }
    
    const text = textarea.value.trim();
    console.log("Texto a enviar:", text.substring(0, 50) + (text.length > 50 ? '...' : ''));
    
    if (!text) {
        this.showMessage('Por favor escribe un comentario', 'error');
        return;
    }
    
    // Verificar moderación
    if (this.moderator && this.moderator.moderate) {
        console.log("Verificando moderación...");
        const moderationResult = this.moderator.moderate(text);
        
        if (!moderationResult.safe) {
            console.log("Comentario rechazado:", moderationResult.reason);
            const userMessage = this.getUserFriendlyMessage(moderationResult);
            this.showMessage(userMessage, 'error');
            
            // Guardar en historial
            this.saveModerationLog(text, moderationResult);
            return;
        }
        console.log("Comentario aprobado por moderación");
    } else if (text.length > 500) {
        this.showMessage('El comentario es muy largo (máx. 500 caracteres)', 'error');
        return;
    }
    
    // Deshabilitar botón temporalmente
    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '⏳ Publicando...';
    
    try {
        console.log("Preparando datos para Firebase...");
        const commentData = {
            text: text,
            author: this.userName,
            userId: this.userId,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            likes: 0,
            likedBy: {}
        };
        
        console.log("Datos a enviar:", commentData);
        
        // Guardar en Firebase
        const newCommentRef = this.commentsRef.push();
        console.log("Referencia creada:", newCommentRef.key);
        
        await newCommentRef.set(commentData);
        console.log("Comentario guardado en Firebase");
        
        // Limpiar textarea
        textarea.value = '';
        
        // Actualizar contador
        const charCount = document.getElementById('char-count');
        if (charCount) {
            charCount.textContent = '0/500';
            charCount.style.color = '#7f8c8d';
        }
        
        // Eliminar vista previa si existe
        const previewDiv = document.getElementById('comment-preview');
        if (previewDiv) {
            previewDiv.remove();
        }
        
        this.showMessage('¡Comentario publicado! Aparecerá en la lista en segundos.', 'success');
        
        // Enfocar el textarea de nuevo
        setTimeout(() => {
            if (textarea) textarea.focus();
        }, 500);
        
    } catch (error) {
        console.error('Error publicando comentario:', error);
        this.showMessage(`Error: ${error.message}`, 'error');
    } finally {
        // Restaurar botón
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}
    
    loadComments() {
    console.log("Cargando comentarios desde Firebase...");
    
    try {
        // Obtener referencia a la lista de comentarios
        const commentsList = document.getElementById('comments-list');
        if (!commentsList) {
            console.error("Elemento comments-list no encontrado");
            return;
        }
        
        // Mostrar mensaje de carga
        commentsList.innerHTML = '<div class="loading-comments">⏳ Cargando comentarios...</div>';
        
        // Configurar listener para comentarios en tiempo real
        this.commentsRef.orderByChild('timestamp').on('value', 
            (snapshot) => {
                console.log("Nuevos datos recibidos de Firebase");
                this.handleCommentsSnapshot(snapshot);
            },
            (error) => {
                console.error("Error en listener de comentarios:", error);
                this.showCommentsError();
            }
        );
        
    } catch (error) {
        console.error("Error inicializando loadComments:", error);
        this.showCommentsError();
    }
}

handleCommentsSnapshot(snapshot) {
    console.log("Procesando snapshot...");
    
    const comments = [];
    
    // Verificar si hay datos
    if (!snapshot.exists()) {
        console.log("No hay comentarios en Firebase");
        this.displayComments([]);
        return;
    }
    
    // Recorrer todos los comentarios
    snapshot.forEach((childSnapshot) => {
        try {
            const comment = childSnapshot.val();
            comment.id = childSnapshot.key;
            comments.push(comment);
            console.log(`Comentario ${comment.id}: ${comment.author} - ${comment.text?.substring(0, 30)}...`);
        } catch (err) {
            console.error("Error procesando comentario:", err);
        }
    });
    
    console.log(`Total de comentarios encontrados: ${comments.length}`);
    
    // Ordenar por timestamp (más reciente primero)
    comments.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    // Mostrar comentarios
    this.displayComments(comments);
}
    
    displayComments(comments) {
    console.log("Mostrando", comments.length, "comentarios");
    
    const container = document.getElementById('comments-list');
    if (!container) {
        console.error("Contenedor de comentarios no encontrado");
        return;
    }
    
    // Si no hay comentarios
    if (comments.length === 0) {
        container.innerHTML = `
            <div class="empty-comments">
                <p>📝 No hay comentarios aún</p>
                <p><small>¡Sé el primero en comentar!</small></p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    comments.forEach(comment => {
        try {
            // Validar datos del comentario
            if (!comment.text || !comment.author) {
                console.warn("Comentario inválido:", comment);
                return;
            }
            
            const timeAgo = this.getTimeAgo(comment.timestamp);
            const isLiked = comment.likedBy && comment.likedBy[this.userId];
            const likeCount = comment.likes || 0;
            
            html += `
                <div class="comment-card" data-id="${comment.id || ''}">
                    <div class="comment-header">
                        <span class="comment-author">${this.escapeHtml(comment.author)}</span>
                        <span class="comment-time">${timeAgo}</span>
                    </div>
                    <div class="comment-content">${this.escapeHtml(comment.text)}</div>
                    <div class="comment-actions">
                        <button class="comment-like-btn ${isLiked ? 'liked' : ''}" 
                                onclick="window.commentSystem.likeComment('${comment.id}')"
                                ${isLiked ? 'title="Ya te gusta"' : 'title="Dar like"'}>
                            ${isLiked ? '❤️' : '🤍'} 
                            <span class="like-count">${likeCount}</span>
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error("Error generando HTML para comentario:", error, comment);
        }
    });
    
    // Añadir contador de comentarios
    const header = `<div style="margin-bottom: 15px; color: #7f8c8d; font-size: 14px;">
        <strong>${comments.length}</strong> comentario${comments.length !== 1 ? 's' : ''}
    </div>`;
    
    container.innerHTML = header + html;
    
    console.log("Comentarios renderizados exitosamente");
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
    if (!timestamp || timestamp === 0) {
        return 'reciente';
    }
    
    // Asegurar que timestamp sea número
    const ts = Number(timestamp);
    if (isNaN(ts)) {
        return 'reciente';
    }
    
    const now = Date.now();
    const seconds = Math.floor((now - ts) / 1000);
    
    // Si es futuro o muy reciente
    if (seconds < 0) return 'en el futuro';
    if (seconds < 10) return 'justo ahora';
    if (seconds < 60) return `hace ${seconds} segundos`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours} hora${hours !== 1 ? 's' : ''}`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `hace ${days} día${days !== 1 ? 's' : ''}`;
    
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `hace ${weeks} semana${weeks !== 1 ? 's' : ''}`;
    
    // Mostrar fecha completa si es muy antiguo
    return new Date(ts).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}
    // Agrega esta función a la clase CommentSystem
    debugFirebase() {
        console.log("=== DEBUG FIREBASE ===");
        
        if (!this.database) {
            console.error("Database no disponible");
            return;
        }
        
        // Verificar conexión
        const connectedRef = this.database.ref(".info/connected");
        connectedRef.on("value", (snap) => {
            console.log("Conectado a Firebase:", snap.val() ? "Sí" : "No");
        });
        
        // Verificar comentarios directamente
        this.commentsRef.once('value')
            .then((snapshot) => {
                console.log("Comentarios en Firebase:", snapshot.numChildren());
                
                snapshot.forEach((child) => {
                    console.log(`- ${child.key}:`, child.val());
                });
            })
            .catch(error => {
                console.error("Error obteniendo comentarios:", error);
            });
        
        console.log("=== FIN DEBUG ===");
}

// Llamar desde consola: window.commentSystem.debugFirebase()
    
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
        
        return messages[moderationResult.reason] || 'El comentario no cumple con nuestras normas. Por favor, sé respetuoso.';
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