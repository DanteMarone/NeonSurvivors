// Neon Survivor - A Vampire Survivors style game with futuristic theme
// All assets created programmatically with P5.js

let player;
let enemies = [];
let projectiles = [];
let particles = [];
let pickups = [];
let gameTime = 0;
let score = 0;
let level = 1;
let experience = 0;
let experienceToNextLevel = 100;
let gameState = 'playing'; // 'playing', 'upgrade', 'gameover'
let upgradeOptions = [];
let availableUpgrades = [
  { name: 'Speed', description: 'Increase movement speed', maxLevel: 5 },
  { name: 'Damage', description: 'Increase projectile damage', maxLevel: 5 },
  { name: 'Fire Rate', description: 'Increase firing speed', maxLevel: 5 },
  { name: 'Projectile Size', description: 'Increase projectile size', maxLevel: 5 },
  { name: 'Projectile Speed', description: 'Increase projectile velocity', maxLevel: 5 },
  { name: 'Health', description: 'Increase max health', maxLevel: 5 },
  { name: 'Multishot', description: 'Fire additional projectiles', maxLevel: 3 }
];
let weaponTypes = ['laser', 'plasma', 'wave'];
let currentWeapon = 'laser';
let gameFont;
let starfield = [];
let screenShake = 0;
let kills = 0;

// Color palette
const COLORS = {
  background: '#0a0a1a',
  player: '#00ccff',
  playerShadow: '#0066ff',
  enemy1: '#ff0066',
  enemy2: '#cc00ff',
  enemy3: '#ff9900',
  projectileLaser: '#00ffcc',
  projectilePlasma: '#ffcc00',
  projectileWave: '#cc66ff',
  experience: '#00ff99',
  health: '#ff3366',
  text: '#ffffff',
  uiBackground: 'rgba(0, 20, 40, 0.8)',
  uiHighlight: '#00aaff'
};

function preload() {
  // We're creating all assets programmatically, so no external files to load
}

function setup() {
  createCanvas(800, 600);
  strokeJoin(ROUND);
  strokeCap(ROUND);
  
  // Convert color strings in COLORS to p5.Color objects
  for (let key in COLORS) {
    COLORS[key] = color(COLORS[key]);
  }
  
  // Setup starfield
  for (let i = 0; i < 100; i++) {
    starfield.push({
      x: random(width),
      y: random(height),
      size: random(1, 3),
      speed: random(0.2, 1),
      brightness: random(100, 255)
    });
  }
  
  // Initialize player
  player = {
    x: width / 2,
    y: height / 2,
    size: 24,
    speed: 3,
    health: 100,
    maxHealth: 100,
    damage: 20,
    fireRate: 300, // milliseconds between shots
    lastFired: 0,
    projectileSize: 1,
    projectileSpeed: 5,
    multishot: 1,
    upgradeCount: 0,
    invulnerable: 0, // invulnerability timer
    angle: 0, // facing angle
    weapon: currentWeapon
  };
  
  // Start the game
  gameState = 'playing';
}


function draw() {
  background(COLORS.background);
  
  if (gameState === 'playing') {
    updateGame();
    drawGame();
  } else if (gameState === 'upgrade') {
    drawGame(); // Draw the game behind the upgrade screen
    drawUpgradeScreen();
  } else if (gameState === 'gameover') {
    drawGame();
    drawGameOverScreen();
  }
  
  // Apply screen shake
  if (screenShake > 0) {
    translate(random(-screenShake, screenShake), random(-screenShake, screenShake));
    screenShake *= 0.9;
    if (screenShake < 0.5) screenShake = 0;
  }
}

function updateGame() {
  // Update game time (seconds)
  gameTime += 1/60;
  
  // Update player
  updatePlayer();
  
  // Update projectiles
  updateProjectiles();
  
  // Update enemies
  updateEnemies();
  
  // Update particles
  updateParticles();
  
  // Update pickups
  updatePickups();
  
  // Spawn enemies
  if (frameCount % Math.max(30, 120 - level * 5) === 0) {
    spawnEnemy();
  }
  
  // Check for level up
  if (experience >= experienceToNextLevel) {
    levelUp();
  }
}

