const animations = [
  'snow.js',
  'clouds.js',
  'particle.js',
  'square.js',
  'rain.js',
];

const random = Math.floor(Math.random() * animations.length);
const script = document.createElement('script');
script.src = `anim/${animations[random]}`;
document.body.appendChild(script);
