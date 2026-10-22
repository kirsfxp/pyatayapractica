import { Player } from './Player.js';
import { rectsOverlap } from './collision.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.groundY = this.height - 50; 

    this.assets = {
      bg1: this.loadImage('assets/bg.png'),       
      bg2: this.loadImage('assets/bg_sea.png'),   
      player: this.loadImage('assets/player.png'),
      snork: this.loadImage('assets/snork.png'),
      butterfly: this.loadImage('assets/butterfly.png'),
      heart: this.loadImage('assets/heart.png')   
    };

    this.level1 = {
      bg: this.assets.bg1,
      platforms: [
        { x: 0, y: 460, width: 160, height: 80 },
        { x: 240, y: 460, width: 100, height: 80 },
        { x: 440, y: 460, width: 100, height: 80 },
        { x: 640, y: 460, width: 100, height: 80 },
        { x: 800, y: 460, width: 160, height: 80 },
        { x: 180, y: 350, width: 100, height: 25 },
        { x: 380, y: 280, width: 100, height: 25 },
        { x: 580, y: 210, width: 100, height: 25 }
      ],
      items: [
        { x: 630, y: 160, type: 'butterfly', collected: false }
      ],
      hazards: [
        { x: 160, y: this.height - 40, width: 80, height: 40 }, 
        { x: 340, y: this.height - 40, width: 100, height: 40 }, 
        { x: 540, y: this.height - 40, width: 100, height: 40 },
        { x: 740, y: this.height - 40, width: 60, height: 40 }
      ],
      finish: { x: 820, y: 460 - 120, width: 120, height: 120 }
    };

    this.level2 = {
      bg: this.assets.bg2,
      platforms: [
        { x: 0, y: 460, width: 140, height: 80 },
        { x: 220, y: 400, width: 90, height: 25 },
        { x: 380, y: 330, width: 90, height: 25 },
        { x: 540, y: 260, width: 90, height: 25 },
        { x: 700, y: 330, width: 90, height: 25 },
        { x: 850, y: 460, width: 110, height: 80 },
        { x: 300, y: 460, width: 100, height: 80 },
        { x: 500, y: 460, width: 100, height: 80 },
        { x: 700, y: 460, width: 100, height: 80 }
      ],
      items: [
        { x: 265, y: 350, type: 'heart', collected: false },
        { x: 425, y: 280, type: 'heart', collected: false },
        { x: 585, y: 210, type: 'heart', collected: false }
      ],
      hazards: [
        { x: 140, y: this.height - 40, width: 80, height: 40 },
        { x: 400, y: this.height - 40, width: 100, height: 40 },
        { x: 600, y: this.height - 40, width: 100, height: 40 },
        { x: 800, y: this.height - 40, width: 50, height: 40 }
      ],
      finish: { x: 870, y: 460 - 120, width: 120, height: 120 }
    };

    this.currentLevelIndex = 0;
    this.levels = [this.level1, this.level2];

    this.score = 0;
    this.state = 'playing'; 
    this.time = 0;

    const playerSize = 120;
    this.player = new Player(20, 460 - 100, playerSize, playerSize, this.assets.player);

    this.loadLevel(0);
    this.loadBestTime();
  }

  loadLevel(index) {
    this.currentLevelIndex = index;
    this.currentLevel = this.levels[index];
    
    this.score = 0;
    this.state = 'playing';
    this.time = 0;
    this.currentLevel.items.forEach(item => item.collected = false);
    this.player.reset();

    document.getElementById('level').innerText = index + 1;
    document.getElementById('total-items').innerText = this.currentLevel.items.length;
    this.updateUI();
    
    document.getElementById('win-screen').classList.add('hidden');
  }

  loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
  }

  loadBestTime() {
    try {
      const best = localStorage.getItem('moomin_best_time');
      if (best) document.getElementById('best-time').innerText = best;
    } catch(e) { console.warn('localStorage недоступен'); }
  }

  saveBestTime(time) {
    try {
      const best = localStorage.getItem('moomin_best_time');
      if (!best || time < parseFloat(best)) {
        localStorage.setItem('moomin_best_time', time.toFixed(1));
        document.getElementById('best-time').innerText = time.toFixed(1);
      }
    } catch(e) { console.warn('localStorage недоступен'); }
  }

  reset() {
    this.loadLevel(this.currentLevelIndex);
  }

  updateUI() {
    document.getElementById('score').innerText = this.score;
    document.getElementById('time').innerText = this.time.toFixed(1);
  }

  update(dt) {
    if (this.state !== 'playing') return; 

    this.time += dt;
    this.updateUI();

    const wasOnGround = this.player.onGround;
    this.player.update(dt, this.currentLevel.platforms, this.width, this.height);

    if (wasOnGround && !this.player.onGround && this.player.vy < 0) {
      const jumpSound = document.getElementById('jump-sound');
      if (jumpSound) {
        jumpSound.currentTime = 0; 
        jumpSound.play().catch(() => {});
      }
    }

    for (const item of this.currentLevel.items) {
      if (!item.collected) {
        const itemBox = { x: item.x - 25, y: item.y - 25, width: 50, height: 50 };
        if (rectsOverlap(this.player, itemBox)) {
          item.collected = true;
          this.score++;
          this.updateUI();
        }
      }
    }

    if (this.player.y > this.height) this.state = 'lost';

    for (const h of this.currentLevel.hazards) {
      if (rectsOverlap(this.player, h)) this.state = 'lost';
    }

    if (rectsOverlap(this.player, this.currentLevel.finish)) {
      this.state = 'won';
      if (this.currentLevelIndex === 0) this.saveBestTime(this.time);
      this.showWinScreen();
    }
  }

  showWinScreen() {
    const winScreen = document.getElementById('win-screen');
    const hugImg = document.getElementById('hug-img');
    const togetherImg = document.getElementById('together-img');
    const noGiftText = document.getElementById('no-gift-text');
    const goodTimeText = document.getElementById('good-time-text');
    const title = document.getElementById('win-title');
    const winTime = document.getElementById('win-time');
    const nextBtn = document.getElementById('next-level-btn');

    winTime.innerText = `Ваше время: ${this.time.toFixed(1)} секунд`;

    hugImg.classList.add('hidden');
    togetherImg.classList.add('hidden');
    noGiftText.classList.add('hidden');
    goodTimeText.classList.add('hidden');

    const totalItems = this.currentLevel.items.length;

    if (this.score === totalItems) {
      if (this.currentLevelIndex === 0) {
        title.innerText = 'Вы принесли Фрекен Снорк подарочек!';
        hugImg.classList.remove('hidden');
      } else {
        title.innerText = 'Вы прошли все уровни и собрали все подарки!';
        togetherImg.classList.remove('hidden');
      }
    } else if (this.currentLevelIndex === 1 && this.score > 0) {
      title.innerText = 'Вы прошли все уровни!';
      goodTimeText.classList.remove('hidden');
    } else {
      title.innerText = 'Вы пришли без подарков...';
      noGiftText.classList.remove('hidden');
    }

    if (this.currentLevelIndex < this.levels.length - 1) {
      nextBtn.classList.remove('hidden');
    } else {
      nextBtn.classList.add('hidden');
    }

    winScreen.classList.remove('hidden');
  }

  render() {
    const ctx = this.ctx;
    this.drawBackground(ctx);
    this.drawPlatforms(ctx);
    this.drawHazards(ctx);
    this.drawFinish(ctx);
    this.drawItems(ctx);
    this.player.draw(ctx);
    this.drawStatus(ctx);
  }

  drawBackground(ctx) {
    const bg = this.currentLevel.bg;
    if (bg && bg.complete && bg.naturalWidth > 0) {
      ctx.drawImage(bg, 0, 0, this.width, this.height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(0, 0, this.width, this.height);
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, this.height);
      g.addColorStop(0, '#cdeee0');
      g.addColorStop(1, '#d2e8f7');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    const grad = ctx.createRadialGradient(
      this.width / 2, this.height / 2, this.height / 3,
      this.width / 2, this.height / 2, this.width / 1.5
    );
    grad.addColorStop(0, 'rgba(253, 246, 236, 0)');
    grad.addColorStop(1, 'rgba(253, 246, 236, 0.3)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  drawPlatforms(ctx) {
    ctx.save();
    
    let fillColor = '#a8d5b5'; 
    let strokeColor = '#7ab38c';
    
    if (this.currentLevelIndex === 1) {
      fillColor = '#a8c8d5';   
      strokeColor = '#7a9eb3';
    }

    for (const p of this.currentLevel.platforms) {
      ctx.fillStyle = 'rgba(91, 84, 112, 0.4)';
      ctx.beginPath();
      ctx.roundRect(p.x, p.y + 8, p.width, p.height, 12);
      ctx.fill();

      ctx.fillStyle = fillColor; 
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.width, p.height, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.roundRect(p.x + 6, p.y + 4, p.width - 12, 8, 4);
      ctx.fill();
    }
    ctx.restore();
  }

  drawItems(ctx) {
    for (const item of this.currentLevel.items) {
      if (item.collected) continue;
      let img = item.type === 'butterfly' ? this.assets.butterfly : this.assets.heart;
      if (img && img.complete && img.naturalWidth > 0) {
        const size = 60; 
        ctx.drawImage(img, item.x - size / 2, item.y - size / 2, size, size);
      }
    }
  }

  drawHazards(ctx) {
    ctx.fillStyle = '#a3749a';
    for (const h of this.currentLevel.hazards) {
      ctx.beginPath();
      ctx.moveTo(h.x, h.y + h.height);
      for (let i = 0; i < Math.ceil(h.width / 15); i++) {
          ctx.lineTo(h.x + (i * 15), h.y + (i % 2 === 0 ? 0 : 20));
      }
      ctx.lineTo(h.x + h.width, h.y + h.height);
      ctx.fill();
    }
  }

  drawFinish(ctx) {
    if (this.assets.snork.complete && this.assets.snork.naturalWidth > 0) {
       const aspectRatio = this.assets.snork.naturalWidth / this.assets.snork.naturalHeight;
       let drawW = this.currentLevel.finish.width;
       let drawH = this.currentLevel.finish.height;
       let offsetX = 0;
       let offsetY = 0;

       if (aspectRatio > 1) {
         drawW = this.currentLevel.finish.height * aspectRatio;
         offsetX = (this.currentLevel.finish.width - drawW) / 2;
       } else {
         drawH = this.currentLevel.finish.width / aspectRatio;
         offsetY = (this.currentLevel.finish.height - drawH) / 2;
       }
       ctx.drawImage(this.assets.snork, this.currentLevel.finish.x + offsetX, this.currentLevel.finish.y + offsetY, drawW, drawH);
    }
  }

  drawStatus(ctx) {
    if (this.state === 'lost') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = '48px "Comic Sans MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Ой! Муми-тролль упал...', this.width / 2, this.height / 2);
    }
  }
}