function updatePlayer() {
  // Handle player movement
  let dx = 0;
  let dy = 0;
  
  if (keyIsDown(87) || keyIsDown(UP_ARROW)) dy -= 1; // W or Up arrow
  if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) dy += 1; // S or Down arrow
  if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) dx -= 1; // A or Left arrow
  if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) dx += 1; // D or Right arrow
  
  // Normalize diagonal movement
  if (dx !== 0 && dy !== 0) {
    dx *= 0.7071; // 1/sqrt(2)
    dy *= 0.7071;
  }
  
  player.x += dx * player.speed;
  player.y += dy * player.speed;
  
  // Keep player in bounds
  player.x = constrain(player.x, player.size, width - player.size);
  player.y = constrain(player.y, player.size, height - player.size);
  
  // Update player angle to face mouse
  if (mouseX !== 0 && mouseY !== 0) {
    player.angle = atan2(mouseY - player.y, mouseX - player.x);
  }
  
  // Auto fire
  if (millis() - player.lastFired > player.fireRate) {
    fireProjectile();
    player.lastFired = millis();
  }
  
  // Decrease invulnerability timer
  if (player.invulnerable > 0) {
    player.invulnerable--;
  }
}

function fireProjectile() {
  let baseAngle = atan2(mouseY - player.y, mouseX - player.x);
  
  // Calculate spread based on multishot
  let angleSpread = 0;
  if (player.multishot > 1) {
    angleSpread = PI / 8;
  }
  
  for (let i = 0; i < player.multishot; i++) {
    let angle = baseAngle;
    
    // If we have multiple shots, adjust the angle
    if (player.multishot > 1) {
      angle = baseAngle - angleSpread/2 + (angleSpread * i / (player.multishot - 1));
    }
    
    projectiles.push({
      x: player.x,
      y: player.y,
      speed: player.projectileSpeed,
      vx: cos(angle) * player.projectileSpeed,
      vy: sin(angle) * player.projectileSpeed,
      size: 6 * player.projectileSize,
      damage: player.damage,
      type: player.weapon,
      lifetime: 180, // frames
      angle: angle
    });
    
    // Add muzzle flash particle
    let flashColor;
    switch (player.weapon) {
      case 'laser': flashColor = COLORS.projectileLaser; break;
      case 'plasma': flashColor = COLORS.projectilePlasma; break;
      case 'wave': flashColor = COLORS.projectileWave; break;
    }
    
    for (let j = 0; j < 3; j++) {
      particles.push({
        x: player.x + cos(angle) * player.size,
        y: player.y + sin(angle) * player.size,
        vx: cos(angle) * random(1, 3) + random(-1, 1),
        vy: sin(angle) * random(1, 3) + random(-1, 1),
        size: random(2, 5),
        lifetime: random(10, 20),
        color: flashColor,
        alpha: 255
      });
    }
  }
}

function updateProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    let p = projectiles[i];
    
    // Move projectile
    p.x += p.vx;
    p.y += p.vy;
    
    // Create trail particles
    if (frameCount % 2 === 0) {
      let trailColor;
      switch (p.type) {
        case 'laser': trailColor = COLORS.projectileLaser; break;
        case 'plasma': trailColor = COLORS.projectilePlasma; break;
        case 'wave': trailColor = COLORS.projectileWave; break;
      }
      
      particles.push({
        x: p.x,
        y: p.y,
        vx: random(-0.5, 0.5),
        vy: random(-0.5, 0.5),
        size: random(1, 3) * player.projectileSize,
        lifetime: random(10, 20),
        color: trailColor,
        alpha: 150
      });
    }
    
    // Check for collision with enemies
    for (let j = enemies.length - 1; j >= 0; j--) {
      let e = enemies[j];
      let distance = dist(p.x, p.y, e.x, e.y);
      
      if (distance < p.size + e.size) {
        // Hit enemy
        e.health -= p.damage;
        
        // Create hit particles
        for (let k = 0; k < 8; k++) {
          let angle = random(TWO_PI);
          particles.push({
            x: p.x,
            y: p.y,
            vx: cos(angle) * random(1, 3),
            vy: sin(angle) * random(1, 3),
            size: random(2, 4),
            lifetime: random(10, 20),
            color: e.color,
            alpha: 255
          });
        }
        
        // Remove projectile
        projectiles.splice(i, 1);
        
        // Check if enemy is dead
        if (e.health <= 0) {
          killEnemy(j);
        }
        
        break;
      }
    }
    
    // Remove projectile if out of bounds or expired
    if (p.x < 0 || p.x > width || p.y < 0 || p.y > height || --p.lifetime <= 0) {
      projectiles.splice(i, 1);
    }
  }
}

