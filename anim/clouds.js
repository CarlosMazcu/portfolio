const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = document.body.scrollWidth;
  canvas.height = document.body.scrollHeight;
}

resizeCanvas();

const clouds = Array.from({ length: 100 }).map(() => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  radius: Math.random() * 100 + 50,
  speedX: Math.random() * 0.3 - 0.15,
  speedY: Math.random() * 0.2 - 0.1,
  alpha: Math.random() * 0.1 + 0.05
}));

function drawCloud(cloud) {
  const gradient = ctx.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, cloud.radius);
  gradient.addColorStop(0, `rgba(100,255,218,${cloud.alpha})`);
  gradient.addColorStop(1, 'rgba(10,25,47,0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
  ctx.fill();
}

function animate() {
  ctx.fillStyle = 'rgba(10,25,47,0.2)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  clouds.forEach(cloud => {
    cloud.x += cloud.speedX;
    cloud.y += cloud.speedY;

    if (cloud.x < -cloud.radius) cloud.x = canvas.width + cloud.radius;
    if (cloud.x > canvas.width + cloud.radius) cloud.x = -cloud.radius;
    if (cloud.y < -cloud.radius) cloud.y = canvas.height + cloud.radius;
    if (cloud.y > canvas.height + cloud.radius) cloud.y = -cloud.radius;

    drawCloud(cloud);
  });

  requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  resizeCanvas();
});

animate(); 

