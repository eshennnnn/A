let player1, player2;
let p1Sprites = {};
let p2Sprites = {};
let bgImage;

// 在檔案開頭添加地面高度常數
const GROUND_Y = window.innerHeight / 1.25;
const SCALE_FACTOR = 2.5; // 整體放大倍數

// 在檔案開頭添加物理相關常數
const GRAVITY = 0.8;
const JUMP_FORCE = -20;
const MOVE_SPEED = 8;

// 添加新的常數
const MAX_HP = 100;
const SCREEN_PADDING = 50; // 螢幕邊界padding

// 在檔案開頭添加新常數
const PROJECTILE_SPEED = 15;
const PROJECTILE_DAMAGE = 10;

// 角色類別
class Fighter {
  constructor(x, y, sprites, config, isPlayer1) {
    this.x = x;
    this.y = y;
    this.sprites = sprites;
    this.config = config;
    this.currentAnimation = 'idle';
    this.frame = 0;
    this.frameCounter = 0;
    this.direction = 1;
    this.scale = SCALE_FACTOR;
    
    // 添加物理相關屬性
    this.velocityY = 0;
    this.isJumping = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.hp = MAX_HP;
    this.isPlayer1 = isPlayer1;
    this.isAttacking = false;
    this.attackBox = {
      width: 60,
      height: 50
    };
    this.projectiles = [];
  }