function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    
    // Move enemy toward player
    let angle = atan2(player.y - e.y, player.x - e.x);
    e.x += cos(angle) * e.speed;
    e.y += sin(angle) * e.speed;
    e.angle = angle;
    
    // Check for collision with player
    if (player.invulnerable <= 0) {
      let distance = dist(e.x, e.y, player.x, player.y);
      if (distance < e.size + player.size * 0.8) {
        // Player takes damage
        player.health -= e.damage;
        player.invulnerable = 30; // Half a second of invulnerability
        
        // Screen shake
        screenShake = 10;
        
        // Create hit particles
        for (let j = 0; j < 15; j++) {
          let angle = random(TWO_PI);
          particles.push({
            x: player.x,
            y: player.y,
            vx: cos(angle) * random(2, 5),
            vy: sin(angle) * random(2, 5),
            size: random(3, 6),
            lifetime: random(15, 30),
            color: COLORS.player,
            alpha: 255
          });
        }
        
        // Check if player is dead
        if (player.health <= 0) {
          gameOver();
          return;
        }
      }
    }
    
    // Leave trail
    if (frameCount % 10 === 0) {
      particles.push({
        x: e.x,
        y: e.y,
        vx: random(-0.5, 0.5),
        vy: random(-0.5, 0.5),
        size: random(2, 4),
        lifetime: random(10, 20),
        color: e.color,
        alpha: 100
      });
    }
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    
    // Move particle
    p.x += p.vx;
    p.y += p.vy;
    
    // Fade particle
    p.alpha = p.alpha * (p.lifetime / (p.lifetime + 1));
    
    // Remove particle if expired
    if (--p.lifetime <= 0) {
      particles.splice(i, 1);
    }
  }
}

function updatePickups() {
  for (let i = pickups.length - 1; i >= 0; i--) {
    let p = pickups[i];
    
    // Move pickup toward player if close enough
    let distance = dist(p.x, p.y, player.x, player.y);
    if (distance < 150) {
      let angle = atan2(player.y - p.y, player.x - p.x);
      let magnetSpeed = map(distance, 0, 150, 8, 2);
      p.x += cos(angle) * magnetSpeed;
      p.y += sin(angle) * magnetSpeed;
    }
    
    // Check for collision with player
    if (distance < player.size + p.size) {
      // Collect pickup
      if (p.type === 'experience') {
        experience += p.value;
        
        // Create collection particles
        for (let j = 0; j < 8; j++) {
          let angle = random(TWO_PI);
          particles.push({
            x: p.x,
            y: p.y,
            vx: cos(angle) * random(1, 3),
            vy: sin(angle) * random(1, 3),
            size: random(2, 4),
            lifetime: random(15, 30),
            color: COLORS.experience,
            alpha: 200
          });
        }
      } else if (p.type === 'health') {
        player.health = min(player.maxHealth, player.health + p.value);
        
        // Create collection particles
        for (let j = 0; j < 8; j++) {
          let angle = random(TWO_PI);
          particles.push({
            x: p.x,
            y: p.y,
            vx: cos(angle) * random(1, 3),
            vy: sin(angle) * random(1, 3),
            size: random(2, 4),
            lifetime: random(15, 30),
            color: COLORS.health,
            alpha: 200
          });
        }
      }
      
      // Remove pickup
      pickups.splice(i, 1);
    }
    
    // Make pickup float
    p.y += sin(frameCount * 0.1 + p.x) * 0.3;
    
    // Create floating particles
    if (frameCount % 10 === 0) {
      particles.push({
        x: p.x + random(-p.size/2, p.size/2),
        y: p.y + random(-p.size/2, p.size/2),
        vx: random(-0.5, 0.5),
        vy: random(-1, -0.5),
        size: random(1, 3),
        lifetime: random(10, 20),
        color: p.type === 'experience' ? COLORS.experience : COLORS.health,
        alpha: 150
      });
    }
  }
}

