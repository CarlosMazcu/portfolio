const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = document.body.scrollWidth;
  canvas.height = document.body.scrollHeight;
}

resizeCanvas();

const columns = [];
const colors = ['#64ffda', '#0a192f', '#112240', '#233554'];
const colWidth = 40;
const speedRange = [1, 3];

class Column {
  constructor(x) {
    this.x = x;
    this.height = Math.random() * canvas.height;
    this.speed = Math.random() * (speedRange[1] - speedRange[0]) + speedRange[0];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update() {
    this.height += this.speed;
    if (this.height > canvas.height) {
      this.height = 0;
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, 0, colWidth, this.height);
  }
}

function initColumns() {
  columns.length = 0;
  for (let x = 0; x < canvas.width; x += colWidth) {
    columns.push(new Column(x));
  }
}

function animate() {
  ctx.fillStyle = 'rgba(10, 25, 47, 0.3)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  columns.forEach(col => {
    col.update();
    col.draw();
  });
  requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  resizeCanvas();
  initColumns();
});

initColumns();
animate(); 
