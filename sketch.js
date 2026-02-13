/*
Week 5 — Example 5: Side-Scroller Platformer with JSON Levels + Modular Camera

Course: GBDA302 | Instructors: Dr. Karen Cochrane & David Han
Date: Feb. 12, 2026

Move: WASD/Arrows | Jump: Space

Learning goals:
- Build a side-scrolling platformer using modular game systems
- Load complete level definitions from external JSON (LevelLoader + levels.json)
- Separate responsibilities across classes (Player, Platform, Camera, World)
- Implement gravity, jumping, and collision with platforms
- Use a dedicated Camera2D class for smooth horizontal tracking
- Support multiple levels and easy tuning through data files
- Explore scalable project architecture for larger games
*/

const VIEW_W = 800;
const VIEW_H = 480;

let allLevelsData;
let levelIndex = 0;

let level;
let player;
let cam;

let bubbles = [];
let lives = 3;
let gameState = "start";
let diverImg = null; // declare ONCE

let stars = [];
const MAX_LIVES = 3;

function preload() {
  allLevelsData = loadJSON("levels.json");

  // load diver image safely here
  diverImg = loadImage("diver.png");
}

function setup() {
  createCanvas(VIEW_W, VIEW_H);
  textFont("sans-serif");
  textSize(14);

  cam = new Camera2D(width, height);

  gameState = "start";
}

function loadLevel(i) {
  level = LevelLoader.fromLevelsJson(allLevelsData, i);

  player = new BlobPlayer();
  player.spawnFromLevel(level);

  cam.x = player.x - width / 2;
  cam.y = max(0, player.y - height / 2);
  cam.clampToWorld(level.w, level.h);

  lives = MAX_LIVES;
  bubbles = [];
  stars = [];

  spawnBubbles(45);

  gameState = "play";
}

function spawnBubbles(count) {
  for (let i = 0; i < count; i++) {
    bubbles.push(makeBubbleInRange());
  }
}

function makeBubbleInRange() {
  // Spawn bubbles somewhere within/around the current camera view,
  // with a little buffer so they drift in naturally.
  const x = random(40, level.w - 40);
  const y = random(cam.y - 300, cam.y + height + 800);
  const r = random(8, 18);
  const vy = random(0.4, 1.2);
  return new Bubble(x, y, r, vy);
}

function draw() {
  // --- view state: calm downward auto-scroll ---

  if (gameState === "start") {
    drawStartScreen();
    return;
  }

  if (gameState === "gameover") {
    drawGameOverScreen();
    return;
  }

  console.log(
    "cam.y",
    cam.y,
    "level.scrollY",
    level.scrollY,
    "diverImg",
    diverImg,
  );

  const dy = level.scrollY * (deltaTime / 16.666); // normalize to 60fps
  cam.autoScrollDown(dy, 1.0); // 1.0 = no easing lag (more continuous)
  cam.clampToWorld(level.w, level.h);

  // --- diver behavior ---
  // Keep diver centered vertically so the camera is the “experience”
  // and the player only steers left/right.
  player.y = cam.y + height / 2 + sin(frameCount * 0.02) * 6;
  player.vy = 0; // prevent any leftover vertical velocity
  player.update(level); // uses your existing left/right input system
  player.x = constrain(player.x, cam.x + player.r, cam.x + width - player.r);

  // --- bubbles update + recycle ---
  for (const b of bubbles) {
    if (!b.alive) continue;
    b.update();

    // If bubble goes far above the camera, recycle it near the bottom
    if (b.y < cam.y - 200) {
      b.x = random(40, level.w - 40);
      b.y = cam.y + height + random(400, 1200);
      b.r = random(8, 18);
      b.vy = random(0.4, 1.2);
      b.alive = true;
    }
  }

  // --- collision: diver touches bubble => lose life, bubble disappears ---
  if (lives > 0) {
    for (const b of bubbles) {
      if (!b.alive) continue;

      if (b.hitsCircle(player.x, player.y, player.r)) {
        b.alive = false;
        lives -= 1;
        break; // only lose one life per frame
      }
    }
  }

  for (const s of stars) {
    if (!s.alive) continue;

    if (s.hitsCircle(player.x, player.y, player.r)) {
      s.alive = false;
      lives = min(MAX_LIVES, lives + 1);
      break; // only collect one per frame
    }
  }

  maybeSpawnStar();

  for (const s of stars) {
    if (!s.alive) continue;

    s.update();

    // If star is far above the camera, retire it (keeps array clean-ish)
    if (s.y < cam.y - 400) {
      s.alive = false;
    }
  }

  // --- draw world ---
  cam.begin();
  level.drawWorld(cam.y);

  // draw bubbles
  for (const b of bubbles) {
    if (b.alive) b.draw();
  }

  // draw stars (behind diver, above background)
  for (const s of stars) {
    if (s.alive) s.draw();
  }

  // draw diver (image if available, otherwise simple shape)
  drawDiver();

  cam.end();

  // --- HUD ---
  // --- game over pause ---
  drawHUD();
  if (lives <= 0) {
    gameState = "gameover";
    return;
  }
}
function drawDiver() {
  push();
  translate(player.x, player.y);

  if (diverImg) {
    imageMode(CENTER);
    image(diverImg, 0, 0, 200, 200);
  } else {
    // simple “diver” placeholder (calm + readable)
    noStroke();
    fill(230, 245, 255);
    ellipse(0, 0, 44, 28); // body
    ellipse(16, -6, 16, 16); // helmet
    fill(180, 220, 255, 180);
    ellipse(20, -6, 10, 10); // visor
    fill(230, 245, 255);
    triangle(-22, 0, -38, -8, -38, 8); // fins
  }

  pop();
}