function spawnEnemy() {
  // Determine spawn position outside the screen
  let spawnX, spawnY;
  let edge = floor(random(4));
  
  switch (edge) {
    case 0: // Top
      spawnX = random(width);
      spawnY = -20;
      break;
    case 1: // Right
      spawnX = width + 20;
      spawnY = random(height);
      break;
    case 2: // Bottom
      spawnX = random(width);
      spawnY = height + 20;
      break;
    case 3: // Left
      spawnX = -20;
      spawnY = random(height);
      break;
  }
  
  // Determine enemy type based on game time and randomness
  let enemyType = 'basic';
  let enemySize = random(15, 25);
  let enemyHealth = 30 + level * 5;
  let enemySpeed = random(0.8, 1.5);
  let enemyColor = COLORS.enemy1;
  let enemyDamage = 10;
  
  if (gameTime > 60 && random() < 0.3) { // After 1 minute, 30% chance of fast enemy
    enemyType = 'fast';
    enemySize = random(10, 18);
    enemyHealth = 20 + level * 3;
    enemySpeed = random(2.0, 2.8);
    enemyColor = COLORS.enemy2;
    enemyDamage = 5;
  }
  
  if (gameTime > 120 && random() < 0.2) { // After 2 minutes, 20% chance of tank enemy
    enemyType = 'tank';
    enemySize = random(30, 40);
    enemyHealth = 80 + level * 10;
    enemySpeed = random(0.5, 0.8);
    enemyColor = COLORS.enemy3;
    enemyDamage = 20;
  }
  
  // Create the enemy
  enemies.push({
    x: spawnX,
    y: spawnY,
    size: enemySize,
    health: enemyHealth,
    maxHealth: enemyHealth,
    speed: enemySpeed * (1 + level * 0.05),
    type: enemyType,
    color: enemyColor,
    damage: enemyDamage,
    angle: 0,
    pulseTime: random(TWO_PI)
  });
}

function killEnemy(index) {
  let e = enemies[index];
  
  // Create death explosion
  for (let i = 0; i < 20; i++) {
    let angle = random(TWO_PI);
    let speed = random(1, 4);
    particles.push({
      x: e.x,
      y: e.y,
      vx: cos(angle) * speed,
      vy: sin(angle) * speed,
      size: random(3, 6),
      lifetime: random(20, 40),
      color: e.color,
      alpha: 255
    });
  }
  
  // Drop experience
  let expValue = 5;
  if (e.type === 'fast') expValue = 8;
  if (e.type === 'tank') expValue = 15;
  
  // 100% chance to drop experience
  pickups.push({
    x: e.x,
    y: e.y,
    size: 10,
    type: 'experience',
    value: expValue
  });
  
  // 10% chance to drop health
  if (random() < 0.1) {
    pickups.push({
      x: e.x + random(-10, 10),
      y: e.y + random(-10, 10),
      size: 10,
      type: 'health',
      value: 15
    });
  }
  
  // Increase score
  score += expValue;
  kills++;
  
  // Remove enemy
  enemies.splice(index, 1);
}

function levelUp() {
  // Increase level
  level++;
  
  // Update experience required for next level
  experience = experience - experienceToNextLevel;
  experienceToNextLevel = 100 + level * 50;
  
  // Generate upgrade options
  generateUpgradeOptions();
  
  // Enter upgrade state
  gameState = 'upgrade';
}