  update() {
    // 處理跳躍物理
    if (this.isJumping) {
      this.velocityY += GRAVITY;
      this.y += this.velocityY;

      // 著地檢測
      if (this.y >= GROUND_Y) {
        this.y = GROUND_Y;
        this.velocityY = 0;
        this.isJumping = false;
        if (!this.moveLeft && !this.moveRight) {
          this.currentAnimation = 'idle';
        }
      }
    }

    // 處理左右移動
    if (this.moveLeft) {
      const nextX = this.x - MOVE_SPEED;
      if (nextX > SCREEN_PADDING) {
        this.x = nextX;
      }
      this.direction = -1;
      if (!this.isJumping) this.currentAnimation = 'idle';
    }
    if (this.moveRight) {
      const nextX = this.x + MOVE_SPEED;
      if (nextX < windowWidth - SCREEN_PADDING) {
        this.x = nextX;
      }
      this.direction = 1;
      if (!this.isJumping) this.currentAnimation = 'idle';
    }

    // 檢查攻擊碰撞
    if (this.isAttacking) {
      this.checkAttackHit();
    }

    // 更新所有投射物
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      projectile.update();
      
      // 檢查是否擊中對手
      const opponent = this.isPlayer1 ? player2 : player1;
      if (projectile.checkHit(opponent)) {
        opponent.takeDamage(PROJECTILE_DAMAGE);
        projectile.active = false;
        
        // 擊退效果
        const knockbackForce = 10;
        opponent.x += knockbackForce * projectile.direction;
        opponent.x = Math.max(SCREEN_PADDING, Math.min(windowWidth - SCREEN_PADDING, opponent.x));
      }
      
      // 移除無效的投射物
      if (!projectile.active) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  checkAttackHit() {
    const opponent = this.isPlayer1 ? player2 : player1;
    
    // 計算當前角色的碰撞箱
    const myBox = {
      x: this.x - (this.config[this.currentAnimation].width * this.scale) / 2,
      y: this.y - this.config[this.currentAnimation].height * this.scale,
      width: this.config[this.currentAnimation].width * this.scale,
      height: this.config[this.currentAnimation].height * this.scale
    };

    // 計算對手的碰撞箱
    const opponentBox = {
      x: opponent.x - (opponent.config[opponent.currentAnimation].width * opponent.scale) / 2,
      y: opponent.y - opponent.config[opponent.currentAnimation].height * opponent.scale,
      width: opponent.config[opponent.currentAnimation].width * opponent.scale,
      height: opponent.config[opponent.currentAnimation].height * opponent.scale
    };

    // 檢查碰撞
    if (this.checkCollision(myBox, opponentBox)) {
      if (!opponent.isHit && this.isAttacking) {
        opponent.takeDamage(10);
        opponent.isHit = true;
        
        // 擊退效果
        const knockbackForce = 20;
        const direction = this.direction;
        opponent.x += knockbackForce * direction;
        
        // 確保擊退不會超出螢幕邊界
        opponent.x = Math.max(SCREEN_PADDING, Math.min(windowWidth - SCREEN_PADDING, opponent.x));
      }
    }
  }

  // 添加碰撞檢測輔助方法
  checkCollision(box1, box2) {
    return box1.x < box2.x + box2.width &&
           box1.x + box1.width > box2.x &&
           box1.y < box2.y + box2.height &&
           box1.y + box1.height > box2.y;
  }

  takeDamage(damage) {
    this.hp = Math.max(0, this.hp - damage);
    
    // 受傷閃爍效果
    this.isHit = true;
    setTimeout(() => {
      this.isHit = false;
    }, 200);

    // 如果血量歸零
    if (this.hp <= 0) {
      this.handleDeath();
    }
  }

  attack() {
    if (!this.isAttacking) {
      this.currentAnimation = 'attack';
      this.isAttacking = true;
      this.frame = 0;
      
      const projectileX = this.x + (this.direction === 1 ? 50 : -50);
      const projectileY = this.y - 50;
      this.projectiles.push(new Projectile(projectileX, projectileY, this.direction, this.isPlayer1));
      
      setTimeout(() => {
        this.isAttacking = false;
        if (!this.isJumping) {
          this.currentAnimation = 'idle';
        }
      }, 500);
    }
  }

  drawHP() {
    push();
    const hpBarWidth = 250;
    const hpBarHeight = 30;
    const x = this.isPlayer1 ? 50 : windowWidth - 300;
    const y = 80;
    
    // 血條外框陰影效果
    for(let i = 3; i > 0; i--) {
      fill(0, 50/i);
      rect(x + i, y + i, hpBarWidth, hpBarHeight, 15);
    }
    
    // 血條外框
    stroke(255);
    strokeWeight(3);
    fill(40, 200);  // 加入透明度
    rect(x, y, hpBarWidth, hpBarHeight, 15);
    
    // 血量
    noStroke();
    const hpWidth = (this.hp / MAX_HP) * (hpBarWidth - 6);
    const hpColor = this.hp > 70 ? color(50, 255, 50, 230) :
                    this.hp > 30 ? color(255, 165, 0, 230) :
                    color(255, 50, 50, 230);
    
    // 血量條發光效果
    for(let i = 3; i > 0; i--) {
      fill(hpColor.levels[0], hpColor.levels[1], hpColor.levels[2], 50/i);
      rect(x + 3 + i, y + 3 + i, hpWidth - i*2, hpBarHeight - 6, 10);
    }
    
    fill(hpColor);
    rect(x + 3, y + 3, hpWidth, hpBarHeight - 6, 10);
    
    // 血量數字
    fill(255);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(18);
    text(this.hp + '%', x + hpBarWidth/2, y + hpBarHeight/2);
    
    // 玩家標籤位置也跟著調整
    textAlign(this.isPlayer1 ? LEFT : RIGHT);
    textSize(24);
    strokeWeight(3);
    stroke(0);
    fill(this.isPlayer1 ? color(255, 100, 100) : color(100, 100, 255));
    text(this.isPlayer1 ? 'PLAYER 1' : 'PLAYER 2', 
         this.isPlayer1 ? x : x + hpBarWidth, y - 25);
    pop();
  }

  jump() {
    if (!this.isJumping) {
      this.velocityY = JUMP_FORCE;
      this.isJumping = true;
      this.currentAnimation = 'jump';
    }
  }

  animate() {
    const currentConfig = this.config[this.currentAnimation];
    this.frameCounter++;
    
    if (this.frameCounter >= currentConfig.frameDelay) {
      this.frame = (this.frame + 1) % currentConfig.frames;
      this.frameCounter = 0;
    }

    push();
    translate(this.x, this.y);
    
    // 修改受傷閃爍效果
    if (this.isHit) {
      // 改為暗紅色調
      tint(139, 0, 0, 200);  // RGB(139, 0, 0) 是暗紅色，200是透明度
    }
    
    scale(this.direction * this.scale, this.scale);
    
    const frameWidth = this.sprites[this.currentAnimation].width / currentConfig.frames;
    const offsetY = currentConfig.offsetY || 0;
    
    image(
      this.sprites[this.currentAnimation],
      -currentConfig.width/2,
      -currentConfig.height + offsetY,
      currentConfig.width,
      currentConfig.height,
      frameWidth * this.frame,
      0,
      frameWidth,
      this.sprites[this.currentAnimation].height
    );
    pop();

    // 繪製所有投射物
    this.projectiles.forEach(projectile => {
      projectile.draw();
    });
  }

  // 添加死亡處理方法
  handleDeath() {
    // 遊戲結束，顯示獲勝者
    const winner = this.isPlayer1 ? "Player 2" : "Player 1";
    this.showGameOver(winner);
  }

  // 添加遊戲結束顯示方法
  showGameOver(winner) {
    push();
    // 背景遮罩
    fill(0, 150);
    rect(0, 0, windowWidth, windowHeight);
    
    // 勝利標題
    textAlign(CENTER, CENTER);
    textSize(80);
    
    // 發光效果
    for(let i = 10; i > 0; i--) {
      fill(255, 255, 255, i * 2);
      text(winner + " WINS!", windowWidth/2, windowHeight/2 - 50 + i/2);
    }
    
    // 主標題
    fill(255, 220, 0);
    stroke(255, 100, 0);
    strokeWeight(4);
    text(winner + " WINS!", windowWidth/2, windowHeight/2 - 50);
    
    // 重新開始提示
    textSize(32);
    noStroke();
    fill(255);
    
    // 閃爍效果
    if (frameCount % 60 < 30) {
      text("Press R to restart", windowWidth/2, windowHeight/2 + 50);
    }
    
    // 添加分數或其他統計資訊
    textSize(24);
    fill(200);
    text("Battle Time: " + floor(millis()/1000) + "s", windowWidth/2, windowHeight/2 + 100);
    pop();
    
    noLoop(); // 停止遊戲循環
  }
}

class Projectile {
  constructor(x, y, direction, isPlayer1) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.width = 30;
    this.height = 20;
    this.isPlayer1 = isPlayer1;
    this.active = true;
    
