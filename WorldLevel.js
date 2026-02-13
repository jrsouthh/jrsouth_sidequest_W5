class WorldLevel {
  constructor(levelJson) {
    this.name = levelJson.name ?? "Level";

    this.theme = Object.assign(
      {
        bg: "#F0F0F0",
        platform: "#C8C8C8",
        blob: "#1478FF",
        bgTop: "#0A2A66",
        bgBottom: "#021126",
      },
      levelJson.theme ?? {},
    );

    // Physics knobs
    this.gravity = levelJson.gravity ?? 0.65;
    this.jumpV = levelJson.jumpV ?? -11.0;

    // Camera knob (data-driven view state)
    this.camLerp = levelJson.camera?.lerp ?? 0.12;
    this.scrollY = levelJson.camera?.scrollY ?? 0.0;

    // World size + death line
    this.w = levelJson.world?.w ?? 2400;
    this.h = levelJson.world?.h ?? 360;
    this.deathY = levelJson.world?.deathY ?? this.h + 200;

    // Start
    this.start = Object.assign({ x: 80, y: 220, r: 26 }, levelJson.start ?? {});

    // Platforms
    this.platforms = (levelJson.platforms ?? []).map(
      (p) => new Platform(p.x, p.y, p.w, p.h),
    );
  }

  drawWorld(camY = 0) {
    // Ocean gradient (top -> bottom)
    this.drawOceanGradient(camY);

    // (No platforms in underwater level, but keep this safe if you reuse it)
    push();
    rectMode(CORNER);
    noStroke();
    fill(this.theme.platform);
    for (const p of this.platforms) rect(p.x, p.y, p.w, p.h);
    pop();
  }

  drawOceanGradient(camY) {
    // Subtle moving gradient based on camera Y so it feels like you're descending
    const topCol = color(this.theme.bgTop);
    const bottomCol = color(this.theme.bgBottom);

    noStroke();
    for (let y = 0; y < height; y++) {
      const t = y / height;
      // tiny shift based on camY for motion (very subtle)
      const wobble = 0.03 * sin((camY + y) * 0.01);
      const tt = constrain(t + wobble, 0, 1);
      fill(lerpColor(topCol, bottomCol, tt));
      rect(0, camY + y, this.w, 1);
    }
  }
}
