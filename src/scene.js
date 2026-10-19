import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// A procedural marble floor: alternating light/dark flags with veining.
function marbleTexture() {
  const size = 1024, n = 8, s = size / n;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const light = (x + y) % 2 === 0;
      g.fillStyle = light ? '#d8d2c2' : '#1f2d2a';
      g.fillRect(x * s, y * s, s, s);
      g.save();
      g.beginPath(); g.rect(x * s, y * s, s, s); g.clip();
      for (let v = 0; v < 5; v++) {
        g.strokeStyle = light ? `rgba(90,86,76,${0.12 + Math.random() * 0.16})` : `rgba(150,170,160,${0.05 + Math.random() * 0.08})`;
        g.lineWidth = 0.6 + Math.random() * 1.6;
        g.beginPath();
        let px = x * s + Math.random() * s, py = y * s;
        g.moveTo(px, py);
        for (let k = 0; k < 6; k++) {
          px += (Math.random() - 0.5) * s * 0.5; py += s / 5 + Math.random() * 10;
          g.lineTo(px, py);
        }
        g.stroke();
      }
      g.restore();
    }
  }
  g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 3;
  for (let i = 0; i <= n; i++) {
    g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, size); g.stroke();
    g.beginPath(); g.moveTo(0, i * s); g.lineTo(size, i * s); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

function softRectTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 6, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function archShape(w, h, r) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h - r);
  s.absarc(0, h - r, w / 2, 0, Math.PI, false);
  s.lineTo(-w / 2, 0);
  return s;
}

export class Gallery3D {
  static create(canvas, opts) {
    try { return new Gallery3D(canvas, opts); } catch (e) { console.warn('WebGL scene unavailable', e); return null; }
  }

