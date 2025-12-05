(function(){
  const root = document.documentElement;
  const toggle = document.getElementById('theme-toggle');
  const storageKey = 'serie_theme_pref';

  function applyTheme(theme){
    root.setAttribute('data-theme', theme);
    if(toggle){
      toggle.textContent = theme === 'dark' ? '🌞' : '🌙';
      toggle.setAttribute('aria-pressed', theme === 'dark');
    }
  }

  function getPreferred(){
    const stored = localStorage.getItem(storageKey);
    if(stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  let theme = getPreferred();
  applyTheme(theme);

  if(toggle){
    toggle.addEventListener('click', ()=>{
      theme = (root.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
      localStorage.setItem(storageKey, theme);
      applyTheme(theme);
    });
  }

  // If system preference changes and user hasn't chosen, update
  if(window.matchMedia){
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener && mq.addEventListener('change', (e)=>{
      const stored = localStorage.getItem(storageKey);
      if(stored !== 'light' && stored !== 'dark'){
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
})();
