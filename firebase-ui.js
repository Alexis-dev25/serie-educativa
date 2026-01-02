/**
 * ============================================
 * COMPONENTES UI PARA FIREBASE
 * ============================================
 * Funciones para renderizar likes, comentarios y estadísticas
 */

/**
 * Crea widget de likes para un artículo
 * @param {string} articleId
 * @param {HTMLElement} container
 */
async function createLikesWidget(articleId, container) {
  const currentLikes = await firebaseService.getLikes(articleId);
  
  const widget = document.createElement('div');
  widget.className = 'firebase-stat';
  widget.innerHTML = `
    <div class="firebase-stat-number">${currentLikes}</div>
    <div class="firebase-stat-label">Likes</div>
    <button class="firebase-button like-btn" data-article-id="${articleId}" style="margin-top: 0.4rem; width: 100%; font-size: 0.75rem; padding: 0.35rem;">
      👍 Me gusta
    </button>
  `;

  widget.querySelector('.like-btn').addEventListener('click', async (e) => {
    e.target.disabled = true;
    const newCount = await firebaseService.addLike(articleId);
    widget.querySelector('.firebase-stat-number').textContent = newCount;
    e.target.disabled = false;
  });

  if (container) {
    container.appendChild(widget);
  }
  return widget;
}

/**
 * Crea widget de estadísticas de visitas
 * @param {string} articleId
 * @param {HTMLElement} container
 */
async function createVisitsWidget(articleId, container) {
  const stats = await firebaseService.getVisitStats(articleId);
  
  const widget = document.createElement('div');
  widget.className = 'firebase-stat';
  widget.innerHTML = `
    <div class="firebase-stat-number">${stats.visits}</div>
    <div class="firebase-stat-label">Visitas</div>
  `;

  // Registrar esta visita
  await firebaseService.recordVisit(articleId, {
    page: window.location.pathname,
    referrer: document.referrer || 'directo'
  });

  if (container) {
    container.appendChild(widget);
  }
  return widget;
}

/**
 * Crea widget de comentarios
 * @param {string} articleId
 * @param {HTMLElement} container
 */
async function createCommentsWidget(articleId, container) {
  const comments = await firebaseService.getComments(articleId);
  
  const widget = document.createElement('div');
  widget.className = 'firebase-stat';
  widget.innerHTML = `
    <div class="firebase-stat-number">${comments.length}</div>
    <div class="firebase-stat-label">Comentarios</div>
  `;

  if (container) {
    container.appendChild(widget);
  }
  return widget;
}

/**
 * Crea formulario para añadir comentario
 * @param {string} articleId
 * @param {HTMLElement} container
 * @param {Function} onSuccess - Callback después de enviar
 */
function createCommentForm(articleId, container, onSuccess = null) {
  const form = document.createElement('form');
  form.className = 'feedback-form';
  form.innerHTML = `
    <div>
      <label for="author-${articleId}" class="firebase-widget-label">Nombre (opcional)</label>
      <input 
        type="text" 
        id="author-${articleId}" 
        placeholder="Tu nombre o alias"
        value="Anónimo"
      />
    </div>
    
    <div>
      <label for="email-${articleId}" class="firebase-widget-label">Email (opcional)</label>
      <input 
        type="email" 
        id="email-${articleId}" 
        placeholder="tu@email.com"
      />
    </div>
    
    <div>
      <label for="comment-${articleId}" class="firebase-widget-label">Tu comentario</label>
      <textarea 
        id="comment-${articleId}" 
        placeholder="Comparte tu opinión..."
        rows="3"
        required
      ></textarea>
    </div>
    
    <div class="feedback-actions">
      <button type="submit" class="btn btn-primary">
        📤 Enviar comentario
      </button>
      <span class="form-status" style="font-size: 0.78rem; color: #9ca3af;"></span>
    </div>
  `;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const authorInput = form.querySelector(`#author-${articleId}`);
    const emailInput = form.querySelector(`#email-${articleId}`);
    const commentInput = form.querySelector(`#comment-${articleId}`);
    const statusSpan = form.querySelector('.form-status');

    const author = authorInput.value;
    const email = emailInput.value;
    const text = commentInput.value;

    if (!text.trim()) {
      statusSpan.textContent = '⚠️ El comentario no puede estar vacío';
      return;
    }

    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    statusSpan.textContent = '⏳ Enviando...';

    try {
      const commentId = await firebaseService.addComment(articleId, {
        author: author || 'Anónimo',
        email,
        text
      });

      if (commentId) {
        statusSpan.textContent = '✅ Comentario enviado';
        form.reset();
        authorInput.value = 'Anónimo';
        
        if (onSuccess) onSuccess();
      } else {
        statusSpan.textContent = '❌ Error al enviar';
      }
    } catch (error) {
      statusSpan.textContent = `❌ Error: ${error.message}`;
    } finally {
      submitBtn.disabled = false;
    }
  });

  if (container) {
    container.appendChild(form);
  }
  return form;
}