function generateUpgradeOptions() {
  upgradeOptions = [];
  
  // Get available upgrades (not at max level)
  let available = availableUpgrades.filter(upgrade => {
    if (upgrade.name === 'Speed' && player.speed >= 5) return false;
    if (upgrade.name === 'Damage' && player.damage >= 100) return false;
    if (upgrade.name === 'Fire Rate' && player.fireRate <= 100) return false;
    if (upgrade.name === 'Projectile Size' && player.projectileSize >= 3) return false;
    if (upgrade.name === 'Projectile Speed' && player.projectileSpeed >= 12) return false;
    if (upgrade.name === 'Health' && player.maxHealth >= 300) return false;
    if (upgrade.name === 'Multishot' && player.multishot >= 5) return false;
    return true;
  });
  
  // Add weapon change option if not all weapons discovered
  if (player.upgradeCount >= 3 && weaponTypes.some(type => type !== player.weapon)) {
    let availableWeapons = weaponTypes.filter(type => type !== player.weapon);
    let newWeapon = random(availableWeapons);
    
    upgradeOptions.push({
      name: 'Change Weapon',
      description: `Change to ${newWeapon} weapon`,
      effect: () => {
        player.weapon = newWeapon;
        currentWeapon = newWeapon;
      }
    });
  }
  
  // Add 3 random upgrades
  while (upgradeOptions.length < 3 && available.length > 0) {
    let index = floor(random(available.length));
    let upgrade = available[index];
    
    // Create the upgrade option
    switch (upgrade.name) {
      case 'Speed':
        upgradeOptions.push({
          name: 'Speed Up',
          description: 'Movement speed +15%',
          effect: () => { player.speed *= 1.15; }
        });
        break;
      case 'Damage':
        upgradeOptions.push({
          name: 'Power Up',
          description: 'Projectile damage +20%',
          effect: () => { player.damage *= 1.2; }
        });
        break;
      case 'Fire Rate':
        upgradeOptions.push({
          name: 'Rapid Fire',
          description: 'Fire rate +15%',
          effect: () => { player.fireRate = max(100, player.fireRate * 0.85); }
        });
        break;
      case 'Projectile Size':
        upgradeOptions.push({
          name: 'Big Shot',
          description: 'Projectile size +25%',
          effect: () => { player.projectileSize *= 1.25; }
        });
        break;
      case 'Projectile Speed':
        upgradeOptions.push({
          name: 'Velocity',
          description: 'Projectile speed +20%',
          effect: () => { player.projectileSpeed *= 1.2; }
        });
        break;
      case 'Health':
        upgradeOptions.push({
          name: 'Vitality',
          description: 'Max health +20%',
          effect: () => { 
            player.maxHealth *= 1.2; 
            player.health += player.maxHealth * 0.2;
          }
        });
        break;
      case 'Multishot':
        upgradeOptions.push({
          name: 'Multishot',
          description: player.multishot === 1 ? 'Fire 2 projectiles at once' : 'Add +1 projectile',
          effect: () => { player.multishot += 1; }
        });
        break;
    }
    
    // Remove from available pool
    available.splice(index, 1);
  }
}

function selectUpgrade(index) {
  if (index >= 0 && index < upgradeOptions.length) {
    // Apply the upgrade effect
    upgradeOptions[index].effect();
    
    // Increment upgrade count
    player.upgradeCount++;
    
    // Return to playing
    gameState = 'playing';
  }
}

function gameOver() {
  gameState = 'gameover';
}

function mouseClicked() {
  if (gameState === 'upgrade') {
    // Check if clicked on an upgrade option
    let boxWidth = 200;
    let boxHeight = 100;
    let boxSpacing = 50;
    let totalWidth = upgradeOptions.length * boxWidth + (upgradeOptions.length - 1) * boxSpacing;
    let startX = (width - totalWidth) / 2;
    
    for (let i = 0; i < upgradeOptions.length; i++) {
      let x = startX + i * (boxWidth + boxSpacing);
      let y = height / 2 - boxHeight / 2;
      
      if (mouseX >= x && mouseX <= x + boxWidth && mouseY >= y && mouseY <= y + boxHeight) {
        selectUpgrade(i);
        break;
      }
    }
  } else if (gameState === 'gameover') {
    // Restart game
    setup();
  }
}

function keyPressed() {
  // Number keys 1-3 to select upgrade
  if (gameState === 'upgrade' && keyCode >= 49 && keyCode <= 51) {
    let index = keyCode - 49;
    if (index < upgradeOptions.length) {
      selectUpgrade(index);
    }
  }
  
  // Space to restart game
  if (gameState === 'gameover' && keyCode === 32) {
    setup();
  }
}

function drawGame() {
  // Draw starfield
  drawStarfield();
  
  // Draw pickups
  drawPickups();
  
  // Draw particles
  drawParticles();
  
  // Draw enemies
  drawEnemies();
  
  // Draw projectiles
  drawProjectiles();
  
  // Draw player
  drawPlayer();
  
  // Draw UI
  drawUI();
}

function drawStarfield() {
  // Draw stars
  for (let star of starfield) {
    fill(star.brightness);
    noStroke();
    ellipse(star.x, star.y, star.size, star.size);
    
    // Move stars slowly
    star.y += star.speed;
    
    // Wrap stars
    if (star.y > height) {
      star.y = 0;
      star.x = random(width);
    }
  }
}

function drawPlayer() {
  push();
  translate(player.x, player.y);
  rotate(player.angle);
  
  // Draw player shadow/glow
  fill(COLORS.playerShadow);
  noStroke();
  
  // Pulse effect for shield when invulnerable
  if (player.invulnerable > 0) {
    let pulseSize = 1.2 + sin(frameCount * 0.2) * 0.1;
    ellipse(0, 0, player.size * 2 * pulseSize, player.size * 2 * pulseSize);
  }
  
  // Draw ship base
  fill(COLORS.player);
  beginShape();
  vertex(player.size, 0);
  vertex(-player.size/2, player.size/2);
  vertex(-player.size/4, 0);
  vertex(-player.size/2, -player.size/2);
  endShape(CLOSE);
  
  // Draw cockpit
  fill(COLORS.background);
  ellipse(player.size/4, 0, player.size/2, player.size/3);
  
  // Draw engine glow
  fill(COLORS.projectileLaser);
  ellipse(-player.size/3, 0, player.size/3, player.size/6);
  
  pop();
}

