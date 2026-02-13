class Bubble {
  constructor(x, y, r, vy) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.vy = vy; // upward speed (positive value, we subtract)
    this.alive = true;
  }

  update() {
    this.y -= this.vy;
  }

  draw() {
    noFill();
    stroke(255, 170);
    strokeWeight(2);
    circle(this.x, this.y, this.r * 2);

    // small highlight
    noStroke();
    fill(255, 120);
    circle(this.x - this.r * 0.25, this.y - this.r * 0.25, this.r * 0.45);
  }

  hitsCircle(cx, cy, cr) {
    const d = dist(this.x, this.y, cx, cy);
    return d < this.r + cr;
  }
}
