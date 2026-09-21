(() => {
  'use strict';

  const canvas = document.getElementById('scene');
  const ctx = canvas.getContext('2d');
  const $ = (id) => document.getElementById(id);
  const state = {
    width: 0, height: 0, time: 0, yaw: 0, speed: 0.2,
    casting: false, paused: false, tension: 0, catchWeight: 0,
    totalCatch: 0, fishOn: false, splash: 0
  };
  const keys = Object.create(null);
  const droplets = Array.from({ length: 100 }, () => ({
    x: Math.random(), y: Math.random(), length: 3 + Math.random() * 8,
    speed: 0.4 + Math.random() * 1.4
  }));

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    canvas.width = Math.floor(state.width * dpr);
    canvas.height = Math.floor(state.height * dpr);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function message(text) {
    $('message').textContent = text;
    $('journalText').textContent = text;
  }

  function drawWorld() {
    const { width: W, height: H } = state;
    const horizon = H * 0.48;
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, '#547d91');
    sky.addColorStop(0.55, '#a1c4bd');
    sky.addColorStop(1, '#d3c78f');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // The island shifts when I look left or right.
    ctx.fillStyle = '#315b59';
    ctx.beginPath();
    ctx.moveTo(0, horizon + 18);
    for (let x = 0; x <= W; x += 45) {
      const ridge = Math.sin(x * 0.008 + state.yaw) * 24 + Math.sin(x * 0.023) * 12;
      ctx.lineTo(x, horizon - 35 + ridge);
    }
    ctx.lineTo(W, horizon + 65);
    ctx.lineTo(0, horizon + 65);
    ctx.fill();

    const water = ctx.createLinearGradient(0, horizon, 0, H);
    water.addColorStop(0, '#3b7778');
    water.addColorStop(1, '#123b47');
    ctx.fillStyle = water;
    ctx.fillRect(0, horizon, W, H - horizon);

    ctx.globalAlpha = 0.23;
    ctx.lineWidth = 1;
    for (let y = horizon + 20; y < H; y += 19) {
      ctx.strokeStyle = '#a7d0c2';
      ctx.beginPath();
      for (let x = 0; x <= W; x += 24) {
        ctx.lineTo(x, y + Math.sin(x * 0.02 + state.time * 0.035 + y) * 3);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#f6d58b';
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.arc(W * 0.76, H * 0.2, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawBoat() {
    const { width: W, height: H } = state;
    ctx.save();
    ctx.translate(W * 0.5, H * 0.79);
    ctx.fillStyle = '#734a36';
    ctx.beginPath();
    ctx.moveTo(-190, 5); ctx.lineTo(190, 5); ctx.lineTo(90, 74);
    ctx.lineTo(0, 90); ctx.lineTo(-90, 74); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#b8714b';
    ctx.beginPath();
    ctx.moveTo(-150, 12); ctx.lineTo(150, 12); ctx.lineTo(78, 48);
    ctx.lineTo(-78, 48); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4e342b'; ctx.fillRect(-55, -6, 110, 26);
    ctx.fillStyle = '#c08b5d'; ctx.fillRect(-42, -5, 84, 9);
    ctx.restore();
  }

  function drawRain() {
    const { width: W, height: H } = state;
    for (const drop of droplets) {
      drop.y += 0.0025 * drop.speed * (state.paused ? 0 : 1);
      if (drop.y > 1) drop.y = -0.05;
      ctx.strokeStyle = `rgba(220,239,226,${0.08 + drop.speed * 0.035})`;
      ctx.lineWidth = 0.5 + drop.speed * 0.3;
      ctx.beginPath();
      ctx.moveTo(drop.x * W, drop.y * H * 0.72);
      ctx.lineTo(drop.x * W - 1, drop.y * H * 0.72 + drop.length);
      ctx.stroke();
    }
  }

  function drawFishing() {
    if (!state.casting) return;
    const { width: W, height: H } = state;
    const bobX = W * 0.52 + Math.sin(state.time * 0.04) * 18;
    const bobY = H * 0.59 + Math.sin(state.time * 0.08) * 4;
    ctx.strokeStyle = '#b6ddd0aa';
    ctx.beginPath();
    ctx.ellipse(bobX, bobY + 5, 30 + Math.sin(state.time * 0.05) * 4, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = state.fishOn ? '#d95f46' : '#e8bd68';
    ctx.beginPath(); ctx.arc(bobX, bobY, 5, 0, Math.PI * 2); ctx.fill();

    if (state.splash > 0) {
      ctx.strokeStyle = `rgba(232,238,205,${state.splash / 35})`;
      ctx.beginPath(); ctx.arc(bobX, bobY, 12 + (35 - state.splash) * 1.2, 0, Math.PI * 2); ctx.stroke();
      state.splash--;
    }
  }

  function frame() {
    if (!state.paused) {
      state.time++;
      if (keys.a || keys.arrowleft) state.yaw -= 0.025;
      if (keys.d || keys.arrowright) state.yaw += 0.025;
      if (keys.w) state.speed = Math.min(1, state.speed + 0.003);
      if (keys.s) state.speed = Math.max(0.05, state.speed - 0.004);
    }
    drawWorld(); drawBoat(); drawRain(); drawFishing();
    requestAnimationFrame(frame);
  }

  function castLine() {
    if (state.casting) {
      state.casting = false; state.fishOn = false; state.tension = 0;
      $('fishStatus').textContent = 'LINE DRY';
      $('tensionBar').style.width = '0%';
      message('I reel the line in and let the lake keep its secrets for another minute.');
      return;
    }
    state.casting = true; state.tension = 8; state.splash = 28;
    $('fishStatus').textContent = 'WAITING';
    message('I cast beyond the wake. The lure settles, and every ripple feels like a question.');
  }

  function reel() {
    if (!state.casting) return message('I thumb the reel, but my line is still tucked away.');
    if (state.fishOn || Math.random() < 0.32 || state.tension > 84) {
      state.catchWeight = +(Math.random() * 4 + 1).toFixed(1);
      state.totalCatch += state.catchWeight;
      state.casting = false; state.fishOn = false; state.tension = 0;
      $('catchCount').textContent = `${state.totalCatch.toFixed(1)} kg`;
      $('fishStatus').textContent = 'FISH ON';
      $('tensionBar').style.width = '0%';
      message(`I guide a dripping ${state.catchWeight} kg silver trout over the gunwale!`);
      return;
    }
    state.tension = Math.max(0, state.tension - 18);
    message('I reel slowly, keeping the line singing but never tight enough to snap.');
  }

  function throttle() {
    state.speed = Math.min(1, state.speed + 0.12);
    message('I push the throttle. Spray beads on my sleeves as the boat noses toward deeper water.');
  }

  function lookAround() {
    state.yaw += 0.4;
    message('I turn my shoulders and scan the horizon. A flock of gulls marks a hidden shoal.');
  }

  function togglePause() {
    state.paused = !state.paused;
    $('pauseOverlay')?.classList.toggle('visible', state.paused);
    if (state.paused) message('I rest my hands on the console. Press Escape when I am ready to fish again.');
  }

  // A pause overlay is created here so the game still works with the supplied HTML.
  const pauseOverlay = document.createElement('div');
  pauseOverlay.id = 'pauseOverlay';
  pauseOverlay.innerHTML = '<strong>PAUSED</strong><span>I take a quiet moment on the water.</span>';
  document.getElementById('game').appendChild(pauseOverlay);

  window.addEventListener('resize', resize);
  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    keys[key] = true;
    if (event.code === 'Space') { event.preventDefault(); if (!state.paused) castLine(); }
    if (key === 'r' && !state.paused) reel();
    if (key === 'w' && !state.paused) throttle();
    if (key === 'escape') togglePause();
  });
  window.addEventListener('keyup', (event) => { keys[event.key.toLowerCase()] = false; });
  $('castBtn').addEventListener('click', castLine);
  $('reelBtn').addEventListener('click', reel);
  $('throttleBtn').addEventListener('click', throttle);
  $('lookBtn').addEventListener('click', lookAround);

  setInterval(() => {
    if (state.paused) return;
    const minutes = 360 + Math.floor(state.time / 50);
    $('time').textContent = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    $('depth').textContent = `${(12.4 + state.speed * 8 + Math.sin(state.time * 0.02) * 0.4).toFixed(1)} m`;
    if (state.casting) {
      if (Math.random() < 0.13) { state.tension = Math.min(100, state.tension + 18); state.fishOn = state.tension > 60; }
      $('tensionBar').style.width = `${state.tension}%`;
      if (state.fishOn) { $('fishStatus').textContent = 'BITE!'; message('I feel a hard tug. I keep my wrist low and get ready to reel.'); }
    }
  }, 500);

  resize();
  frame();
})();