function drawProjectiles() {
  for (let p of projectiles) {
    push();
    translate(p.x, p.y);
    rotate(p.angle);
    
    // Different projectile types
    if (p.type === 'laser') {
      // Laser beam
      stroke(COLORS.projectileLaser);
      strokeWeight(p.size);
      line(0, 0, -p.size * 3, 0);
      
      // Laser tip
      noStroke();
      fill(COLORS.projectileLaser);
      ellipse(0, 0, p.size * 1.5, p.size);
    } else if (p.type === 'plasma') {
      // Plasma ball
      noStroke();
      for (let i = 3; i > 0; i--) {
        let alpha = 255 - (i * 40);
        fill(COLORS.projectilePlasma, alpha);
        ellipse(0, 0, p.size * (1 + i * 0.3), p.size * (1 + i * 0.3));
      }
      fill(255);
      ellipse(0, 0, p.size * 0.5, p.size * 0.5);
    } else if (p.type === 'wave') {
      // Wave projectile
      noFill();
      for (let i = 3; i > 0; i--) {
        let weight = p.size * 0.3 * (4 - i) / 3;
        let alpha = 255 - (i * 40);
        stroke(COLORS.projectileWave, alpha);
        strokeWeight(weight);
        arc(0, 0, p.size * i, p.size * i * 2, -QUARTER_PI, QUARTER_PI);
        arc(0, 0, p.size * i, p.size * i * 2, HALF_PI + QUARTER_PI, PI + QUARTER_PI);
      }
    }
    
    pop();
  }
}

function drawEnemies() {
  for (let e of enemies) {
    push();
    translate(e.x, e.y);
    rotate(e.angle);
    
    // Draw health bar
    let healthPercent = e.health / e.maxHealth;
    
    if (healthPercent < 1) {
      push();
      translate(0, -e.size - 10);
      noStroke();
      fill(100, 100, 100, 150);
      rect(-e.size, -2, e.size * 2, 4);
      fill(255, 0, 50, 200);
      rect(-e.size, -2, e.size * 2 * healthPercent, 4);
      pop();
    }
    
    // Different enemy types
    if (e.type === 'basic') {
      // Basic enemy - triangle shape
      noStroke();
      // Pulsing glow
      e.pulseTime += 0.05;
      let pulse = 1 + sin(e.pulseTime) * 0.1;
      
      fill(e.color, 50);
      ellipse(0, 0, e.size * 2.5 * pulse, e.size * 2.5 * pulse);
      
      fill(e.color);
      beginShape();
      vertex(e.size, 0);
      vertex(-e.size, e.size);
      vertex(-e.size/2, 0);
      vertex(-e.size, -e.size);
      endShape(CLOSE);
      
      // Eye
      fill(255);
      ellipse(e.size / 2, 0, e.size / 2, e.size / 2);
      fill(0);
      ellipse(e.size / 2, 0, e.size / 4, e.size / 4);
      
    } else if (e.type === 'fast') {
      // Fast enemy - sleek shape
      noStroke();
      
      // Trail effect
      fill(e.color, 50);
      ellipse(-e.size, 0, e.size * 3, e.size);
      
      // Body
      fill(e.color);
      beginShape();
      vertex(e.size, 0);
      vertex(-e.size, e.size / 2);
      vertex(-e.size, -e.size / 2);
      endShape(CLOSE);
      
      // Detail
      stroke(255, 200);
      strokeWeight(1);
      line(-e.size / 2, -e.size / 4, e.size / 2, -e.size / 4);
      line(-e.size / 2, e.size / 4, e.size / 2, e.size / 4);
      
    } else if (e.type === 'tank') {
      // Tank enemy - bulky shape
      // Pulsing shield
      e.pulseTime += 0.03;
      let pulse = 1 + sin(e.pulseTime) * 0.1;
      
      noStroke();
      fill(e.color, 40);
      ellipse(0, 0, e.size * 2.2 * pulse, e.size * 2.2 * pulse);
      
      // Body
      fill(e.color);
      ellipse(0, 0, e.size * 1.8, e.size * 1.8);
      
      // Armor plates
      fill(COLORS.background);
      arc(0, 0, e.size * 1.4, e.size * 1.4, PI / 6, PI - PI / 6, PIE);
      arc(0, 0, e.size * 1.4, e.size * 1.4, PI + PI / 6, TWO_PI - PI / 6, PIE);
      
      // Core
      fill(255);
      ellipse(0, 0, e.size * 0.6, e.size * 0.6);
      
      // Energy pulse
      fill(e.color);
      ellipse(0, 0, e.size * 0.4 * pulse, e.size * 0.4 * pulse);
    }
    
    pop();
  }
}

