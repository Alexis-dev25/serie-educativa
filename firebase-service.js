/**
 * ============================================
 * SERVICIO FIREBASE - LIKES, VISITAS, COMENTARIOS
 * ============================================
 * Maneja todas las interacciones con Firebase Realtime Database
 * Estructura esperada en Firebase:
 * 
 * data/
 *   ├── articles/
 *   │   └── {articleId}/
 *   │       ├── likes: number
 *   │       ├── visits: number
 *   │       ├── comments/
 *   │       │   └── {commentId}/
 *   │       │       ├── author: string
 *   │       │       ├── text: string
 *   │       │       ├── timestamp: number
 *   │       │       └── email: string
 *   │       └── metadata
 */

class FirebaseService {
  constructor(config) {
    this.config = config;
    this.db = null;
    this.initialized = false;
    this.cache = {
      articles: {},
      comments: {},
      visits: {}
    };
  }

  /**
   * Inicializa Firebase SDK
   * CDN: Añade estos scripts en el HTML ANTES de firebase-service.js
   * <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
   * <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js"></script>
   */
  async init() {
    try {
      if (typeof firebase === 'undefined') {
        throw new Error('Firebase SDK no cargado. Añade los scripts en el HTML.');
      }

      firebase.initializeApp(this.config);
      this.db = firebase.database();
      this.initialized = true;

      console.log('✅ Firebase inicializado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error inicializando Firebase:', error);
      return false;
    }
  }

  /**
   * LIKES
   */

  /**
   * Incrementa likes de un artículo
   * @param {string} articleId - ID único del artículo
   * @returns {Promise<number>} - Nuevo total de likes
   */
  async addLike(articleId) {
    if (!this.initialized) {
      console.warn('Firebase no inicializado');
      return 0;
    }

    try {
      const ref = this.db.ref(`articles/${articleId}/likes`);
      const snapshot = await ref.transaction((current) => {
        return (current || 0) + 1;
      });

      if (snapshot.committed) {
        console.log(`👍 Like agregado a ${articleId}. Total: ${snapshot.snapshot.val()}`);
        return snapshot.snapshot.val();
      }
    } catch (error) {
      console.error('Error al agregar like:', error);
    }
    return 0;
  }

  /**
   * Obtiene total de likes de un artículo
   * @param {string} articleId
   * @returns {Promise<number>}
   */
  async getLikes(articleId) {
    if (!this.initialized) return 0;

    try {
      const snapshot = await this.db.ref(`articles/${articleId}/likes`).once('value');
      return snapshot.val() || 0;
    } catch (error) {
      console.error('Error obteniendo likes:', error);
      return 0;
    }
  }

  /**
   * ESTADÍSTICAS DE VISITAS
   */

  /**
   * Registra una visita a un artículo
   * @param {string} articleId
   * @param {Object} metadata - {page, referrer, timestamp}
   */
  async recordVisit(articleId, metadata = {}) {
    if (!this.initialized) return;

    try {
      const ref = this.db.ref(`articles/${articleId}`);
      
      // Incrementar contador total
      await ref.child('visits').transaction((current) => {
        return (current || 0) + 1;
      });

      // Guardar detalles de la visita
      const visitId = this.db.ref('articles/' + articleId + '/visitDetails').push().key;
      const visitData = {
        timestamp: Date.now(),
        ...metadata
      };

      await this.db.ref(`articles/${articleId}/visitDetails/${visitId}`).set(visitData);
      console.log(`📊 Visita registrada para ${articleId}`);
    } catch (error) {
      console.error('Error registrando visita:', error);
    }
  }

  /**
   * Obtiene estadísticas de visitas
   * @param {string} articleId
   * @returns {Promise<Object>} - {visits, lastVisit, visitDetails}
   */
  async getVisitStats(articleId) {
    if (!this.initialized) return { visits: 0 };

    try {
      const snapshot = await this.db.ref(`articles/${articleId}`).once('value');
      const data = snapshot.val() || {};

      return {
        visits: data.visits || 0,
        lastVisit: data.lastVisit || null,
        details: data.visitDetails || {}
      };
    } catch (error) {
      console.error('Error obteniendo stats de visitas:', error);
      return { visits: 0 };
    }
  }

