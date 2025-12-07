// debug.js - pequeño logger global para habilitar/deshabilitar logs
(function(){
    // Permitir que la bandera se establezca antes (por ejemplo en el entorno o por el usuario)
    if (typeof window === 'undefined') return;
    window.DEBUG_COMMENTS = window.DEBUG_COMMENTS || false;

    window.LOG = function(...args){
        if (window.DEBUG_COMMENTS) console.log(...args);
    };
    window.LOG_WARN = function(...args){
        if (window.DEBUG_COMMENTS) console.warn(...args);
    };
    window.LOG_ERROR = function(...args){
        // siempre mostrar errores
        console.error(...args);
    };
})();