function drawParticles() {
  for (let p of particles) {
    noStroke();
    fill(p.color, p.alpha);
    ellipse(p.x, p.y, p.size, p.size);
  }
}

function drawPickups() {
  for (let p of pickups) {
    push();
    translate(p.x, p.y);
    
    // Float animation
    let floatY = sin(frameCount * 0.1 + p.x) * 3;
    translate(0, floatY);
    
    // Rotating animation
    rotate(frameCount * 0.02);
    
    if (p.type === 'experience') {
      // Experience gem
      noStroke();
      
      // Glow
      fill(COLORS.experience, 100);
      beginShape();
      for (let i = 0; i < 5; i++) {
        let angle = TWO_PI * i / 5 - HALF_PI;
        let r = p.size * 2;
        let x = cos(angle) * r;
        let y = sin(angle) * r;
        vertex(x, y);
        
        angle += TWO_PI / 10;
        r = p.size;
        x = cos(angle) * r;
        y = sin(angle) * r;
        vertex(x, y);
      }
      endShape(CLOSE);
      
      // Crystal
      fill(COLORS.experience);
      beginShape();
      for (let i = 0; i < 5; i++) {
        let angle = TWO_PI * i / 5 - HALF_PI;
        let r = p.size * 1.5;
        let x = cos(angle) * r;
        let y = sin(angle) * r;
        vertex(x, y);
        
        angle += TWO_PI / 10;
        r = p.size * 0.7;
        x = cos(angle) * r;
        y = sin(angle) * r;
        vertex(x, y);
      }
      endShape(CLOSE);
      
      // Highlight
      fill(255, 150);
      beginShape();
      for (let i = 0; i < 3; i++) {
        let angle = TWO_PI * i / 3;
        let r = p.size * 0.3;
        let x = cos(angle) * r;
        let y = sin(angle) * r;
        vertex(x, y);
      }
      endShape(CLOSE);
      
    } else if (p.type === 'health') {
      // Health pickup
      // Glow
      noStroke();
      fill(COLORS.health, 100);
      ellipse(0, 0, p.size * 2.5, p.size * 2.5);
      
      // Cross
      fill(COLORS.health);
      rectMode(CENTER);
      rect(0, 0, p.size * 1.8, p.size * 0.7);
      rect(0, 0, p.size * 0.7, p.size * 1.8);
      
      // Highlight
      fill(255, 150);
      ellipse(-p.size * 0.3, -p.size * 0.3, p.size * 0.4, p.size * 0.4);
    }
    
    pop();
  }
}