    // 新增特效相關屬性
    this.particles = [];
    this.angle = 0;
  }

  update() {
    this.x += PROJECTILE_SPEED * this.direction;
    this.angle += 0.2; // 旋轉效果
    
    // 產生粒子特效
    if (frameCount % 2 === 0) {
      this.particles.push({
        x: this.x,
        y: this.y,
        size: random(5, 15),
        alpha: 255,
        speedX: random(-1, 1),
        speedY: random(-1, 1)
      });
    }
    
    // 更新粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.x += p.speedX;
      p.y += p.speedY;
      p.alpha -= 10;
      p.size *= 0.95;
      
      if (p.alpha <= 0 || p.size < 1) {
        this.particles.splice(i, 1);
      }
    }
    
    if (this.x < 0 || this.x > windowWidth) {
      this.active = false;
    }
  }

  draw() {
    push();
    // 繪製粒子效果
    this.particles.forEach(p => {
      push();
      if (this.isPlayer1) {
        fill(255, 100, 100, p.alpha);
      } else {
        fill(100, 100, 255, p.alpha);
      }
      noStroke();
      ellipse(p.x, p.y, p.size);
      pop();
    });
    
    // 繪製主要投射物
    translate(this.x, this.y);
    rotate(this.angle);
    
    // 發光效果
    for (let i = 3; i > 0; i--) {
      if (this.isPlayer1) {
        fill(255, 0, 0, 50/i);
      } else {
        fill(0, 0, 255, 50/i);
      }
      noStroke();
      ellipse(0, 0, this.width + i*8, this.height + i*8);
    }
    
    // 主體
    if (this.isPlayer1) {
      fill(255, 50, 50, 200);
    } else {
      fill(50, 50, 255, 200);
    }
    
    // 繪製星形投射物
    beginShape();
    for (let i = 0; i < 5; i++) {
      let angle = TWO_PI * i / 5 - PI/2;
      let x1 = cos(angle) * this.width/2;
      let y1 = sin(angle) * this.height/2;
      vertex(x1, y1);
      
      angle += TWO_PI/10;
      let x2 = cos(angle) * this.width/4;
      let y2 = sin(angle) * this.height/4;
      vertex(x2, y2);
    }
    endShape(CLOSE);
    
    pop();
  }

  checkHit(opponent) {
    if (!this.active) return false;
    
    // 計算對手的碰撞箱
    const opponentBox = {
      x: opponent.x - (opponent.config[opponent.currentAnimation].width * opponent.scale) / 2,
      y: opponent.y - opponent.config[opponent.currentAnimation].height * opponent.scale,
      width: opponent.config[opponent.currentAnimation].width * opponent.scale,
      height: opponent.config[opponent.currentAnimation].height * opponent.scale
    };

    // 檢查碰撞
    if (this.x + this.width/2 > opponentBox.x &&
        this.x - this.width/2 < opponentBox.x + opponentBox.width &&
        this.y + this.height/2 > opponentBox.y &&
        this.y - this.height/2 < opponentBox.y + opponentBox.height) {
      return true;
    }
    return false;
  }
}

