const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = document.body.scrollWidth;
  canvas.height = document.body.scrollHeight;
}

resizeCanvas();

const drops = Array.from({ length: 200 }).map(() => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  length: Math.random() * 20 + 10,
  speed: Math.random() * 3 + 2,
  opacity: Math.random() * 0.2 + 0.05
}));

function animate() {
  ctx.fillStyle = 'rgba(10,25,47,0.3)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#64ffda';
  ctx.lineWidth = 1;

  drops.forEach(drop => {
    ctx.beginPath();
    ctx.moveTo(drop.x, drop.y);
    ctx.lineTo(drop.x, drop.y + drop.length);
    ctx.globalAlpha = drop.opacity;
    ctx.stroke();

    drop.y += drop.speed;
    if (drop.y > canvas.height) {
      drop.y = -drop.length;
      drop.x = Math.random() * canvas.width;
    }
  });

  ctx.globalAlpha = 1;
  requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  resizeCanvas();
});

animate();