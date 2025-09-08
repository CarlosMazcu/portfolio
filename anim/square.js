const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = document.body.scrollWidth;
  canvas.height = document.body.scrollHeight;
}

resizeCanvas();

const squares = [];
const count = 64;

class FloatingSquare {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 50 + 10;
    this.alpha = Math.random() * 0.5 + 0.3;
    this.speedX = Math.random() * 0.5 - 0.25;
    this.speedY = Math.random() * 0.5 - 0.25;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = Math.random() * 0.02 - 0.01;
    this.color = '#64ffda';
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.rotation += this.rotationSpeed;
    if (this.x < -this.size || this.x > canvas.width + this.size || this.y < -this.size || this.y > canvas.height + this.size) {
      this.reset();
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.alpha;
    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    ctx.restore();
  }
}

function initSquares() {
  squares.length = 0;
  for (let i = 0; i < count; i++) {
    squares.push(new FloatingSquare());
  }
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  squares.forEach(square => {
    square.update();
    square.draw();
  });
  requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  resizeCanvas();
  initSquares();
});

initSquares();
animate();