  constructor(canvas, { reduced = false } = {}) {
    this.reduced = reduced;
    this.t = 0;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x040b0a);
    this.scene.fog = new THREE.FogExp2(0x050e0d, 0.055);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.05;

    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 80);
    this.base = new THREE.Vector3(0, 1.65, 9);
    this.look = new THREE.Vector3(0, 2.3, -12);
    this.rig = { x: 0, y: 0, z: 3.4, fov: 0, roll: 0 };   // eased by gsap
    this.pointer = { x: 0, y: 0, sx: 0, sy: 0 };

    this.mats = {
      marble: new THREE.MeshStandardMaterial({ color: 0xe7e1d2, roughness: 0.38, metalness: 0.02 }),
      stone: new THREE.MeshStandardMaterial({ color: 0x24403a, roughness: 0.85 }),
      dark: new THREE.MeshStandardMaterial({ color: 0x0f1d1a, roughness: 0.9 }),
      brass: new THREE.MeshStandardMaterial({ color: 0xc9a55a, roughness: 0.32, metalness: 0.95 }),
      velvet: new THREE.MeshStandardMaterial({ color: 0x7a1420, roughness: 0.95 }),
      window: new THREE.MeshBasicMaterial({ color: 0x4d78ad, fog: false }),
    };

    this.buildFloorAndShell();
    this.buildColumns();
    this.buildSculpture();
    this.buildRopes();
    this.buildWindows();
    this.buildChandelier();
    this.buildLights();

    this.ray = new THREE.Raycaster();
    this.hit = new THREE.Vector3(0, 1.5, -10);
    this.ndc = new THREE.Vector2();
    this.resize();
    addEventListener('resize', () => this.resize());
  }

  add(mesh, { cast = true, receive = true } = {}) {
    mesh.castShadow = cast; mesh.receiveShadow = receive;
    this.scene.add(mesh);
    return mesh;
  }

  buildFloorAndShell() {
    const tex = marbleTexture();
    tex.repeat.set(2.4, 7);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 40), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3, metalness: 0.04 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -12);
    this.add(floor, { cast: false });

    const wallMat = this.mats.stone;
    const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), wallMat);
    back.position.set(0, 5, -26); this.add(back, { cast: false });
    const left = new THREE.Mesh(new THREE.PlaneGeometry(40, 10), wallMat);
    left.rotation.y = Math.PI / 2; left.position.set(-6.8, 5, -12); this.add(left, { cast: false });
    const right = left.clone(); right.rotation.y = -Math.PI / 2; right.position.x = 6.8; this.add(right, { cast: false });
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(14, 40), this.mats.dark);
    ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 9.2, -12); this.add(ceil, { cast: false });
    this.hitTargets = [floor, back, left, right, ceil];

    // wainscot and rails along the side walls
    for (const sx of [-1, 1]) {
      const dado = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.5, 40), this.mats.dark);
      dado.position.set(sx * 6.7, 0.75, -12); this.add(dado);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 40), this.mats.brass);
      rail.position.set(sx * 6.66, 1.55, -12); this.add(rail, { cast: false });
      const cornice = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 40), this.mats.marble);
      cornice.position.set(sx * 6.6, 8.9, -12); this.add(cornice, { cast: false });
    }
    // ceiling cross-beams
    for (let z = 4; z > -17; z -= 4.5) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(13.6, 0.45, 0.5), this.mats.marble);
      beam.position.set(0, 8.95, z); this.add(beam, { cast: false });
    }
  }

  column(h = 8) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.8, 0.45, 24), this.mats.marble);
    base.position.y = 0.22;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.55, h - 1.2, 20, 1), this.mats.marble);
    shaft.geometry.computeVertexNormals();
    shaft.material = this.mats.marble.clone(); shaft.material.flatShading = true;
    shaft.position.y = (h - 1.2) / 2 + 0.45;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 10, 28), this.mats.marble);
    ring.rotation.x = Math.PI / 2; ring.position.y = h - 0.7;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.5, 0.4, 20), this.mats.marble);
    cap.position.y = h - 0.5;
    const abacus = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.22, 1.5), this.mats.marble);
    abacus.position.y = h - 0.2;
    g.add(base, shaft, ring, cap, abacus);
    g.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    return g;
  }

  buildColumns() {
    for (let z = -0.5; z > -17; z -= 4.6) {
      for (const sx of [-1, 1]) {
        const c = this.column(8.7);
        c.position.set(sx * 4.7, 0, z);
        this.scene.add(c);
      }
    }
  }

  urn() {
    const pts = [[0, 0], [0.34, 0], [0.4, 0.04], [0.22, 0.14], [0.2, 0.3], [0.5, 0.62], [0.58, 0.95], [0.46, 1.25], [0.22, 1.42], [0.26, 1.55], [0.42, 1.62], [0.4, 1.68], [0.2, 1.66]]
      .map(([x, y]) => new THREE.Vector2(x, y));
    const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 36), this.mats.marble);
    const g = new THREE.Group();
    g.add(body);
    for (const s of [-1, 1]) {
      const h = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 8, 20, Math.PI * 1.1), this.mats.brass);
      h.position.set(s * 0.36, 1.2, 0); h.rotation.z = s > 0 ? -Math.PI * 0.55 : Math.PI * 1.55 - Math.PI; h.rotation.y = 0;
      g.add(h);
    }
    return g;
  }

  pedestal(h = 1.2) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.16, 1.1), this.mats.marble);
    base.position.y = 0.08;
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.86, h, 0.86), this.mats.marble);
    col.position.y = 0.16 + h / 2;
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.14, 1.0), this.mats.marble);
    top.position.y = 0.16 + h + 0.07;
    g.add(base, col, top);
    g.userData.top = 0.16 + h + 0.14;
    return g;
  }

  // A faceless marble bust. The blank face is the point.
  bust() {
    const g = new THREE.Group();
    const shoulders = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.42, 0], [0.5, 0.1], [0.46, 0.3], [0.26, 0.46], [0.16, 0.56], [0, 0.58]].map(([x, y]) => new THREE.Vector2(x, y)), 28), this.mats.marble);
    shoulders.scale.set(1.2, 1, 0.8);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.3, 16), this.mats.marble);
    neck.position.y = 0.66;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 28, 20), this.mats.marble);
    head.scale.set(0.9, 1.15, 1); head.position.y = 0.98;
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 10), this.mats.marble);
    nose.rotation.x = Math.PI / 2; nose.position.set(0, 0.96, 0.25);
    g.add(shoulders, neck, head, nose);
    g.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    return g;
  }

  buildSculpture() {
    // urns on pedestals between the columns
    for (let z = 0.7; z > -22; z -= 4.6) {
      for (const sx of [-1, 1]) {
        const p = this.pedestal(1.1);
        p.position.set(sx * 5.9, 0, z);
        const u = this.urn(); u.position.set(sx * 5.9, p.userData.top, z); u.scale.setScalar(0.95);
        this.scene.add(p, u);
        p.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
        u.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      }
    }
    // busts flanking the far wall
    for (const sx of [-1, 1]) {
      const p = this.pedestal(1.35); p.position.set(sx * 2.8, 0, -23.6);
      const b = this.bust(); b.position.set(sx * 2.8, p.userData.top, -23.6); b.rotation.y = -sx * 0.35; b.scale.setScalar(1.5);
      this.scene.add(p, b);
      p.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    }
    // a doorway at the far end: a warm glow to walk toward
    const door = new THREE.Mesh(new THREE.ShapeGeometry(archShape(3.4, 7, 1.7)), new THREE.MeshBasicMaterial({ color: 0x9a7640, fog: false }));
    door.position.set(0, 0, -25.9);
    this.scene.add(door);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.14, 10, 32, Math.PI), this.mats.brass);
    arch.position.set(0, 5.3, -25.85);
    this.scene.add(arch);
    this.frame = door;
  }

  buildRopes() {
    const poles = [];
    for (const sx of [-1, 1]) {
      for (let z = 2; z > -19; z -= 3) {
        const g = new THREE.Group();
        const baseM = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.05, 20), this.mats.brass);
        baseM.position.y = 0.025;
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.95, 12), this.mats.brass);
        pole.position.y = 0.5;
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), this.mats.brass);
        ball.position.y = 1.0;
        g.add(baseM, pole, ball);
        g.position.set(sx * 2.5, 0, z);
        g.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
        this.scene.add(g);
        poles.push({ sx, z });
      }
    }
    for (const sx of [-1, 1]) {
      const row = poles.filter((p) => p.sx === sx);
      for (let i = 0; i < row.length - 1; i++) {
        const a = new THREE.Vector3(sx * 2.5, 0.92, row[i].z), b = new THREE.Vector3(sx * 2.5, 0.92, row[i + 1].z);
        const mid = a.clone().lerp(b, 0.5); mid.y -= 0.22;
        const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
        const rope = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.035, 8), this.mats.velvet);
        rope.castShadow = true;
        this.scene.add(rope);
      }
    }
  }

  buildWindows() {
    const shapeGeo = new THREE.ShapeGeometry(archShape(2.2, 5.6, 1.1));
    const soft = softRectTexture();
    this.patches = [];
    for (let z = 0.7; z > -22; z -= 4.6) {
      for (const sx of [-1, 1]) {
        const w = new THREE.Mesh(shapeGeo, this.mats.window);
        w.rotation.y = -sx * Math.PI / 2; w.position.set(sx * 6.67, 2.2, z);
        this.scene.add(w);
        const mull = new THREE.Mesh(new THREE.BoxGeometry(0.06, 5, 0.06), this.mats.brass);
        mull.position.set(sx * 6.62, 4.6, z); this.scene.add(mull);
        const cross = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 2.1), this.mats.brass);
        cross.position.set(sx * 6.62, 5.4, z); this.scene.add(cross);
        // a pool of moonlight on the floor
        const patch = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 5.2), new THREE.MeshBasicMaterial({ map: soft, color: 0x5d89c0, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false }));
        patch.rotation.x = -Math.PI / 2; patch.rotation.z = 0; patch.position.set(sx * 4.1, 0.02, z);
        this.scene.add(patch);
        this.patches.push(patch);
      }
    }
  }

  buildChandelier() {
    const g = new THREE.Group();
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.4, 6), this.mats.brass);
    chain.position.y = 1.2;
    g.add(chain);
    this.bulbs = [];
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4 + i * 0.4, 0.025, 8, 36), this.mats.brass);
      ring.rotation.x = Math.PI / 2; ring.position.y = -0.1 - i * 0.28;
      g.add(ring);
      const n = 6 + i * 4;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshStandardMaterial({ color: 0xfff1c9, emissive: 0xffc980, emissiveIntensity: 0 }));
        bulb.position.set(Math.cos(a) * (0.4 + i * 0.4), -0.04 - i * 0.28, Math.sin(a) * (0.4 + i * 0.4));
        g.add(bulb); this.bulbs.push(bulb);
      }
    }
    g.position.set(0, 7.2, -3);
    this.scene.add(g);
    this.chandelier = g;
    this.chandLight = new THREE.PointLight(0xffd29a, 0, 26, 1.6);
    this.chandLight.position.set(0, 6.4, -3);
    this.scene.add(this.chandLight);
  }

  buildLights() {
    this.hemi = new THREE.HemisphereLight(0x4a6f93, 0x1b2c26, 0.13);
    this.scene.add(this.hemi);
    this.spot = new THREE.SpotLight(0xffe0a8, 30, 0, 0.3, 0.9, 0);
    this.spot.castShadow = true;
    this.spot.shadow.mapSize.set(1024, 1024);
    this.spot.shadow.bias = -0.0005;
    this.spot.shadow.camera.near = 0.5; this.spot.shadow.camera.far = 40;
    this.scene.add(this.spot, this.spot.target);
    this.glow = new THREE.PointLight(0xffd6a0, 6, 14, 1.4);
    this.scene.add(this.glow);
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.aspect = w / h;
    this.camera.aspect = this.aspect;
    this.baseFov = this.aspect < 1.2 ? 50 + (1.2 - this.aspect) * 38 : 50;
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();
  }

  // Normalised pointer position, -1..1.
  lean(nx, ny) { this.pointer.x = nx; this.pointer.y = ny; }

  dolly() {
    if (this.reduced) { this.rig.z = 0; return; }
    gsap.to(this.rig, { z: 0, duration: 2.6, ease: 'expo.out' });
  }
  settleIn() { this.rig.z = this.reduced ? 0 : 3.4; }

  // A stamp landing shakes the room a little.
  punch(weight = 1) {
    if (this.reduced) return;
    gsap.timeline()
      .to(this.rig, { fov: -1.6 * weight, y: -0.05 * weight, duration: 0.05, ease: 'power2.out' })
      .to(this.rig, { fov: 0, y: 0, duration: 0.6, ease: 'elastic.out(1.2, 0.4)' });
  }

  craneUp() {
    if (this.reduced) { this.rig.y = 0.5; return; }
    gsap.to(this.rig, { y: 0.55, z: -0.8, duration: 3.2, ease: 'power2.inOut' });
  }

  update(dt, b, time) {
    this.t += dt;
    const lit = clamp(1 - b.dark, 0, 1);
    const t = this.t;

    // eased pointer parallax, plus a slow breathing sway
    const p = this.pointer;
    p.sx = lerp(p.sx, p.x, 1 - Math.exp(-dt * 3));
    p.sy = lerp(p.sy, p.y, 1 - Math.exp(-dt * 3));
    const sway = this.reduced ? 0 : 1;
    this.camera.position.set(
      this.base.x + this.rig.x + p.sx * 0.55 * sway + Math.sin(t * 0.35) * 0.06 * sway,
      this.base.y + this.rig.y - p.sy * 0.18 * sway + Math.sin(t * 0.5) * 0.03 * sway,
      this.base.z + this.rig.z,
    );
    this.camera.lookAt(this.look.x + p.sx * 0.9 * sway, this.look.y - p.sy * 0.4 * sway, this.look.z);
    const fov = this.baseFov + this.rig.fov;
    if (Math.abs(this.camera.fov - fov) > 0.001) { this.camera.fov = fov; this.camera.updateProjectionMatrix(); }

    // the torch: a spotlight from the camera aimed through the screen-space beam
    this.ndc.set((b.x / innerWidth) * 2 - 1, -((b.y / innerHeight) * 2 - 1));
    this.ray.setFromCamera(this.ndc, this.camera);
    const hits = this.ray.intersectObjects(this.hitTargets, false);
    if (hits.length) this.hit.copy(hits[0].point); else this.ray.ray.at(16, this.hit);

    const half = Math.atan((b.r / (innerHeight / 2)) * Math.tan((this.camera.fov * Math.PI) / 360));
    this.spot.angle = clamp(half * 1.05, 0.05, 1.0);
    this.spot.position.copy(this.camera.position).add(new THREE.Vector3(0.35, -0.25, 0.4));
    this.spot.target.position.copy(this.hit);
    this.spot.intensity = 95 * b.flick * (1 - lit * 0.9);
    this.glow.position.copy(this.hit).lerp(this.camera.position, 0.08);
    this.glow.position.y = Math.max(this.glow.position.y, 0.8);
    this.glow.intensity = 10 * b.flick * (1 - lit);

    // lights on: the room fills with warm light and the chandelier wakes
    this.hemi.intensity = lerp(0.13, 1.7, lit);
    this.scene.environmentIntensity = lerp(0.05, 0.85, lit);
    this.scene.fog.density = lerp(0.055, 0.018, lit);
    this.renderer.toneMappingExposure = lerp(1.05, 1.15, lit);
    this.chandLight.intensity = 70 * lit;
    for (const bulb of this.bulbs) bulb.material.emissiveIntensity = 2.4 * lit;
    if (!this.reduced) {
      this.chandelier.rotation.z = Math.sin(t * 0.7) * 0.03;
      this.chandelier.rotation.x = Math.cos(t * 0.55) * 0.025;
      this.chandelier.rotation.y = t * 0.08;
    }
    for (const patch of this.patches) patch.material.opacity = 0.32 * (1 - lit * 0.6);

    this.renderer.render(this.scene, this.camera);
  }
}