function drawHUD() {
  push();

  // Background panel
  const pad = 14;
  const boxW = 200;
  const boxH = 74;

  noStroke();
  fill(0, 120); // translucent dark
  rect(pad - 6, pad - 6, boxW, boxH, 10);

  // Text
  fill(255);
  textAlign(LEFT, TOP);

  textSize(22);
  text(`Lives: ${lives}`, pad, pad);

  textSize(18);
  text(`Depth: ${nf(cam.y, 1, 0)}`, pad, pad + 32);

  pop();
}

function keyPressed() {
  // START
  if (gameState === "start" && key === " ") {
    loop();
    loadLevel(levelIndex);
    return;
  }

  // RESTART
  if (gameState === "gameover" && (key === "r" || key === "R")) {
    loop();
    loadLevel(levelIndex);
    return;
  }

  // allow restart anytime if you want:
  if (key === "r" || key === "R") {
    loop();
    loadLevel(levelIndex);
  }
}

function drawStartScreen() {
  background(10, 80, 150);

  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);

  textSize(38);
  text("Underwater Descent", width / 2, height / 2 - 70);

  textSize(18);

  text("Avoid the bubbles", width / 2, height / 2 - 30);
  text("Collect stars to regain air", width / 2, height / 2 - 5);
  text("Move: A/D or ←/→", width / 2, height / 2 + 25);
  text("Press SPACE to start", width / 2, height / 2 + 65);

  textAlign(LEFT, BASELINE);
}
function drawGameOverScreen() {
  background(0, 40, 90); // clears screen so it won’t stack

  fill(255);
  textAlign(CENTER, CENTER);

  textSize(34);
  text("Out of air…", width / 2, height / 2 - 30);

  textSize(16);
  text("Press R to restart", width / 2, height / 2 + 20);

  textAlign(LEFT, BASELINE);
}

function maybeSpawnStar() {
  // Occasional, not too frequent
  // Spawn only if we have room and a small random chance hits
  const activeStars = stars.filter((s) => s.alive).length;
  if (activeStars >= 6) return; // cap how many are visible
  if (random() > 0.008) return; // ~0.8% chance per frame (~1 every ~2 sec at 60fps)

  stars.push(makeStarInRange());
}

function makeStarInRange() {
  // Spawn slightly ahead/below camera so it feels "discovered"
  const x = random(60, level.w - 60);
  const y = cam.y + height + random(200, 1400);
  const r = random(8, 14);
  return new Star(x, y, r);
}
