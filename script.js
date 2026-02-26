/* ============================================
   JEET.DEV — script.js
   Particle Field + Lag-Fixed Cursor
   ============================================ */

/* ══════════════════════════════════════════
   1. CURSOR — zero lag via CSS transform
   ══════════════════════════════════════════ */
const dot  = document.getElementById('cursor');
const ring = document.getElementById('cursor-ring');

let mx = 0, my = 0;
let rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX;
  my = e.clientY;
  dot.style.transform = `translate(${mx - 6}px, ${my - 6}px)`;
});

(function lerpRing() {
  rx += (mx - rx) * 0.13;
  ry += (my - ry) * 0.13;
  ring.style.transform = `translate(${rx - 18}px, ${ry - 18}px)`;
  requestAnimationFrame(lerpRing);
})();

document.querySelectorAll('a, button, .card').forEach(el => {
  el.addEventListener('mouseenter', () => {
    dot.style.width = dot.style.height = '8px';
    ring.style.width = ring.style.height = '54px';
  });
  el.addEventListener('mouseleave', () => {
    dot.style.width = dot.style.height = '12px';
    ring.style.width = ring.style.height = '36px';
  });
});

document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; ring.style.opacity = '1'; });


/* ══════════════════════════════════════════
   2. PARTICLE FIELD CANVAS
   ══════════════════════════════════════════ */
const canvas = document.getElementById('bg-canvas');
const ctx    = canvas.getContext('2d');

const DPR    = window.devicePixelRatio || 1;
let   CW, CH;

let pmx = null, pmy = null;
document.addEventListener('mousemove', e => { pmx = e.clientX; pmy = e.clientY; });
document.addEventListener('mouseleave', () => { pmx = null; pmy = null; });

function resizeCanvas() {
  CW = canvas.width  = window.innerWidth  * DPR;
  CH = canvas.height = window.innerHeight * DPR;
  canvas.style.width  = window.innerWidth  + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.scale(DPR, DPR);
}

const CFG = {
  count:       90,
  maxDist:     130,
  mouseRadius: 160,
  speed:       0.38,
  colors:      ['#00f5a0','#00d9f5','#7b61ff','#ffffff'],
  weights:     [7, 4, 2, 1],
};

function pickColor() {
  const total = CFG.weights.reduce((a,b)=>a+b,0);
  let r = Math.random() * total;
  for (let i = 0; i < CFG.colors.length; i++) {
    r -= CFG.weights[i];
    if (r <= 0) return CFG.colors[i];
  }
  return CFG.colors[0];
}

class Particle {
  constructor() { this.init(true); }
  init(randomY = false) {
    const W = window.innerWidth, H = window.innerHeight;
    this.x     = Math.random() * W;
    this.y     = randomY ? Math.random() * H : (Math.random() < .5 ? -10 : H + 10);
    this.vx    = (Math.random() - .5) * CFG.speed;
    this.vy    = (Math.random() - .5) * CFG.speed;
    this.r     = 1.2 + Math.random() * 2.2;
    this.color = pickColor();
    this.alpha = 0.2 + Math.random() * 0.65;
    this.phase = Math.random() * Math.PI * 2;
  }

  update() {
    const W = window.innerWidth, H = window.innerHeight;
    this.phase += 0.018;

    if (pmx !== null) {
      const dx = this.x - pmx, dy = this.y - pmy;
      const d  = Math.sqrt(dx*dx + dy*dy);
      if (d < CFG.mouseRadius && d > 0) {
        const f = (CFG.mouseRadius - d) / CFG.mouseRadius;
        this.vx += (dx / d) * f * 0.55;
        this.vy += (dy / d) * f * 0.55;
      }
    }

    this.vx *= 0.97;
    this.vy *= 0.97;
    const spd = Math.sqrt(this.vx*this.vx + this.vy*this.vy);
    if (spd > 2.2) { this.vx = this.vx/spd*2.2; this.vy = this.vy/spd*2.2; }

    this.x += this.vx;
    this.y += this.vy;

    if (this.x < -20) this.x = W + 20;
    if (this.x > W+20) this.x = -20;
    if (this.y < -20) this.y = H + 20;
    if (this.y > H+20) this.y = -20;
  }

