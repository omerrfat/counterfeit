import gsap from 'gsap';

// The torch: a radial cut-out in a full-screen darkness layer, plus dust motes
// that live under it so they are only visible where the beam touches.
export class Beam {
  constructor(darkEl, canvas, { reduced = false, maskEls = [] } = {}) {
    this.darkEl = darkEl;
    this.maskEls = maskEls;
    this.r = 200;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.reduced = reduced;
    this.s = { x: innerWidth * 0.5, y: innerHeight * 0.45, dark: 1, flick: 0, boost: 0 };
    this.battery = 1;
    this.maxR = 210;
    this.minR = 54;
    this.qx = gsap.quickTo(this.s, 'x', { duration: 0.5, ease: 'power3.out' });
    this.qy = gsap.quickTo(this.s, 'y', { duration: 0.5, ease: 'power3.out' });
    this.motes = Array.from({ length: reduced ? 0 : 120 }, () => this.mote(true));
    this.resize();
    addEventListener('resize', () => this.resize());
    gsap.ticker.add((t, dt) => this.tick(t, dt));
  }

  mote(initial) {
    return {
      x: Math.random() * innerWidth,
      y: initial ? Math.random() * innerHeight : innerHeight + 10,
      z: 0.3 + Math.random() * 0.7,
      ph: Math.random() * 6.28,
      vy: -(4 + Math.random() * 9),
    };
  }

  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = innerWidth * dpr;
    this.canvas.height = innerHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  aim(x, y) { this.qx(x); this.qy(y); }

  radius() {
    const b = Math.pow(this.battery, 0.6);
    return (this.minR + (this.maxR - this.minR) * b) * this.s.flick * (1 + this.s.boost) * Math.min(1, innerWidth / 520 + 0.55);
  }

  // Quick stutters, like a bulb that's not quite making contact.
  flicker(times = 4) {
    if (this.reduced) { this.s.flick = 1; return gsap.timeline(); }
    const tl = gsap.timeline();
    for (let i = 0; i < times; i++) {
      tl.to(this.s, { flick: gsap.utils.random(0.05, 0.35), duration: 0.04 })
        .to(this.s, { flick: gsap.utils.random(0.6, 1), duration: 0.05 })
        .to({}, { duration: gsap.utils.random(0.02, 0.12) });
    }
    return tl.to(this.s, { flick: 1, duration: 0.08 });
  }

  pulse() {
    gsap.fromTo(this.s, { boost: 0.35 }, { boost: 0, duration: 0.5, ease: 'power3.out' });
  }

  tick(time, dt) {
    const s = this.s;
    if (this.battery < 0.22 && !this.reduced && s.flick > 0.9 && Math.random() < 0.025 * (1 - this.battery * 4)) {
      s.flick = 0.4;
      gsap.to(s, { flick: 1, duration: 0.14, ease: 'none' });
    }
    const r = Math.max(8, this.radius());
    const d = s.dark;
    this.r = r;
    const el = this.darkEl;
    el.style.setProperty('--bx', s.x.toFixed(1) + 'px');
    el.style.setProperty('--by', s.y.toFixed(1) + 'px');
    el.style.setProperty('--br', r.toFixed(1) + 'px');
    el.style.setProperty('--dark', d.toFixed(3));
    this.applyMask(r, d);
    this.draw(dt / 1000, r);
  }

  // The torch is also a mask: everything on the stage fades out beyond the beam,
  // so the 3D hall behind it shows through the gaps.
  applyMask(r, d) {
    const floor = 0.05 + (1 - d) * 0.95;
    let image = 'none';
    if (floor < 0.995) {
      const mid = (1 + floor) / 2;
      image = `radial-gradient(circle ${r.toFixed(1)}px at ${this.s.x.toFixed(1)}px ${this.s.y.toFixed(1)}px, #000 0%, #000 34%, rgba(0,0,0,${mid.toFixed(3)}) 68%, rgba(0,0,0,${floor.toFixed(3)}) 100%)`;
    }
    for (const m of this.maskEls) { m.style.maskImage = image; m.style.webkitMaskImage = image; }
  }

  draw(dt, r) {
    const { ctx, s } = this;
    if (!this.motes.length) return;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    const lit = s.dark < 0.5;
    const cull = r * 1.25;
    const t = performance.now() / 1000;
    for (const m of this.motes) {
      m.y += m.vy * m.z * dt;
      m.x += Math.sin(t * 0.4 + m.ph) * 6 * m.z * dt;
      if (m.y < -10) { m.y = innerHeight + 10; m.x = Math.random() * innerWidth; }
      const dx = m.x - s.x, dy = m.y - s.y;
      let a;
      if (lit) a = 0.18 * m.z;
      else {
        const dist = Math.hypot(dx, dy);
        if (dist > cull) continue;
        a = (1 - dist / cull) * (0.35 + 0.5 * m.z);
      }
      ctx.globalAlpha = a;
      ctx.fillStyle = '#ffe2ae';
      ctx.beginPath();
      ctx.arc(m.x, m.y, 0.6 + m.z * 1.1, 0, 6.283);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
