class Star {
  constructor(x, y, r) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.alive = true;

    // pulse controls (soft + meditative)
    this.pulseSpeed = random(0.015, 0.03);
    this.pulsePhase = random(TAU);
  }

  update() {
    // stars can be mostly static; pulsing is handled in draw()
  }

  draw() {
    // Soft pulse 0..1
    const pulse =
      0.5 + 0.5 * sin(frameCount * this.pulseSpeed + this.pulsePhase);

    // Glow strength (subtle)
    const glow = lerp(40, 120, pulse);

    push();
    translate(this.x, this.y);
    noStroke();

    // Outer glow layers
    for (let i = 3; i >= 1; i--) {
      fill(255, 240, 180, glow / (i * 1.2));
      circle(0, 0, this.r * 2 + i * 10);
    }

    // Star core
    fill(255, 250, 210, 220);
    this.drawStarShape(0, 0, this.r * 0.8, this.r * 1.6, 5);

    pop();
  }

  drawStarShape(x, y, innerR, outerR, points) {
    beginShape();
    const step = TAU / points;
    const halfStep = step / 2;

    for (let a = -HALF_PI; a < TAU - HALF_PI + 0.0001; a += step) {
      vertex(x + cos(a) * outerR, y + sin(a) * outerR);
      vertex(x + cos(a + halfStep) * innerR, y + sin(a + halfStep) * innerR);
    }
    endShape(CLOSE);
  }

  hitsCircle(cx, cy, cr) {
    const d = dist(this.x, this.y, cx, cy);
    return d < this.r + cr;
  }
}