  draw() {
    const a = this.alpha * (.7 + .3 * Math.sin(this.phase));
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle   = this.color;
    ctx.shadowBlur  = this.r * 5;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
}

let particles = [];

function initParticles() {
  particles = Array.from({ length: CFG.count }, () => new Particle());
}

function drawLines() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i+1; j < particles.length; j++) {
      const a = particles[i], b = particles[j];
      const dx = a.x - b.x, dy = a.y - b.y;
      const d  = dx*dx + dy*dy;
      if (d < CFG.maxDist * CFG.maxDist) {
        const dist = Math.sqrt(d);
        ctx.save();
        ctx.globalAlpha = (1 - dist/CFG.maxDist) * 0.22;
        ctx.strokeStyle = a.color;
        ctx.lineWidth   = 0.75;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}

function drawAura() {
  if (pmx === null) return;
  const grad = ctx.createRadialGradient(pmx, pmy, 0, pmx, pmy, CFG.mouseRadius);
  grad.addColorStop(0,   'rgba(0,245,160,.055)');
  grad.addColorStop(.6,  'rgba(0,217,245,.025)');
  grad.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.save();
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(pmx, pmy, CFG.mouseRadius, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, CW/DPR, CH/DPR);
  drawAura();
  drawLines();
  particles.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(render);
}

resizeCanvas();
initParticles();
render();

window.addEventListener('resize', () => {
  resizeCanvas();
  initParticles();
});


/* ══════════════════════════════════════════
   3. NAVBAR SCROLL SHRINK + ACTIVE LINKS
   ══════════════════════════════════════════ */
const navbar   = document.getElementById('navbar');
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('nav a[href^="#"]');

window.addEventListener('scroll', () => {
  // Shrink + glass effect on scroll
  navbar.classList.toggle('scrolled', window.scrollY > 60);

  // Active link highlight
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 160) current = s.id;
  });
  navLinks.forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
  });
}, { passive: true });


/* ══════════════════════════════════════════
   4. SCROLL REVEAL (section fade-in)
   ══════════════════════════════════════════ */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('show');
    // Stagger cards inside the section
    entry.target.querySelectorAll('.card').forEach((c, i) => {
      c.style.transitionDelay = `${i * 0.11}s`;
    });
    revealObs.unobserve(entry.target);
  });
}, { threshold: 0.08 });

sections.forEach(s => revealObs.observe(s));


/* ══════════════════════════════════════════
   5. CARD 3D TILT
   Only on non-project cards to avoid
   conflicting with project-link hover
   ══════════════════════════════════════════ */
document.querySelectorAll('.card:not(.project-card)').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r  = card.getBoundingClientRect();
    const dx = (e.clientX - r.left  - r.width/2)  / (r.width/2);
    const dy = (e.clientY - r.top   - r.height/2) / (r.height/2);
    card.style.transform = `perspective(800px) rotateX(${-dy*7}deg) rotateY(${dx*7}deg) translateY(-10px)`;
  });
  card.addEventListener('mouseleave', () => card.style.transform = '');
});

// Project cards: gentler tilt only, preserves translateY(-10px) from CSS hover
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r  = card.getBoundingClientRect();
    const dx = (e.clientX - r.left  - r.width/2)  / (r.width/2);
    const dy = (e.clientY - r.top   - r.height/2) / (r.height/2);
    card.style.transform = `perspective(800px) rotateX(${-dy*5}deg) rotateY(${dx*5}deg) translateY(-10px)`;
  });
  card.addEventListener('mouseleave', () => card.style.transform = '');
});


/* ══════════════════════════════════════════
   6. TYPING EFFECT — hero subtitle
   ══════════════════════════════════════════ */
