import { Game } from './Game.js';
import { keys } from './input.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);

const music1 = document.getElementById('music1');
const music2 = document.getElementById('music2');
const jumpSound = document.getElementById('jump-sound');

let lastTime = 0;
let animationId = null;
let isPaused = true; 
let isGameStarted = false; // флаг: игра началась (меню закрыто)

// --- Настройки ---
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const volumeSlider = document.getElementById('volume-slider');
const toggleMusicBtn = document.getElementById('toggle-music-btn');
const resetRecordBtn = document.getElementById('reset-record-btn');

settingsBtn.addEventListener('click', () => {
  settingsModal.classList.remove('hidden');
});

closeSettingsBtn.addEventListener('click', () => {
  settingsModal.classList.add('hidden');
});

volumeSlider.addEventListener('input', (e) => {
  const vol = parseFloat(e.target.value);
  music1.volume = vol;
  music2.volume = vol;
  jumpSound.volume = vol;
});

toggleMusicBtn.addEventListener('click', () => {
  const isPlaying = toggleMusicBtn.innerText === 'Вкл';
  toggleMusicBtn.innerText = isPlaying ? 'Выкл' : 'Вкл';
  
  if (isPlaying) {
    music1.pause();
    music2.pause();
  } else if (!isPaused) {
    updateMusic(game.currentLevelIndex);
  }
});

resetRecordBtn.addEventListener('click', () => {
  try {
    localStorage.removeItem('moomin_best_time');
    document.getElementById('best-time').innerText = '--';
    alert('Рекорд успешно сброшен!');
  } catch(e) {
    console.warn('Не удалось сбросить рекорд');
  }
});

// --- Логика музыки ---
function updateMusic(levelIndex) {
  music1.pause();
  music2.pause();
  
  if (toggleMusicBtn.innerText === 'Выкл') return;

  if (levelIndex === 0) {
    music1.currentTime = 0;
    music1.play().catch(() => {});
  } else if (levelIndex === 1) {
    music2.currentTime = 0;
    music2.play().catch(() => {});
  }
}

// --- Игровой цикл ---
function loop(timestamp) {
  if (isPaused) {
    animationId = requestAnimationFrame(loop);
    return;
  }

  if (!lastTime) lastTime = timestamp;
  let dt = (timestamp - lastTime) / 1000;
  if (dt > 0.05) dt = 0.05;
  lastTime = timestamp;

  game.update(dt);
  game.render();

  animationId = requestAnimationFrame(loop);
}

// Управление паузой: forcePause === true -> ставим на паузу, false -> снимаем
function setPause(forcePause) {
  isPaused = forcePause;
  
  const pauseBtn = document.getElementById('pause-btn');
  pauseBtn.innerText = isPaused ? 'Продолжить' : 'Пауза';

  if (isPaused) {
    music1.pause();
    music2.pause();
  } else {
    updateMusic(game.currentLevelIndex);
  }

  lastTime = 0; 
}

// --- Главное меню ---
const menuScreen = document.getElementById('main-menu');
const startBtn = document.getElementById('start-game-btn');

startBtn.addEventListener('click', () => {
  menuScreen.classList.add('hidden');
  isGameStarted = true;
  setPause(false); // запускаем игру
});

// --- Кнопки управления ---
document.getElementById('restart-btn').addEventListener('click', () => {
  game.reset();
  setPause(false); // при рестарте снимаем паузу
  updateMusic(game.currentLevelIndex);
});

document.getElementById('win-restart-btn').addEventListener('click', () => {
  game.reset();
  setPause(false);
  updateMusic(game.currentLevelIndex);
});

document.getElementById('next-level-btn').addEventListener('click', () => {
  const nextIdx = game.currentLevelIndex + 1;
  game.loadLevel(nextIdx);
  setPause(false);
  updateMusic(nextIdx);
});

document.getElementById('level1-btn').addEventListener('click', () => {
  game.loadLevel(0);
  setPause(false);
  updateMusic(0);
});

// Кнопка паузы: переключает состояние
document.getElementById('pause-btn').addEventListener('click', () => {
  if (!isGameStarted) return;
  setPause(!isPaused);
});

// --- Экранные кнопки для телефона ---
function bindTouchBtn(btnId, keyCode) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.addEventListener('pointerdown', (e) => { e.preventDefault(); keys.add(keyCode); });
  btn.addEventListener('pointerup', (e) => { e.preventDefault(); keys.delete(keyCode); });
  btn.addEventListener('pointerleave', () => keys.delete(keyCode));
}

bindTouchBtn('btn-left', 'ArrowLeft');
bindTouchBtn('btn-right', 'ArrowRight');
bindTouchBtn('btn-jump', 'Space');

// --- Пауза при скрытии вкладки ---
document.addEventListener('visibilitychange', () => {
  if (!isGameStarted) return; // если игра ещё не начата — не трогаем

  if (document.hidden) {
    // Вкладка скрыта — ставим на паузу (если ещё не на паузе)
    if (!isPaused) setPause(true);
  }
  // При возврате НЕ снимаем паузу — игрок сам нажмёт "Продолжить"
});

window.addEventListener('blur', () => {
  if (!isGameStarted) return;
  if (!isPaused) setPause(true);
});

// Запуск цикла
animationId = requestAnimationFrame(loop);