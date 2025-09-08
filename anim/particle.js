const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let viewW = 0, viewH = 0;
let particles = [];
let isMobile = false;
const mouse = { x: null, y: null, radius: 120 };
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let skipLines = false;

function resizeCanvas() {
  viewW = Math.max(window.innerWidth, 320);
  viewH = Math.max(window.innerHeight, 240);
  isMobile = window.matchMedia('(max-width: 768px)').matches;

  const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.75);
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.width = Math.floor(viewW * dpr);
  canvas.height = Math.floor(viewH * dpr);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);

  mouse.radius = isMobile ? 80 : 120;
}

function computeParticleCount() {
  const area = viewW * viewH; // CSS pixels
  const baseDiv = reducedMotion.matches ? 18000 : 12000;
  let count = Math.round(area / baseDiv); // density
  const min = reducedMotion.matches ? 30 : (isMobile ? 50 : 120);
  const max = reducedMotion.matches ? 120 : (isMobile ? 160 : 360);
  return Math.max(min, Math.min(count, max));
}

window.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
window.addEventListener('touchmove', e => {
  const t = e.touches[0];
  if (!t) return;
  mouse.x = t.clientX;
  mouse.y = t.clientY;
}, { passive: true });

class Particle {
  constructor() {
    this.reset(true);
  }

  reset(randomPos = false) {
    this.x = randomPos ? Math.random() * viewW : (Math.random() < 0.5 ? 0 : viewW);
    this.y = randomPos ? Math.random() * viewH : Math.random() * viewH;
    const rMin = isMobile ? 0.8 : 1.0;
    const rMax = isMobile ? 1.6 : 2.2;
    this.radius = Math.random() * (rMax - rMin) + rMin;
    this.color = '#64ffda';
    const v = isMobile ? 0.35 : 0.6;
    this.speedX = Math.random() * v - v / 2;
    this.speedY = Math.random() * v - v / 2;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    // Bounce on bounds
    if (this.x < 0 || this.x > viewW) this.speedX *= -1;
    if (this.y < 0 || this.y > viewH) this.speedY *= -1;

    // Mouse/touch repulsion
    if (mouse.x != null && mouse.y != null) {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < mouse.radius) {
        this.x -= dx / dist;
        this.y -= dy / dist;
      }
    }
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

function initParticles() {
  const count = computeParticleCount();
  particles = new Array(count);
  for (let i = 0; i < count; i++) particles[i] = new Particle();
}

function connectParticles() {
  if (reducedMotion.matches || skipLines) return; // honor user preference / save CPU when hidden
  if (particles.length <= 1) return;

  const base = Math.min(110, Math.max(70, Math.round(Math.min(viewW, viewH) / 10)));
  const threshold = isMobile ? Math.max(55, Math.round(base * 0.8)) : base;
  const step = Math.max(1, Math.floor(particles.length / (isMobile ? 60 : 80)));
  const maxLines = isMobile ? Math.min(320, particles.length * 3) : Math.min(800, particles.length * 6);
  const connectionsLimit = isMobile ? 2 : 3;
  let linesDrawn = 0;
  ctx.lineWidth = isMobile ? 0.8 : 1;

  for (let a = 0; a < particles.length; a++) {
    let connections = 0;
    for (let b = a + 1; b < particles.length; b += step) {
      const dx = particles[a].x - particles[b].x;
      const dy = particles[a].y - particles[b].y;
      const dist = Math.hypot(dx, dy);
      if (dist < threshold) {
        ctx.strokeStyle = `rgba(100, 255, 218, ${1 - dist / threshold})`;
        ctx.beginPath();
        ctx.moveTo(particles[a].x, particles[a].y);
        ctx.lineTo(particles[b].x, particles[b].y);
        ctx.stroke();
        connections++;
        linesDrawn++;
        if (connections >= connectionsLimit || linesDrawn >= maxLines) break;
      }
    }
    if (linesDrawn >= maxLines) break;
  }
}

function animate() {
  ctx.clearRect(0, 0, viewW, viewH);
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.update();
    p.draw();
  }
  connectParticles();
  requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  const prevMobile = isMobile;
  resizeCanvas();
  if (prevMobile !== isMobile) {
    initParticles();
  } else {
    const desired = computeParticleCount();
    if (desired !== particles.length) initParticles();
  }
});

resizeCanvas();
initParticles();
animate();

reducedMotion.addEventListener?.('change', () => {
  initParticles();
});

document.addEventListener('visibilitychange', () => {
  // When tab is hidden, skip drawing lines to save CPU
  skipLines = document.hidden;
});
