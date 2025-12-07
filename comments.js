// comments.js - Sistema de Comentarios para Página Educativa
window.LOG && window.LOG("comments.js cargado");

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
        // Detectar si Firebase está disponible e inicializado; si no, usar localStorage como fallback
        this.useLocal = !checkFirebase();
        if (this.useLocal) {
            console.warn("Firebase no disponible o no inicializado. Usando localStorage para comentarios (modo fallback).");
        } else {
            this._log("Iniciando CommentSystem con Firebase...");
        }

        this.database = this.useLocal ? null : firebase.database();
        this.commentsRef = this.useLocal ? null : this.database.ref('comments');
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
        // Control de logs (activar con window.DEBUG_COMMENTS = true)
        this.debug = !!window.DEBUG_COMMENTS;

        // Configuración de administrador (defínela en index.html antes de cargar scripts)
        // Ejemplo: window.COMMENT_ADMIN = { emails: ['tu@correo.com'], uids: ['...'], ipHashes: ['ab12...'] }
        this.adminConfig = window.COMMENT_ADMIN || { emails: [], uids: [], ipHashes: [] };
        this.isAdminFlag = localStorage.getItem('commentIsAdmin') === 'true' || false;

        // Indicador de modo y auto-check para el caso en que Firebase se cargue después
        this.init();
        // Inicializar auth (si está disponible)
        this.initAuth();

        // Intentar detectar si Firebase aparece más tarde (por ejemplo si el usuario pega la config)
        if (this.useLocal) {
            let attempts = 0;
            const maxAttempts = 15; // ~30s
            const checkLater = setInterval(() => {
                attempts++;
                if (checkFirebase()) {
                    clearInterval(checkLater);
                    this._log('Firebase detectado después de la inicialización. Ahora se puede habilitar.');
                    // No migramos automáticamente pero habilitamos API para el usuario
                    this.database = firebase.database();
                    this.commentsRef = this.database.ref('comments');
                    this.updateModeIndicator();
                    this._log('Llama a window.commentSystem.migrateLocalToFirebase() para mover comentarios locales a Firebase.');
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkLater);
                }
            }, 2000);
        }
    }

    updateModeIndicator() {
        const el = document.getElementById('comment-mode');
        if (!el) return;
        if (this.useLocal) {
            el.textContent = 'Modo: local (usando localStorage)';
            el.classList.add('mode-local');
            el.classList.remove('mode-firebase');
        } else {
            el.textContent = 'Modo: Firebase (en línea)';
            el.classList.add('mode-firebase');
            el.classList.remove('mode-local');
        }
    }

    _log(...args) {
        if (this.debug) console.log('[CommentSystem]', ...args);
    }

    async initAuth() {
        // Si Firebase Auth no está presente, intentar detectarlo más tarde
        if (typeof firebase === 'undefined' || !firebase.auth) {
            this._log('Firebase Auth no disponible, reintentando en 1s');
            let attempts = 0;
            const ic = setInterval(() => {
                attempts++;
                if (typeof firebase !== 'undefined' && firebase.auth) {
                    clearInterval(ic);
                    this._setupAuthListeners();
                } else if (attempts > 10) {
                    clearInterval(ic);
                    this._log('Firebase Auth no detectado');
                }
            }, 1000);
            return;
        }

        this._setupAuthListeners();
    }

    _setupAuthListeners() {
        try {
            this.auth = firebase.auth();
            this.auth.onAuthStateChanged((user) => {
                if (user) {
                    this.userId = 'auth_' + user.uid;
                    this.userName = user.displayName || user.email || this.userName;
                    localStorage.setItem('commentUserId', this.userId);
                    localStorage.setItem('commentUserName', this.userName);
                } else {
                    // Si no hay usuario, respetar lo almacenado o mantener local
                    const storedId = localStorage.getItem('commentUserId');
                    const storedName = localStorage.getItem('commentUserName');
                    if (storedId) this.userId = storedId;
                    if (storedName) this.userName = storedName;
                }
                // Detectar admin desde auth
                if (user && this._checkAdminFromAuth(user)) {
                    this.isAdminFlag = true;
                    localStorage.setItem('commentIsAdmin', 'true');
                }
                this.updateUserUI();
            });

            // Asociar botones si existen
            document.addEventListener('DOMContentLoaded', () => this._wireAuthButtons());
            this._wireAuthButtons();

            // Intentar verificación silenciosa (auth o IP) una vez que los listeners están listos
            try {
                this.attemptSilentAdminCheck();
            } catch (e) {
                this._log('Error en intento de verificación silenciosa:', e);
            }
        } catch (err) {
            this._log('Error configurando auth listeners', err);
        }
    }

    async attemptSilentAdminCheck() {
        // 1) Si ya es admin, nada que hacer
        if (this.isAdmin()) return;

        // 2) Si ya hay usuario autenticado, _checkAdminFromAuth en onAuthStateChanged se encargará,
        //    pero hacemos un intento inmediato por si el estado ya está presente.
        try {
            if (this.auth && this.auth.currentUser) {
                const user = this.auth.currentUser;
                if (this._checkAdminFromAuth(user)) {
                    this.isAdminFlag = true;
                    localStorage.setItem('commentIsAdmin', 'true');
                    this.updateUserUI();
                    this.showMessage('Verificación silenciosa: eres administrador (por cuenta).', 'success');
                    return;
                }
            }
        } catch (e) {
            this._log('Error verificando admin por auth:', e);
        }

        // 3) Si no hay auth que lo identifique, y si hay ipHashes configurados, intentar identificar por IP
        try {
            const ipCheckedFlag = 'comment_ip_checked';
            if (this.adminConfig && Array.isArray(this.adminConfig.ipHashes) && this.adminConfig.ipHashes.length > 0 && !localStorage.getItem(ipCheckedFlag)) {
                // Hacer una llamada pública para obtener IP (avisar en consola)
                this._log('Intentando verificación silenciosa por IP...');
                const res = await fetch('https://api.ipify.org?format=json');
                const j = await res.json();
                const ip = j && j.ip ? j.ip : null;
                if (!ip) {
                    localStorage.setItem(ipCheckedFlag, '1');
                    this._log('No se obtuvo IP para verificación silenciosa');
                    return;
                }
                const hash = await this._sha256Hex(ip);
                const short = hash.slice(0, 12);
                this._log('IP detectada (hash corto):', short);
                if (this.adminConfig.ipHashes.includes(short)) {
                    this.userId = 'ip_' + short;
                    this.userName = 'Admin (IP)';
                    this.isAdminFlag = true;
                    localStorage.setItem('commentIsAdmin', 'true');
                    localStorage.setItem('commentUserId', this.userId);
                    localStorage.setItem('commentUserName', this.userName);
                    this.updateUserUI();
                    this.showMessage('Verificación silenciosa: administrador identificado por IP', 'success');
                } else {
                    this._log('Verificación silenciosa por IP: no autorizado');
                }
                // Marcar que ya se comprobó esta sesión para no repetir peticiones
                localStorage.setItem(ipCheckedFlag, '1');
            }
        } catch (e) {
            this._log('Error en verificación silenciosa por IP:', e);
        }
    }

    _wireAuthButtons() {
        const googleBtn = document.getElementById('signin-google');
        const ipBtn = document.getElementById('identify-ip');
        const localBtn = document.getElementById('local-identity');
        const signoutBtn = document.getElementById('signout-btn');
        let showUidBtn = document.getElementById('show-uid');

        // Si no existe el botón de UID, crearlo y añadirlo al contenedor de auth
        if (!showUidBtn) {
            const container = document.getElementById('comment-auth');
                if (container) {
                    showUidBtn = document.createElement('button');
                    showUidBtn.id = 'show-uid';
                    showUidBtn.textContent = 'Mostrar mi UID';
                    showUidBtn.className = 'cs-uid-btn';
                    container.appendChild(showUidBtn);
            }
        }

        if (googleBtn) googleBtn.onclick = () => this.signInWithGoogle();
        if (ipBtn) ipBtn.onclick = () => this.identifyByIP();
        if (localBtn) localBtn.onclick = () => {
            if (!this.isAdmin()) return this.showMessage('Solo el administrador puede usar identidad local', 'error');
            this.setLocalIdentity();
        };
        if (signoutBtn) signoutBtn.onclick = () => this.signOutAuth();

        // Mostrar/ocultar botones admin
        if (localBtn) localBtn.classList.toggle('hidden', !this.isAdmin());
        if (ipBtn) ipBtn.classList.remove('hidden'); // permitimos intentar identificar por IP (puede otorgar admin)
        // Mostrar/ocultar botón de UID solo para el usuario autenticado
        if (showUidBtn) {
            showUidBtn.classList.toggle('hidden', !(this.auth && this.auth.currentUser));
            showUidBtn.onclick = async () => {
                try {
                    const uid = (this.auth && this.auth.currentUser) ? this.auth.currentUser.uid : null;
                    if (!uid) return this.showMessage('No estás autenticado', 'error');
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(uid);
                        this.showMessage('UID copiado al portapapeles', 'success');
                    } else {
                        // Fallback: prompt para que copie manualmente
                        window.prompt('Tu UID (cópialo manualmente):', uid);
                    }
                } catch (err) {
                    this._log('Error copiando UID', err);
                    this.showMessage('No se pudo copiar el UID', 'error');
                }
            };
        }

        this.updateUserUI();
    }

    isAdmin() {
        if (this.isAdminFlag) return true;
        // Check auth currentUser
        if (this.auth && this.auth.currentUser) {
            const u = this.auth.currentUser;
            if (this.adminConfig.uids && this.adminConfig.uids.includes(u.uid)) return true;
            if (this.adminConfig.emails && u.email && this.adminConfig.emails.includes(u.email)) return true;
        }
        // Check stored userId (ip_)
        const storedId = localStorage.getItem('commentUserId');
        if (storedId && storedId.startsWith('ip_')) {
            const hash = storedId.slice(3);
            if (this.adminConfig.ipHashes && this.adminConfig.ipHashes.includes(hash)) return true;
        }
        return false;
    }

    _checkAdminFromAuth(user) {
        if (!user) return false;
        if (this.adminConfig.uids && this.adminConfig.uids.includes(user.uid)) return true;
        if (this.adminConfig.emails && user.email && this.adminConfig.emails.includes(user.email)) return true;
        return false;
    }

    updateUserUI() {
        const el = document.getElementById('user-status');
        const signoutBtn = document.getElementById('signout-btn');
        const googleBtn = document.getElementById('signin-google');
        if (el) el.textContent = `Identidad: ${this.userName || 'visitante'}${this.isAdmin() ? ' (admin)' : ''}`;
        if (this.auth && this.auth.currentUser) {
            if (signoutBtn) signoutBtn.classList.remove('hidden');
            if (googleBtn) googleBtn.classList.add('hidden');
        } else {
            if (signoutBtn) signoutBtn.classList.add('hidden');
            if (googleBtn) googleBtn.classList.remove('hidden');
        }

        // Asegurar que el botón Mostrar UID exista y su visibilidad esté sincronizada
        try {
            const container = document.getElementById('comment-auth');
            if (container) {
                let showUidBtn = document.getElementById('show-uid');
                if (!showUidBtn) {
                    showUidBtn = document.createElement('button');
                    showUidBtn.id = 'show-uid';
                    showUidBtn.textContent = 'Mostrar mi UID';
                    showUidBtn.style.padding = '6px 10px';
                    showUidBtn.style.borderRadius = '8px';
                    showUidBtn.style.display = 'none';
                    container.appendChild(showUidBtn);

                    showUidBtn.onclick = async () => {
                        try {
                            const uid = (this.auth && this.auth.currentUser) ? this.auth.currentUser.uid : null;
                            if (!uid) return this.showMessage('No estás autenticado', 'error');
                            if (navigator.clipboard && navigator.clipboard.writeText) {
                                await navigator.clipboard.writeText(uid);
                                this.showMessage('UID copiado al portapapeles', 'success');
                            } else {
                                window.prompt('Tu UID (cópialo manualmente):', uid);
                            }
                        } catch (err) {
                            this._log('Error copiando UID', err);
                            this.showMessage('No se pudo copiar el UID', 'error');
                        }
                    };
                }

                // Mostrar solo si está autenticado
                showUidBtn.style.display = (this.auth && this.auth.currentUser) ? 'inline-block' : 'none';
            }
        } catch (e) {
            this._log('Error actualizando botón de UID:', e);
        }
    }

    async signInWithGoogle() {
        if (!this.auth) {
            this.showMessage('Autenticación no disponible', 'error');
            return;
        }
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            await this.auth.signInWithPopup(provider);
            this.showMessage('Sesión iniciada con Google', 'success');
        } catch (err) {
            this._log('Error signInWithGoogle', err);
            // Manejo específico para dominio no autorizado (OAuth)
            const code = err && err.code ? err.code : '';
            const msg = err && err.message ? err.message : 'Error desconocido';
            if (code === 'auth/unauthorized-domain' || (msg && msg.toLowerCase().includes('not authorized for oauth'))) {
                const projectId = (window.firebaseConfig && window.firebaseConfig.projectId) ? window.firebaseConfig.projectId : null;
                const consoleUrl = projectId ? `https://console.firebase.google.com/project/${projectId}/authentication/providers?authMode=signInMethod` : 'https://console.firebase.google.com/';
                // Mensaje visible y claro
                this.showMessage('Error: dominio no autorizado para OAuth. Revisa la consola de Firebase.', 'error');
                // Mostrar instrucciones rápidas en consola
                console.warn('Firebase Auth error:', code, msg);
                console.info('Añade tu dominio (ej. localhost o 127.0.0.1) en Firebase Console → Authentication → Authorized domains');
                console.info('Abrir Firebase Console (sign-in method):', consoleUrl);
                // Ofrecer abrir la consola (puede ser bloqueado por popup blocker)
                try {
                    if (confirm('Dominio no autorizado para OAuth. ¿Quieres abrir la página de métodos de inicio de sesión en Firebase Console para añadir tu dominio?')) {
                        window.open(consoleUrl, '_blank');
                    }
                } catch (e) {
                    // ignore
                }
                return;
            }

            // Mostrar detalle del error al usuario para depuración rápida
            this.showMessage(`Error iniciando sesión: ${code} ${msg}`, 'error');
        }
    }

    async signOutAuth() {
        if (!this.auth) return;
        try {
            await this.auth.signOut();
            localStorage.removeItem('commentUserId');
            localStorage.removeItem('commentUserName');
            this.userId = this.getUserId();
            this.userName = this.generateRandomName();
            this.updateUserUI();
            this.showMessage('Sesión cerrada', 'success');
        } catch (err) {
            this._log('Error signOut', err);
            this.showMessage('Error cerrando sesión', 'error');
        }
    }

    async identifyByIP() {
        try {
            const res = await fetch('https://api.ipify.org?format=json');
            const j = await res.json();
            const ip = j.ip || 'unknown';
            const hash = await this._sha256Hex(ip);
            const short = hash.slice(0, 12);
            // Si el hash está en la lista de admins, activar admin y permitir identificación
            if (this.adminConfig.ipHashes && this.adminConfig.ipHashes.includes(short)) {
                this.userId = 'ip_' + short;
                this.userName = 'Admin (IP)';
                this.isAdminFlag = true;
                localStorage.setItem('commentIsAdmin', 'true');
                localStorage.setItem('commentUserId', this.userId);
                localStorage.setItem('commentUserName', this.userName);
                this.updateUserUI();
                this.showMessage('Identificado como administrador por IP', 'success');
            } else {
                this.showMessage('IP obtenida, pero no autorizada como administrador', 'error');
            }
        } catch (err) {
            this._log('Error obteniendo IP', err);
            this.showMessage('No se pudo identificar por IP', 'error');
        }
    }

    async _sha256Hex(str) {
        try {
            const enc = new TextEncoder();
            const data = enc.encode(str);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (err) {
            this._log('Error sha256', err);
            return String(Math.abs(str.split('').reduce((s, c) => s + c.charCodeAt(0), 0))).slice(0,12);
        }
    }

    setLocalIdentity() {
        const name = prompt('Introduce tu nombre para mostrar (se guardará localmente):', this.userName || '');
        if (!name) return;
            if (!this.isAdmin()) return this.showMessage('Solo el administrador puede establecer identidad local', 'error');
            this.userName = name.trim().slice(0, 50) || this.userName;
            this.userId = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2,6);
            this.isAdminFlag = true;
            localStorage.setItem('commentUserId', this.userId);
            localStorage.setItem('commentUserName', this.userName);
            localStorage.setItem('commentIsAdmin', 'true');
            this.updateUserUI();
            this.showMessage('Identidad local (admin) guardada', 'success');
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

    // Cachear selectores frecuentes para mejor legibilidad y rendimiento
    cacheDOM() {
        this.$ = this.$ || {};
        this.$.commentText = document.getElementById('comment-text');
        this.$.charCount = document.getElementById('char-count');
        this.$.submitBtn = document.getElementById('submit-comment');
        this.$.previewBtn = document.getElementById('preview-comment');
        this.$.commentsList = document.getElementById('comments-list');
        this.$.commentAuth = document.getElementById('comment-auth');
        this.$.userStatus = document.getElementById('user-status');
    }
    // Agrega esta función y llámala después de init
    forceDisplayComments() {
    this._log("Forzando visualización de comentarios...");
    
    if (!this.database) {
        console.error("Database no disponible");
        return;
    }
    
    // Obtener comentarios directamente
    this.commentsRef.once('value')
        .then(snapshot => {
                if (snapshot.exists()) {
                this._log(`Encontrados ${snapshot.numChildren()} comentarios`);
                this.handleCommentsSnapshot(snapshot);
            } else {
                this._log("No hay comentarios");
                this.displayComments([]);
            }
        })
        .catch(error => {
            console.error("Error forzando visualización:", error);
        });
}

// Llamar desde consola: window.commentSystem.forceDisplayComments()
    
    setup() {
        this._log("Configurando sistema de comentarios...");
        
        // Verificar que existan los elementos HTML
        this.cacheDOM();
        if (!this.$.commentText) {
            console.error("No se encontró el textarea de comentarios");
            this.createCommentSection();
            // Volver a cachear después de crear la sección
            this.cacheDOM();
        }

        this.setupEventListeners();
        // Registrar atajo secreto de administrador (configurable)
        try { this.setupAdminShortcut(); } catch (e) { this._log('No se pudo registrar atajo admin:', e); }
        // Registrar atajo para iniciar sesión con Google (configurable)
        try { this.setupGoogleSignInShortcut(); } catch (e) { this._log('No se pudo registrar atajo de Google:', e); }
        this.updateModeIndicator();
        this.loadComments();
    }


    // Atajo configurable para abrir el flujo de Sign-In de Google
    setupGoogleSignInShortcut() {
        // Configurable desde window.COMMENT_ADMIN: { googleShortcutKey: 'KeyG' }
        const cfg = this.adminConfig || {};
        const keyCode = cfg.googleShortcutKey || 'KeyÑ'; // por defecto 'G'

        document.addEventListener('keydown', (e) => {
            // Ctrl+Alt+Shift+<Key> para activar (mismo modificador que el atajo admin)
            if (e.ctrlKey && e.altKey && e.shiftKey && e.code === keyCode) {
                e.preventDefault();
                // Si ya existe auth y user logueado, avisar
                if (this.auth && this.auth.currentUser) {
                    this.showMessage('Ya tienes sesión iniciada con Google', 'info');
                    return;
                }
                // Intentar iniciar flujo de Google Sign-In
                try {
                    this._log('Atajo Google detectado, lanzando signInWithGoogle()');
                    this.signInWithGoogle();
                } catch (err) {
                    this._log('Error al disparar signInWithGoogle desde atajo:', err);
                    this.showMessage('No fue posible iniciar sesión con Google', 'error');
                }
            }
        });
    }

    _grantAdminShortcut(source) {
        // Marca como administrador en storage y actualiza UI
        this.isAdminFlag = true;
        localStorage.setItem('commentIsAdmin', 'true');
        // Dar una userId administrada y nombre reconocible
        const id = 'admin_short_' + Date.now().toString(36);
        this.userId = id;
        this.userName = 'Admin (atajo)';
        localStorage.setItem('commentUserId', this.userId);
        localStorage.setItem('commentUserName', this.userName);
        this.updateUserUI();
        this.showMessage('Acceso administrativo concedido (atajo)', 'success');
        this._log('Admin shortcut granted via', source);
    }
    
    createCommentSection() {
        this._log("Creando sección de comentarios...");
        
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
    
    setupEventListeners() {
    this._log("Configurando event listeners...");
    
    // Esperar un momento para asegurar que el DOM esté listo
    setTimeout(() => {
        // Usar elementos cacheados si están disponibles
        const textarea = (this.$ && this.$.commentText) || document.getElementById('comment-text');
        const charCount = (this.$ && this.$.charCount) || document.getElementById('char-count');
        const submitBtn = (this.$ && this.$.submitBtn) || document.getElementById('submit-comment');
        const previewBtn = (this.$ && this.$.previewBtn) || document.getElementById('preview-comment');
        
            this._log("Elementos encontrados:", {
                textarea: !!textarea,
                charCount: !!charCount,
                submitBtn: !!submitBtn,
                previewBtn: !!previewBtn
            });
        
        if (!textarea) {
            console.error("Textarea no encontrado, creando...");
            this.createCommentSection();
            this.cacheDOM();
            return;
        }
        
        // Contador de caracteres
        textarea.addEventListener('input', () => {
            const length = textarea.value.length;
            if (charCount) {
                charCount.textContent = `${length}/500`;
                // Actualizar clases según longitud
                charCount.classList.toggle('char-count-danger', length > 450);
                charCount.classList.toggle('char-count-warn', length > 400 && length <= 450);
                charCount.classList.toggle('char-count-normal', length <= 400);
            }
        });
        
        // Enviar comentario
            if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this._log("Botón de enviar clickeado");
                this.submitComment();
            });
        }
        
        // Vista previa
        if (previewBtn) {
            previewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this._log("Botón de vista previa clickeado");
                this.showPreview();
            });
        }
        
        // Enviar con Ctrl+Enter
        textarea.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this._log("Ctrl+Enter detectado");
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
        
        const textareaParent = textarea.parentElement;
        if (textareaParent) {
            textareaParent.parentElement.insertBefore(previewDiv, textareaParent.nextSibling);
        } else {
            document.getElementById('comments-list').insertBefore(previewDiv, 
                document.getElementById('comments-list').firstChild);
        }
    }
    
    // Contenido de la vista previa (usar clases definidas en CSS)
    previewDiv.innerHTML = `
        <h4 class="preview-title">👁️ Vista Previa de tu Comentario:</h4>
        <div class="preview-content">
            <div class="preview-header">
                <span class="preview-author">${this.userName}</span>
                <span class="preview-time">Ahora mismo</span>
            </div>
            <div class="preview-text">${this.escapeHtml(text)}</div>
            <div class="preview-actions">
                <button class="preview-like-btn">🤍 <span>0</span></button>
            </div>
        </div>
        <div class="preview-controls">
            <button class="preview-confirm">✅ Publicar ahora</button>
            <button class="preview-cancel">❌ Cancelar</button>
            <button class="preview-edit">✏️ Editar</button>
        </div>
        <div class="preview-note">
            <strong>Recordatorio:</strong> Tu nombre será "${this.userName}" y no podrás editarlo después.
        </div>
    `;

    // Wire buttons created inside preview
    setTimeout(() => {
        const confirmBtn = previewDiv.querySelector('.preview-confirm');
        const cancelBtn = previewDiv.querySelector('.preview-cancel');
        const editBtn = previewDiv.querySelector('.preview-edit');
        if (confirmBtn) confirmBtn.addEventListener('click', () => window.commentSystem.submitComment());
        if (cancelBtn) cancelBtn.addEventListener('click', () => previewDiv.remove());
        if (editBtn) editBtn.addEventListener('click', () => document.getElementById('comment-text') && document.getElementById('comment-text').focus());
    }, 10);
    
    // Asegurarse de que esté visible
    previewDiv.style.display = 'block';
    
    // Desplazarse a la vista previa
    previewDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

    async migrateLocalToFirebase() {
        if (this.useLocal && (!window.firebase || !firebase.apps || firebase.apps.length === 0)) {
            this.showMessage('Firebase no está disponible. Inicializa Firebase primero.', 'error');
            return;
        }

        const key = 'comments_local';
        const stored = JSON.parse(localStorage.getItem(key) || '[]');
        if (!stored.length) {
            this.showMessage('No hay comentarios locales para migrar.', 'info');
            return;
        }

        try {
            this.showMessage('Iniciando migración a Firebase...', 'success');
            for (const c of stored) {
                const data = {
                    text: c.text || '',
                    author: c.author || 'Anónimo',
                    userId: c.userId || 'local',
                    timestamp: c.timestamp || Date.now(),
                    likes: c.likes || 0,
                    likedBy: c.likedBy || {}
                };
                await this.commentsRef.push().set(data);
            }

            // Borrar locales tras migrar
            localStorage.removeItem(key);
            this.showMessage('Migración completada. Comentarios movidos a Firebase.', 'success');
            // Forzar recarga desde Firebase
            this.useLocal = false;
            this.database = firebase.database();
            this.commentsRef = this.database.ref('comments');
            this.updateModeIndicator();
            this.loadComments();
        } catch (err) {
            console.error('Error migrando comentarios:', err);
            this.showMessage('Error migrando comentarios: ' + (err.message || err), 'error');
        }
    }
    async submitComment() {
    this._log("submitComment llamado");

    const textarea = document.getElementById('comment-text');
    const submitBtn = document.getElementById('submit-comment');

    if (!textarea || !submitBtn) {
        console.error("Elementos no encontrados");
        this.showMessage('Error: elementos del formulario no encontrados', 'error');
        return;
    }

    const text = textarea.value.trim();
    this._log("Texto a enviar:", text.substring(0, 50) + (text.length > 50 ? '...' : ''));
    
    if (!text) {
        this.showMessage('Por favor escribe un comentario', 'error');
        return;
    }
    
        // Verificar moderación
    if (this.moderator && this.moderator.moderate) {
        this._log("Verificando moderación...");
        const moderationResult = this.moderator.moderate(text);
        
        if (!moderationResult.safe) {
            this._log("Comentario rechazado:", moderationResult.reason);
            const userMessage = this.getUserFriendlyMessage(moderationResult);
            this.showMessage(userMessage, 'error');
            
            // Guardar en historial
            this.saveModerationLog(text, moderationResult);
            return;
        }
        this._log("Comentario aprobado por moderación");
    } else if (text.length > 500) {
        this.showMessage('El comentario es muy largo (máx. 500 caracteres)', 'error');
        return;
    }
    
    // Deshabilitar botón temporalmente
    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '⏳ Publicando...';
    
    try {
        if (this.useLocal) {
            this._log("Guardando comentario en localStorage (fallback)...");
            const commentsKey = 'comments_local';
            const stored = JSON.parse(localStorage.getItem(commentsKey) || '[]');

            const commentData = {
                id: 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                text: text,
                author: this.userName,
                userId: this.userId,
                timestamp: Date.now(),
                likes: 0,
                likedBy: {}
            };

            stored.push(commentData);
            localStorage.setItem(commentsKey, JSON.stringify(stored));

            // Limpiar textarea y contador
            textarea.value = '';
            const charCount = document.getElementById('char-count');
            if (charCount) {
                charCount.textContent = '0/500';
                charCount.classList.remove('char-count-warn','char-count-danger');
                charCount.classList.add('char-count-normal');
            }

            const previewDiv = document.getElementById('comment-preview');
            if (previewDiv) previewDiv.remove();

            this.showMessage('¡Comentario publicado (local)!', 'success');

            // Refrescar lista local
            this.loadComments();
        } else {
            this._log("Preparando datos para Firebase...");
            const commentData = {
                text: text,
                author: this.userName,
                userId: this.userId,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                likes: 0,
                likedBy: {}
            };

            this._log("Datos a enviar:", commentData);

            // Guardar en Firebase
            const newCommentRef = this.commentsRef.push();
            this._log("Referencia creada:", newCommentRef.key);

            await newCommentRef.set(commentData);
            this._log("Comentario guardado en Firebase");

            // Limpiar textarea
            textarea.value = '';

            // Actualizar contador
            const charCount = document.getElementById('char-count');
            if (charCount) {
                charCount.textContent = '0/500';
                charCount.classList.remove('char-count-warn','char-count-danger');
                charCount.classList.add('char-count-normal');
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
        }

    } catch (error) {
        this._log('Error publicando comentario:', error);
        this.showMessage(`Error: ${error.message}`, 'error');
    } finally {
        // Restaurar botón
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}
    
    loadComments() {
    this._log("Cargando comentarios desde Firebase...");
    
    try {
        // Obtener referencia a la lista de comentarios
        const commentsList = document.getElementById('comments-list');
        if (!commentsList) {
            console.error("Elemento comments-list no encontrado");
            return;
        }
        
        // Mostrar mensaje de carga
        commentsList.innerHTML = '<div class="loading-comments">⏳ Cargando comentarios...</div>';
        
        if (this.useLocal) {
            this._log("Cargando comentarios desde localStorage (fallback)...");
            const stored = JSON.parse(localStorage.getItem('comments_local') || '[]');
            // Asegurarse de que todos los objetos tengan la estructura esperada
            const comments = stored.map(c => ({
                id: c.id || ('local_' + (Date.now())),
                text: c.text || '',
                author: c.author || 'Anónimo',
                userId: c.userId || 'local',
                timestamp: c.timestamp || Date.now(),
                likes: c.likes || 0,
                likedBy: c.likedBy || {}
            }));

            // Ordenar por timestamp (más reciente primero)
            comments.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            this.displayComments(comments);
            return;
        }

        // Configurar listener para comentarios en tiempo real (Firebase)
        this.commentsRef.orderByChild('timestamp').on('value', 
            (snapshot) => {
                this._log("Nuevos datos recibidos de Firebase");
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
    this._log("Procesando snapshot...");

    const comments = [];
    
    // Verificar si hay datos
    if (!snapshot.exists()) {
        this._log("No hay comentarios en Firebase");
        this.displayComments([]);
        return;
    }
    
    // Recorrer todos los comentarios
    snapshot.forEach((childSnapshot) => {
            try {
                const comment = childSnapshot.val();
                comment.id = childSnapshot.key;
                comments.push(comment);
                this._log(`Comentario ${comment.id}: ${comment.author} - ${comment.text?.substring(0, 30)}...`);
            } catch (err) {
                console.error("Error procesando comentario:", err);
            }
    });
    
    this._log(`Total de comentarios encontrados: ${comments.length}`);
    
    // Ordenar por timestamp (más reciente primero)
    comments.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    // Mostrar comentarios
    this.displayComments(comments);
}
    
    displayComments(comments) {
    this._log("Mostrando", comments.length, "comentarios");
    
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
            const avatarLetter = this.escapeHtml((comment.author || 'U').charAt(0).toUpperCase());

            html += `
                <div class="comment-card" data-id="${comment.id || ''}">
                    <div class="comment-avatar">${avatarLetter}</div>
                    <div class="comment-body">
                        <div class="comment-header">
                            <span class="comment-author">${this.escapeHtml(comment.author)}</span>
                            <span class="comment-time">${timeAgo}</span>
                        </div>
                        <div class="comment-content">${this.escapeHtml(comment.text)}</div>
                        <div class="comment-actions">
                            <button class="like-btn ${isLiked ? 'liked' : ''} comment-like-btn" data-id="${comment.id}" data-liked="${isLiked ? '1' : '0'}" ${isLiked ? 'title="Ya te gusta"' : 'title="Dar like"'}>
                                <span class="heart">${isLiked ? '❤️' : '🤍'}</span>
                                <span class="like-count">${likeCount}</span>
                            </button>
                        </div>
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

    // Event delegation para likes
    if (this._boundLikeHandler) container.removeEventListener('click', this._boundLikeHandler);
    this._boundLikeHandler = (e) => {
        const btn = e.target.closest && e.target.closest('.comment-like-btn');
        if (!btn) return;
        const id = btn.getAttribute('data-id');
        if (!id) return;
        this.likeComment(id);
    };
    container.addEventListener('click', this._boundLikeHandler);

    this._log("Comentarios renderizados exitosamente");
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
            if (this.useLocal) {
                this._log("Registrando like en localStorage (fallback)...");
                const key = 'comments_local';
                const stored = JSON.parse(localStorage.getItem(key) || '[]');
                const idx = stored.findIndex(c => c.id === commentId);
                if (idx === -1) {
                    console.warn("Comentario local no encontrado para like:", commentId);
                    this.showMessage('Comentario no encontrado', 'error');
                    return;
                }

                const comment = stored[idx];
                comment.likedBy = comment.likedBy || {};
                comment.likes = comment.likes || 0;

                if (comment.likedBy[this.userId]) {
                    // quitar like
                    delete comment.likedBy[this.userId];
                    comment.likes = Math.max(0, comment.likes - 1);
                } else {
                    comment.likedBy[this.userId] = true;
                    comment.likes = (comment.likes || 0) + 1;
                }

                stored[idx] = comment;
                localStorage.setItem(key, JSON.stringify(stored));

                // Refrescar visual
                this.loadComments();
                return;
            }

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
            this._log('Error dando like:', error);
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
        this._log("=== DEBUG FIREBASE ===");
        
        if (!this.database) {
            console.error("Database no disponible");
            return;
        }
        
        // Verificar conexión
        const connectedRef = this.database.ref(".info/connected");
        connectedRef.on("value", (snap) => {
            this._log("Conectado a Firebase:", snap.val() ? "Sí" : "No");
        });
        
        // Verificar comentarios directamente
        this.commentsRef.once('value')
            .then((snapshot) => {
                this._log("Comentarios en Firebase:", snapshot.numChildren());
                
                snapshot.forEach((child) => {
                    this._log(`- ${child.key}:`, child.val());
                });
            })
            .catch(error => {
                console.error("Error obteniendo comentarios:", error);
            });
        
        this._log("=== FIN DEBUG ===");
}

// Llamar desde consola: window.commentSystem.debugFirebase()
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    getUserFriendlyMessage(moderationResult) {
        const messages = {
            'Texto inválido': '❌ El comentario no es válido.',
            'El comentario está vacío': '❌ Por favor escribe algo.',
            'El comentario debe tener al menos 3 caracteres': '❌ Tu comentario es muy corto (mínimo 3 caracteres).',
            'El comentario no puede exceder 500 caracteres': '❌ Tu comentario es muy largo (máximo 500 caracteres).',
            'Contiene lenguaje inapropiado (palabra ofensiva detectada)': '⚠️ Tu comentario contiene lenguaje inapropiado. Por favor, sé respetuoso.',
            'Posible intento de evadir filtro de contenido': '⚠️ Detectamos un intento de evasión de filtro. Por favor, usa lenguaje apropiado.',
            'Repetición excesiva de caracteres detectada': '⚠️ Evita repetir caracteres excesivamente (ej: "jajajaja").',
            'Detectado posible spam o contenido comercial': '🚫 No se permite contenido comercial, URLs ni emails.',
            'Lenguaje amenazante detectado': '🚫 No se permiten comentarios amenazantes. Todos nos merecemos respeto.',
            'El comentario está vacío': '❌ Tu comentario no puede estar vacío.'
        };
        
        const reason = moderationResult.reason;
        return messages[reason] || '❌ El comentario no cumple con nuestras normas. Por favor, sé respetuoso y constructivo.';
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
        // Delegar en la utilidad interna de toast
        this._showToast(message, type);
    }

    _showToast(message, type='info') {
        try {
            const container = document.createElement('div');
            container.className = `cs-toast ${type === 'success' ? 'cs-toast-success' : type === 'info' ? 'cs-toast-info' : 'cs-toast-error'}`;
            container.textContent = message;
            document.body.appendChild(container);
            setTimeout(() => {
                container.classList.add('cs-toast-hide');
                setTimeout(() => container.remove(), 350);
            }, 3000);
        } catch (e) {
            // fallback a alert
            try { alert(message); } catch (ee) { /* ignore */ }
        }
    }

    addStyles() {
        // Las reglas CSS principales se han extraído a `styles.css`; no inyectamos estilos desde JS.
        return;
    }
}

// Inicializar cuando todo esté listo
function initCommentSystem() {
    window.LOG && window.LOG("Intentando inicializar CommentSystem...");
    
    // Esperar a que Firebase esté listo
    const checkFirebaseReady = setInterval(() => {
        // Si Firebase no está cargado (`undefined`) o ya está inicializado, procedemos.
        if (typeof firebase === 'undefined' || (firebase && firebase.apps && firebase.apps.length > 0)) {
            clearInterval(checkFirebaseReady);
            window.LOG && window.LOG("Iniciando CommentSystem (Firebase cargado o no disponible)");

            // Crear instancia global (el constructor decidirá si usa Firebase o localStorage)
            window.commentSystem = new CommentSystem();

            // Agregar atajo de teclado para panel de moderación
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.shiftKey && e.key === 'M' && window.commentSystem) {
                    e.preventDefault();
                    if (window.commentSystem.showModerationPanel) window.commentSystem.showModerationPanel();
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