function drawUI() {
  // Experience bar
  let expBarWidth = width - 40;
  let expBarHeight = 10;
  let expBarX = 20;
  let expBarY = height - 20;
  
  noStroke();
  fill(COLORS.uiBackground);
  rect(expBarX, expBarY, expBarWidth, expBarHeight, expBarHeight / 2);
  
  let expPercent = experience / experienceToNextLevel;
  fill(COLORS.experience);
  rect(expBarX, expBarY, expBarWidth * expPercent, expBarHeight, expBarHeight / 2);
  
  // Level indicator
  textAlign(LEFT, BOTTOM);
  fill(COLORS.text);
  textSize(18);
  text(`Level ${level}`, expBarX, expBarY - 5);
  
  // Experience text
  textAlign(RIGHT, BOTTOM);
  text(`${experience}/${experienceToNextLevel} XP`, expBarX + expBarWidth, expBarY - 5);
  
  // Health bar
  let healthBarWidth = 200;
  let healthBarHeight = 20;
  let healthBarX = 20;
  let healthBarY = 20;
  
  noStroke();
  fill(COLORS.uiBackground);
  rect(healthBarX, healthBarY, healthBarWidth, healthBarHeight, healthBarHeight / 2);
  
  let healthPercent = player.health / player.maxHealth;
  fill(COLORS.health);
  rect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight, healthBarHeight / 2);
  
  // Health text
  textAlign(CENTER, CENTER);
  fill(COLORS.text);
  textSize(14);
  text(`${ceil(player.health)}/${ceil(player.maxHealth)}`, healthBarX + healthBarWidth / 2, healthBarY + healthBarHeight / 2);
  
  // Score and time
  textAlign(RIGHT, TOP);
  fill(COLORS.text);
  textSize(18);
  text(`Score: ${score}`, width - 20, 20);
  text(`Time: ${formatTime(gameTime)}`, width - 20, 45);
  text(`Kills: ${kills}`, width - 20, 70);
  
  // Weapon indicator
  textAlign(LEFT, TOP);
  fill(COLORS.text);
  textSize(18);
  text(`Weapon: ${currentWeapon.charAt(0).toUpperCase() + currentWeapon.slice(1)}`, healthBarX + healthBarWidth + 20, healthBarY);
  
  // Stats
  let statX = healthBarX + healthBarWidth + 20;
  let statY = healthBarY + 25;
  let statSpacing = 20;
  
  textSize(14);
  text(`Damage: ${player.damage}`, statX, statY);
  text(`Fire Rate: ${(1000 / player.fireRate).toFixed(1)}/s`, statX, statY + statSpacing);
  text(`Speed: ${player.speed.toFixed(1)}`, statX, statY + statSpacing * 2);
}

function formatTime(seconds) {
  let minutes = floor(seconds / 60);
  seconds = floor(seconds % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function drawUpgradeScreen() {
  // Darken background
  fill(0, 0, 0, 150);
  rect(0, 0, width, height);
  
  // Title
  textAlign(CENTER, CENTER);
  fill(COLORS.text);
  textSize(36);
  text('LEVEL UP!', width / 2, height / 4);
  textSize(18);
  text('Choose an upgrade:', width / 2, height / 4 + 40);
  
  // Draw upgrade options
  let boxWidth = 200;
  let boxHeight = 100;
  let boxSpacing = 50;
  let totalWidth = upgradeOptions.length * boxWidth + (upgradeOptions.length - 1) * boxSpacing;
  let startX = (width - totalWidth) / 2;
  
  for (let i = 0; i < upgradeOptions.length; i++) {
    let option = upgradeOptions[i];
    let x = startX + i * (boxWidth + boxSpacing);
    let y = height / 2 - boxHeight / 2;
    
    // Check if mouse is over this option
    let isHovered = mouseX >= x && mouseX <= x + boxWidth && mouseY >= y && mouseY <= y + boxHeight;
    
    // Draw box
    fill(COLORS.uiBackground);
    if (isHovered) {
      stroke(COLORS.uiHighlight);
      strokeWeight(3);
    } else {
      noStroke();
    }
    rect(x, y, boxWidth, boxHeight, 10);
    
    // Draw option text
    textAlign(CENTER, CENTER);
    noStroke();
    fill(isHovered ? COLORS.uiHighlight : COLORS.text);
    textSize(20);
    text(option.name, x + boxWidth / 2, y + 30);
    
    textSize(14);
    text(option.description, x + boxWidth / 2, y + 60);
    
    // Draw keybind
    textSize(12);
    fill(COLORS.text, 150);
    text(`Press ${i + 1}`, x + boxWidth / 2, y + boxHeight - 15);
  }
}

function drawGameOverScreen() {
  // Darken background
  fill(0, 0, 0, 200);
  rect(0, 0, width, height);
  
  // Game over text
  textAlign(CENTER, CENTER);
  fill(COLORS.text);
  textSize(48);
  text('GAME OVER', width / 2, height / 3);
  
  // Stats
  textSize(24);
  text(`Time Survived: ${formatTime(gameTime)}`, width / 2, height / 2);
  text(`Score: ${score}`, width / 2, height / 2 + 40);
  text(`Enemies Killed: ${kills}`, width / 2, height / 2 + 80);
  text(`Level Reached: ${level}`, width / 2, height / 2 + 120);
  
  // Restart prompt
  textSize(18);
  fill(COLORS.uiHighlight);
  text('Press SPACE to restart', width / 2, height * 3 / 4);
}