// 角色動作配置
const player1Config = {
  idle: {
    frames: 4,          // 動畫幀數
    frameDelay: 8,      // 動畫速度（數字越大越慢）
    width: 40,         // 顯示寬度
    height: 35         // 顯示高度
  },
  attack: {
    frames: 6,
    frameDelay: 12,
    width: 40,
    height: 33,
  },
  jump: {
    frames: 4,
    frameDelay: 6,
    width: 26,
    height: 42
  }
};

const player2Config = {
  idle: {
    frames: 4,
    frameDelay: 8,
    width: 40,
    height: 35,
    offsetY: 0
  },
  attack: {
    frames: 5,            // 改為7幀，根據實際精靈圖的幀數
    frameDelay: 12,
    width: 39,
    height: 37,
    offsetY: 0
  },
  jump: {
    frames: 5,
    frameDelay: 6,
    width: 39,
    height: 37,
    offsetY: 0
  }
};

function preload() {
  // 載入背景圖片
  bgImage = loadImage('Backgrounds.png');
  
  // 載入角色1的圖片
  p1Sprites = {
    idle: loadImage('run1.png'),      // 水平排列的精靈圖
    attack: loadImage('attack1.png'),  // 水平排列的精靈圖
    jump: loadImage('jump1.png')       // 水平排列的精靈圖
  };
  
  // 載入角色2的圖片
  p2Sprites = {
    idle: loadImage('run2.png'),    // 水平排列的精靈圖
    attack: loadImage('attack2.png'), // 水平排列的精靈圖
    jump: loadImage('jump2.png')     // 水平排列的精靈圖
  };
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 創建兩個角色實例，加入 isPlayer1 參數
  player1 = new Fighter(windowWidth * 0.3, GROUND_Y, p1Sprites, player1Config, true);
  player2 = new Fighter(windowWidth * 0.7, GROUND_Y, p2Sprites, player2Config, false);
}

function draw() {
  image(bgImage, 0, 0, windowWidth, windowHeight);
  
  // 繪製操作說明
  drawControls();
  
  // 更新和繪製角色
  player1.update();
  player2.update();
  player1.animate();
  player2.animate();
  
  // 繪製血條
  player1.drawHP();
  player2.drawHP();
  
  // 添加常駐字幕
  drawTitle();
}

// 添加繪製標題的函數
function drawTitle() {
  push();
  const title = '淡江教育科技';
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(64);  // 放大字體
  
  // 外發光效果加強
  for(let i = 15; i > 0; i--) {
    fill(255, 255, 255, i * 1.2);  // 調整透明度
    text(title, windowWidth/2, windowHeight/2 - 50 + i/2);
  }
  
  // 主標題
  fill(255, 255, 255, 160);  // 增加透明度
  stroke(100, 150, 255, 130);
  strokeWeight(4);
  text(title, windowWidth/2, windowHeight/2 - 50);
  
  // 副標題
  textSize(36);  // 放大副標題
  noStroke();
  fill(200, 200, 200, 100);  // 更透明
  text('- TKUET -', windowWidth/2, windowHeight/2 + 20);
  pop();
}