const heroSub = document.querySelector('.hero-sub');
const phrases = ['Full Stack Developer','Creative Web Builder','UI/UX Enthusiast','Problem Solver'];
let pi = 0, ci = 0, deleting = false;

function type() {
  const cur = phrases[pi];
  heroSub.textContent = deleting ? cur.slice(0, ci-1) : cur.slice(0, ci+1);
  deleting ? ci-- : ci++;

  if (!deleting && ci === cur.length) return setTimeout(() => { deleting = true; type(); }, 1800);
  if  (deleting && ci === 0)         { deleting = false; pi = (pi+1) % phrases.length; }

  setTimeout(type, deleting ? 42 : 78);
}
setTimeout(type, 1400);


/* ══════════════════════════════════════════
   7. SMOOTH SCROLL + EXPLORE BUTTON
   ══════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const t = document.querySelector(a.getAttribute('href'));
    if (t) window.scrollTo({ top: t.offsetTop - 80, behavior: 'smooth' });
  });
});

document.getElementById('explore-btn').addEventListener('click', () => {
  const about = document.querySelector('#about');
  if (about) window.scrollTo({ top: about.offsetTop - 80, behavior: 'smooth' });
});


/* ══════════════════════════════════════════
   8. ABOUT TABS
   ══════════════════════════════════════════ */
const tabBtns    = document.querySelectorAll('.tab-btn');
const tabPanels  = document.querySelectorAll('.tab-content');

function activateTab(tabId) {
  tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
  tabPanels.forEach(p => {
    const isActive = p.id === `tab-${tabId}`;
    p.classList.toggle('active', isActive);
    if (isActive && tabId === 'skills') animateBars();
  });
}

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => activateTab(btn.dataset.tab));
});

function animateBars() {
  document.querySelectorAll('.skill-fill').forEach(bar => {
    bar.style.width = '0%';
    requestAnimationFrame(() => {
      setTimeout(() => { bar.style.width = bar.dataset.w + '%'; }, 80);
    });
  });
}

const aboutSection = document.getElementById('about');
const barObserver  = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) {
    animateBars();
    barObserver.unobserve(aboutSection);
  }
}, { threshold: 0.2 });
if (aboutSection) barObserver.observe(aboutSection);


/* ══════════════════════════════════════════
   9. MAP REVEAL EFFECT
   Elements fade+slide in as you scroll
   ══════════════════════════════════════════ */

const mapTargets = document.querySelectorAll(
  '.card, .skill-group, .timeline-item, .tl-card, .section-title, .about-intro, .skill-badge'
);

mapTargets.forEach(el => {
  el.classList.add('map-hidden');
  const siblings = Array.from(el.parentElement.children);
  const idx = siblings.indexOf(el);
  el.style.setProperty('--map-delay', `${idx * 0.09}s`);
});

const mapObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    const el = entry.target;
    if (entry.isIntersecting) {
      // Element enters view — reveal with stagger delay
      const delay = parseFloat(el.style.getPropertyValue('--map-delay') || '0') * 1000;
      setTimeout(() => {
        el.classList.remove('map-hidden');
        el.classList.add('map-revealed');
      }, delay);
    } else {
      // Element leaves view — reset so it re-animates on next scroll
      el.classList.remove('map-revealed');
      el.classList.add('map-hidden');
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

mapTargets.forEach(el => mapObserver.observe(el));


/* ── SVG Map Connector Lines ─────────────────
   Animated dashed lines between sections,
   like a treasure map route               */
function injectMapLines() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.id = 'map-lines';
  svg.style.cssText = `
    position:fixed; inset:0; width:100%; height:100%;
    pointer-events:none; z-index:1; overflow:visible;
  `;
  document.body.appendChild(svg);

  // Defs: gradient + glow filter
  const defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
  defs.innerHTML = `
    <linearGradient id="mapGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="#00f5a0" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#00d9f5" stop-opacity="0.3"/>
    </linearGradient>
    <filter id="mapGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  `;
  svg.appendChild(defs);

  const sectionIds = ['about','projects','contact'];

  // Create dots and lines
  sectionIds.forEach((id, i) => {
    const sec = document.getElementById(id);
    if (!sec) return;

    // Anchor dot
    const dot = document.createElementNS('http://www.w3.org/2000/svg','circle');
    dot.setAttribute('r','5');
    dot.setAttribute('fill','#00f5a0');
    dot.setAttribute('filter','url(#mapGlow)');
    dot.setAttribute('opacity','0');
    dot.dataset.sectionId = id;
    svg.appendChild(dot);

    // Connector line from previous dot
    if (i > 0) {
      const line = document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('stroke','url(#mapGrad)');
      line.setAttribute('stroke-width','1.5');
      line.setAttribute('stroke-dasharray','6 5');
      line.setAttribute('opacity','0');
      line.dataset.from = sectionIds[i-1];
      line.dataset.to   = id;
      svg.appendChild(line);
    }
  });

  function updateMapLines() {
    const dots  = svg.querySelectorAll('circle');
    const lines = svg.querySelectorAll('line');
    const dotMap = {};

    dots.forEach(dot => {
      const sec = document.getElementById(dot.dataset.sectionId);
      if (!sec) return;
      const title = sec.querySelector('.section-title');
      if (!title) return;
      const r = title.getBoundingClientRect();
      // Place dot to the left of the section title underline
      const x = r.left + 24;
      const y = r.top  + r.height + 10; // below the title text, near underline
      dot.setAttribute('cx', x);
      dot.setAttribute('cy', y);
      dotMap[dot.dataset.sectionId] = { x, y };

      const inView = r.top < window.innerHeight * 0.88 && r.bottom > 0;
      dot.style.transition = 'opacity .5s ease';
      dot.setAttribute('opacity', inView ? '1' : '0');
    });

    lines.forEach(line => {
      const from = dotMap[line.dataset.from];
      const to   = dotMap[line.dataset.to];
      if (!from || !to) return;

      line.setAttribute('x1', from.x); line.setAttribute('y1', from.y);
      line.setAttribute('x2', to.x);   line.setAttribute('y2', to.y);

      const fromDot = svg.querySelector(`circle[data-section-id="${line.dataset.from}"]`);
      const toDot   = svg.querySelector(`circle[data-section-id="${line.dataset.to}"]`);
      const fromVis = fromDot && parseFloat(fromDot.getAttribute('opacity')) > 0;
      const toVis   = toDot   && parseFloat(toDot.getAttribute('opacity'))   > 0;
      const bothVisible = fromVis && toVis;

      line.style.transition = 'opacity .8s ease';

      if (bothVisible) {
        line.setAttribute('opacity', '0.55');
        // Animate dash draw only once
        if (!line.dataset.drawn) {
          line.dataset.drawn = '1';
          const len = Math.hypot(to.x - from.x, to.y - from.y);
          line.setAttribute('stroke-dasharray', `${len}`);
          line.setAttribute('stroke-dashoffset', `${len}`);
          requestAnimationFrame(() => {
            line.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.16,1,.3,1), opacity .8s ease';
            line.setAttribute('stroke-dashoffset', '0');
          });
        }
      } else {
        line.setAttribute('opacity', '0');
      }
    });
  }

  window.addEventListener('scroll',  updateMapLines, { passive: true });
  window.addEventListener('resize',  updateMapLines);
  updateMapLines();
}

requestAnimationFrame(injectMapLines);


/* ══════════════════════════════════════════
   10. SCROLL PROGRESS BAR
   ══════════════════════════════════════════ */
const progressBar = document.createElement('div');
progressBar.id = 'scroll-progress';
document.body.appendChild(progressBar);

window.addEventListener('scroll', () => {
  const scrolled = window.scrollY;
  const total    = document.body.scrollHeight - window.innerHeight;
  const pct      = total > 0 ? (scrolled / total) * 100 : 0;
  progressBar.style.width = pct + '%';
}, { passive: true });