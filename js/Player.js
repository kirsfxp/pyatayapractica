import { keys } from './input.js';
import { rectsOverlap } from './collision.js';

export class Player {
  constructor(x, y, width, height, img) {
    this.startX = x;
    this.startY = y;
    
    this.width = 70; 
    this.height = 100;
    
    this.drawWidth = width;
    this.drawHeight = height;
    
    this.img = img;

    this.vx = 0;
    this.vy = 0;
    this.speed = 300;
    this.jumpPower = 600;
    this.gravity = 1500;
    this.onGround = false;
    
    this.prevX = x;
    this.prevY = y;
    
    this.reset();
  }

  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
  }

  update(dt, platforms, canvasWidth, canvasHeight) {
    this.prevX = this.x;
    this.prevY = this.y;

    let move = 0;
    if (keys.has('ArrowLeft') || keys.has('KeyA')) move -= 1;
    if (keys.has('ArrowRight') || keys.has('KeyD')) move += 1;
    this.vx = move * this.speed;

    if ((keys.has('Space') || keys.has('ArrowUp') || keys.has('KeyW')) && this.onGround) {
      this.vy = -this.jumpPower;
      this.onGround = false;
    }

    this.vy += this.gravity * dt;

    this.x += this.vx * dt;
    for (const p of platforms) {
      if (rectsOverlap(this, p)) {
        if (this.vx > 0) this.x = p.x - this.width;
        else if (this.vx < 0) this.x = p.x + p.width;
      }
    }

    this.y += this.vy * dt;
    this.onGround = false;

    for (const p of platforms) {
      if (rectsOverlap(this, p)) {
        if (this.vy > 0) {
          this.y = p.y - this.height;
          this.vy = 0;
          this.onGround = true;
        } 
        else if (this.vy < 0) {
          this.y = p.y + p.height;
          this.vy = 0;
        }
      }
    }

    if (this.x < 0) this.x = 0;
    if (this.x + this.width > canvasWidth) this.x = canvasWidth - this.width;
  }

  draw(ctx) {
    if (this.img && this.img.complete && this.img.naturalWidth > 0) {
      ctx.save();
      
      const offsetX = (this.width - this.drawWidth) / 2;
      const offsetY = this.height - this.drawHeight;

      if (this.vx < 0) {
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.scale(-1, 1);
        ctx.drawImage(this.img, -this.width / 2 + offsetX, -this.height / 2 + offsetY, this.drawWidth, this.drawHeight);
      } else {
        ctx.drawImage(this.img, this.x + offsetX, this.y + offsetY, this.drawWidth, this.drawHeight);
      }
      
      ctx.restore();
      return;
    }

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#b9b3cc';
    ctx.lineWidth = 2;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeRect(this.x, this.y, this.width, this.height);
  }
}