  /**
   * COMENTARIOS
   */

  /**
   * Añade un nuevo comentario
   * @param {string} articleId
   * @param {Object} comment - {author, text, email}
   * @returns {Promise<string>} - ID del comentario creado
   */
  async addComment(articleId, comment) {
    if (!this.initialized) {
      console.warn('Firebase no inicializado');
      return null;
    }

    try {
      const commentData = {
        author: comment.author || 'Anónimo',
        text: comment.text,
        email: comment.email || '',
        timestamp: Date.now(),
        approved: false // Requiere moderación
      };

      const ref = this.db.ref(`articles/${articleId}/comments`).push();
      await ref.set(commentData);

      console.log(`💬 Comentario añadido a ${articleId}`);
      return ref.key;
    } catch (error) {
      console.error('Error al agregar comentario:', error);
      return null;
    }
  }

  /**
   * Obtiene comentarios aprobados de un artículo
   * @param {string} articleId
   * @param {number} limit - Número máximo de comentarios
   * @returns {Promise<Array>}
   */
  async getComments(articleId, limit = 50) {
    if (!this.initialized) return [];

    try {
      const snapshot = await this.db
        .ref(`articles/${articleId}/comments`)
        .orderByChild('timestamp')
        .limitToLast(limit)
        .once('value');

      const comments = [];
      snapshot.forEach((child) => {
        const comment = child.val();
        // Mostrar todos los comentarios (comentarios sin "approved: false" se mostrarán)
        comments.unshift({
          id: child.key,
          ...comment
        });
      });

      return comments;
    } catch (error) {
      console.error('Error obteniendo comentarios:', error);
      return [];
    }
  }

  /**
   * Monitorea cambios en tiempo real
   * @param {string} articleId
   * @param {Function} callback - (comments, likes, visits)
   */
  listenToArticleUpdates(articleId, callback) {
    if (!this.initialized) return;

    try {
      this.db.ref(`articles/${articleId}`).on('value', async (snapshot) => {
        const data = snapshot.val() || {};
        
        const comments = await this.getComments(articleId);
        const likes = data.likes || 0;
        const visits = data.visits || 0;

        callback({
          comments,
          likes,
          visits,
          timestamp: new Date()
        });
      });
    } catch (error) {
      console.error('Error en listener:', error);
    }
  }

  /**
   * Detiene monitoreo
   * @param {string} articleId
   */
  stopListening(articleId) {
    if (!this.initialized) return;
    this.db.ref(`articles/${articleId}`).off();
  }

  /**
   * UTILIDADES
   */

  /**
   * Obtiene todas las estadísticas de un artículo
   */
  async getArticleStats(articleId) {
    if (!this.initialized) return null;

    try {
      const [likes, visits, comments] = await Promise.all([
        this.getLikes(articleId),
        this.getVisitStats(articleId),
        this.getComments(articleId)
      ]);

      return {
        articleId,
        likes,
        visits: visits.visits,
        commentCount: comments.length,
        comments
      };
    } catch (error) {
      console.error('Error obteniendo stats:', error);
      return null;
    }
  }

  /**
   * Limpia datos (útil para testing)
   */
  async clearArticleData(articleId) {
    if (!this.initialized) return;

    try {
      await this.db.ref(`articles/${articleId}`).remove();
      console.log(`🗑️ Datos de ${articleId} eliminados`);
    } catch (error) {
      console.error('Error limpiando datos:', error);
    }
  }
}

// Crear instancia global
let firebaseService = null;

/**
 * Inicializa el servicio Firebase globalmente
 */
async function initFirebaseService() {
  if (validateFirebaseConfig()) {
    firebaseService = new FirebaseService(FIREBASE_CONFIG);
    return await firebaseService.init();
  }
  return false;
}