// 新增繪製操作說明的函數
function drawControls() {
  push();
  const padding = 15;
  const boxWidth = 200;  // 加寬一點以容納中文
  const boxHeight = 120;
  
  // 移動到畫面下方
  const yPosition = windowHeight - boxHeight - 50;  // 距離底部50像素
  
  // Player 1 控制說明
  drawControlBox(50, yPosition, boxWidth, boxHeight, 
                '玩家一 控制', 
                [
                  'A / D - 左右移動',
                  'W - 跳躍',
                  'F - 攻擊'
                ],
                color(255, 100, 100, 50));
  
  // Player 2 ��制說明
  drawControlBox(windowWidth - 50 - boxWidth, yPosition, boxWidth, boxHeight,
                '玩家二 控制',
                [
                  '←/→ - 左右移動',
                  '↑ - 跳躍',
                  '/ - 攻擊'
                ],
                color(100, 100, 255, 50));
  pop();
}

// 新增輔助函數來繪製控制說明框
function drawControlBox(x, y, width, height, title, controls, boxColor) {
  push();
  // 外框陰影
  for(let i = 3; i > 0; i--) {
    fill(0, 30/i);
    rect(x + i, y + i, width, height, 15);
  }
  
  // 半透明背景
  fill(boxColor);
  stroke(255, 150);
  strokeWeight(2);
  rect(x, y, width, height, 15);
  
  // 標題
  fill(255);
  stroke(0);
  strokeWeight(2);
  textSize(22);  // 加大中文標題
  textStyle(BOLD);
  textAlign(LEFT);
  text(title, x + 15, y + 30);
  
  // 分隔線
  stroke(255, 100);
  strokeWeight(2);
  line(x + 15, y + 40, x + width - 15, y + 40);
  
  // 控制說明
  noStroke();
  textSize(18);  // 加大中文說明文字
  textStyle(NORMAL);
  controls.forEach((control, index) => {
    fill(255, 220);
    text(control, x + 15, y + 65 + index * 25);
  });
  pop();
}

// 修改按鍵控制
function keyPressed() {
  // 角色1控制
  switch (keyCode) {
    case 65: // A
      player1.moveLeft = true;
      break;
    case 68: // D
      player1.moveRight = true;
      break;
    case 87: // W
      player1.jump();
      break;
    case 70: // F
      player1.attack();
      break;
  }
  
  // 角色2控制
  switch (keyCode) {
    case LEFT_ARROW:
      player2.moveLeft = true;
      break;
    case RIGHT_ARROW:
      player2.moveRight = true;
      break;
    case UP_ARROW:
      player2.jump();
      break;
    case 191: // /
      player2.attack();
      break;
  }

  // 重新開始遊戲
  if (keyCode === 82) { // R鍵
    resetGame();
  }
}

function keyReleased() {
  // 角色1控制
  switch (keyCode) {
    case 65: // A
      player1.moveLeft = false;
      if (!player1.moveRight && !player1.isJumping) player1.currentAnimation = 'idle';
      break;
    case 68: // D
      player1.moveRight = false;
      if (!player1.moveLeft && !player1.isJumping) player1.currentAnimation = 'idle';
      break;
    case 70: // F
      if (!player1.isJumping) player1.currentAnimation = 'idle';
      break;
  }
  
  // 角色2控制
  switch (keyCode) {
    case LEFT_ARROW:
      player2.moveLeft = false;
      if (!player2.moveRight && !player2.isJumping) player2.currentAnimation = 'idle';
      break;
    case RIGHT_ARROW:
      player2.moveRight = false;
      if (!player2.moveLeft && !player2.isJumping) player2.currentAnimation = 'idle';
      break;
    case 191: // /
      if (!player2.isJumping) player2.currentAnimation = 'idle';
      break;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // 更新地面高度
  GROUND_Y = window.innerHeight / 1;
  // 更新角色位置
  player1.y = GROUND_Y;
  player2.y = GROUND_Y;
}

// 添加重置遊戲函數
function resetGame() {
  player1 = new Fighter(windowWidth * 0.3, GROUND_Y, p1Sprites, player1Config, true);
  player2 = new Fighter(windowWidth * 0.7, GROUND_Y, p2Sprites, player2Config, false);
  loop(); // 重新開始遊戲循環
}
