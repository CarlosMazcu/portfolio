// Carga únicamente la animación de partículas, resolviendo ruta relativa al propio loader
const baseUrl = new URL('.', (document.currentScript && document.currentScript.src) || window.location.href);
const script = document.createElement('script');
script.src = new URL('particle.js', baseUrl).href;
document.body.appendChild(script);