/**
 * Crea lista de comentarios para un artículo
 * @param {string} articleId
 * @param {HTMLElement} container
 * @param {boolean} autoRefresh
 */
async function createCommentsList(articleId, container, autoRefresh = true) {
  const list = document.createElement('div');
  list.className = 'firebase-comments';

  const refreshComments = async () => {
    const comments = await firebaseService.getComments(articleId);
    list.innerHTML = '';

    if (comments.length === 0) {
      list.innerHTML = '<div class="firebase-empty">Sin comentarios aún. ¡Sé el primero!</div>';
      return;
    }

    comments.forEach(comment => {
      const commentEl = document.createElement('div');
      commentEl.className = 'firebase-comment';
      commentEl.innerHTML = `
        <div class="firebase-comment-author">${escapeHtml(comment.author)}</div>
        <div class="firebase-comment-text">${escapeHtml(comment.text)}</div>
        <div class="firebase-comment-time">${formatDate(comment.timestamp)}</div>
      `;
      list.appendChild(commentEl);
    });
  };

  await refreshComments();

  if (autoRefresh) {
    firebaseService.listenToArticleUpdates(articleId, (data) => {
      refreshComments();
    });
  }

  if (container) {
    container.appendChild(list);
  }
  return list;
}

/**
 * Crea widget completo de interacción (likes + visitas + comentarios)
 * @param {string} articleId
 * @param {HTMLElement} container
 */
async function createInteractionWidget(articleId, container) {
  const widget = document.createElement('div');
  widget.className = 'firebase-widget';
  widget.id = `widget-${articleId}`;
  
  // Estadísticas (likes, visitas y comentarios)
  const statsRow = document.createElement('div');
  statsRow.className = 'firebase-widget-stats';
  
  // Sección de comentarios
  const commentSection = document.createElement('div');
  commentSection.style.marginTop = '0.8rem';
  commentSection.style.borderTop = '1px solid rgba(31, 41, 55, 0.95)';
  commentSection.style.paddingTop = '0.8rem';

  // Añadir componentes
  await createLikesWidget(articleId, statsRow);
  await createVisitsWidget(articleId, statsRow);
  await createCommentsWidget(articleId, statsRow);
  
  createCommentForm(articleId, commentSection, () => {
    createCommentsList(articleId, commentSection, false);
  });
  createCommentsList(articleId, commentSection);

  widget.appendChild(statsRow);
  widget.appendChild(commentSection);

  if (container) {
    container.appendChild(widget);
  }
  return widget;
}

/**
 * UTILIDADES
 */

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function formatDate(timestamp) {
  if (!timestamp) return 'hace poco';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'hace segundos';
  if (minutes < 60) return `hace ${minutes}m`;
  if (hours < 24) return `hace ${hours}h`;
  if (days < 7) return `hace ${days}d`;
  
  return date.toLocaleDateString('es-ES');
}
