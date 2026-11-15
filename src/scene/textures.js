import * as THREE from 'three'

// All artwork is drawn in code on canvases, so the site ships no image files.
const cache = {}
function tex(key, w, h, draw, { srgb = true, repeat } = {}) {
  if (cache[key]) return cache[key]
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')
  draw(g, w, h)
  const t = new THREE.CanvasTexture(c)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(...repeat)
  }
  cache[key] = t
  return t
}

function rng(seed) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) / 2147483647)
}

// ---------- Vintage aviation posters ----------
function posterBase(g, w, h, title, sub) {
  const sky = g.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#1d2b4f')
  sky.addColorStop(0.55, '#c8664a')
  sky.addColorStop(1, '#f2b66b')
  g.fillStyle = sky
  g.fillRect(0, 0, w, h)
  // sun
  g.fillStyle = 'rgba(255, 226, 170, 0.9)'
  g.beginPath()
  g.arc(w * 0.72, h * 0.62, h * 0.2, 0, Math.PI * 2)
  g.fill()
  // clouds
  g.fillStyle = 'rgba(255,240,220,0.25)'
  for (let i = 0; i < 6; i++) {
    g.beginPath()
    g.ellipse(w * (0.1 + i * 0.17), h * (0.78 + (i % 2) * 0.05), w * 0.12, h * 0.03, 0, 0, Math.PI * 2)
    g.fill()
  }
  // paper border + type
  g.strokeStyle = '#f3e6cc'
  g.lineWidth = w * 0.025
  g.strokeRect(w * 0.03, h * 0.03, w * 0.94, h * 0.94)
  g.fillStyle = '#f3e6cc'
  g.font = `700 ${Math.round(h * 0.11)}px Georgia, serif`
  g.textAlign = 'left'
  g.fillText(title, w * 0.08, h * 0.2)
  g.font = `${Math.round(h * 0.045)}px Georgia, serif`
  g.fillText(sub, w * 0.08, h * 0.28)
}

// Top-down planform, drawn around (0,0), nose pointing to +x.
function jet(g, cx, cy, s, angle, forwardSwept) {
  g.save()
  g.translate(cx, cy)
  g.rotate(angle)
  g.scale(s, s)
  g.fillStyle = '#16203a'
  g.beginPath()
  // fuselage
  g.moveTo(1.0, 0)
  g.lineTo(0.55, -0.07)
  g.lineTo(-0.85, -0.1)
  g.lineTo(-0.95, -0.06)
  g.lineTo(-0.95, 0.06)
  g.lineTo(-0.85, 0.1)
  g.lineTo(0.55, 0.07)
  g.closePath()
  g.fill()
  // main wings
  g.beginPath()
  if (forwardSwept) {
    // Su-47: wings sweep forward
    g.moveTo(-0.35, -0.08); g.lineTo(0.15, -0.72); g.lineTo(0.3, -0.7); g.lineTo(0.05, -0.08)
    g.moveTo(-0.35, 0.08); g.lineTo(0.15, 0.72); g.lineTo(0.3, 0.7); g.lineTo(0.05, 0.08)
    // canards
    g.moveTo(0.4, -0.07); g.lineTo(0.3, -0.3); g.lineTo(0.38, -0.3); g.lineTo(0.55, -0.07)
    g.moveTo(0.4, 0.07); g.lineTo(0.3, 0.3); g.lineTo(0.38, 0.3); g.lineTo(0.55, 0.07)
  } else {
    // Su-57: swept delta-ish wings with LEVCONs
    g.moveTo(0.35, -0.09); g.lineTo(-0.45, -0.7); g.lineTo(-0.6, -0.7); g.lineTo(-0.55, -0.1)
    g.moveTo(0.35, 0.09); g.lineTo(-0.45, 0.7); g.lineTo(-0.6, 0.7); g.lineTo(-0.55, 0.1)
  }
  g.fill()
  // tail planes
  g.beginPath()
  g.moveTo(-0.62, -0.1); g.lineTo(-0.95, -0.38); g.lineTo(-1.02, -0.36); g.lineTo(-0.92, -0.1)
  g.moveTo(-0.62, 0.1); g.lineTo(-0.95, 0.38); g.lineTo(-1.02, 0.36); g.lineTo(-0.92, 0.1)
  g.fill()
  g.restore()
}

export const posterSu57 = () =>
  tex('su57', 512, 360, (g, w, h) => {
    posterBase(g, w, h, 'SU-57', 'FIFTH-GENERATION · SUKHOI')
    jet(g, w * 0.45, h * 0.6, h * 0.36, -0.35, false)
    jet(g, w * 0.8, h * 0.42, h * 0.16, -0.35, false)
  })

export const posterSu47 = () =>
  tex('su47', 512, 360, (g, w, h) => {
    posterBase(g, w, h, 'SU-47', 'BERKUT · FORWARD-SWEPT WING')
    jet(g, w * 0.48, h * 0.62, h * 0.38, -0.25, true)
  })

// ---------- Monitor screens ----------
export const codeScreen = () =>
  tex('code', 1024, 440, (g, w, h) => {
    g.fillStyle = '#1b1e2e'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#23273b'
    g.fillRect(0, 0, 180, h)
    g.fillRect(0, 0, w, 26)
    const r = rng(7)
    const cols = ['#e7a86a', '#8fc7ff', '#b8e39a', '#d79bd8', '#e6e1d2', '#7c84a3']
    for (let y = 44; y < h - 10; y += 17) {
      let x = 200 + Math.floor(r() * 4) * 24
      const n = 2 + Math.floor(r() * 5)
      g.fillStyle = '#4d5470'
      g.fillRect(186, y, 8, 8)
      for (let i = 0; i < n; i++) {
        const len = 30 + r() * 110
        g.fillStyle = cols[Math.floor(r() * cols.length)]
        g.fillRect(x, y, len, 8)
        x += len + 10
      }
    }
    // file tree
    for (let y = 44; y < h; y += 22) {
      g.fillStyle = r() > 0.7 ? '#e7a86a' : '#7c84a3'
      g.fillRect(18 + (r() > 0.6 ? 14 : 0), y, 60 + r() * 70, 8)
    }
    // terminal strip
    g.fillStyle = '#141624'
    g.fillRect(180, h - 110, w - 180, 110)
    g.fillStyle = '#7dff9a'
    g.fillRect(196, h - 90, 260, 8)
    g.fillStyle = '#8fc7ff'
    g.fillRect(196, h - 70, 420, 8)
  })

export const sideScreen = () =>
  tex('side', 360, 600, (g, w, h) => {
    g.fillStyle = '#1e1b2e'
    g.fillRect(0, 0, w, h)
    // a camera feed / detection view: the conveyor project
    g.fillStyle = '#2d3048'
    g.fillRect(16, 16, w - 32, 230)
    g.strokeStyle = '#7dff9a'
    g.lineWidth = 4
    g.strokeRect(60, 70, 110, 90)
    g.strokeStyle = '#ffb562'
    g.strokeRect(190, 110, 100, 100)
    g.fillStyle = '#7dff9a'
    g.fillRect(60, 56, 70, 14)
    g.fillStyle = '#ffb562'
    g.fillRect(190, 96, 64, 14)
    // chart
    g.strokeStyle = '#8fc7ff'
    g.lineWidth = 3
    g.beginPath()
    for (let i = 0; i <= 20; i++) {
      const x = 24 + i * ((w - 48) / 20)
      const y = 420 - Math.log(i + 1) * 45 - Math.sin(i) * 6
      i ? g.lineTo(x, y) : g.moveTo(x, y)
    }
    g.stroke()
    g.fillStyle = '#4d5470'
    for (let y = 460; y < h - 20; y += 22) g.fillRect(24, y, 120 + ((y * 7) % 150), 9)
  })

// ---------- Workshop ----------
export const pegboard = () =>
  tex('peg', 512, 512, (g, w, h) => {
    g.fillStyle = '#b98d62'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#5a3f2a'
    for (let y = 16; y < h; y += 32) for (let x = 16; x < w; x += 32) {
      g.beginPath()
      g.arc(x, y, 4, 0, Math.PI * 2)
      g.fill()
    }
  })

export const serverGrill = () =>
  tex('grill', 256, 64, (g, w, h) => {
    g.fillStyle = '#20232f'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#0d0f16'
    for (let y = 6; y < h; y += 9) for (let x = 6 + ((y / 9) % 2) * 4; x < w * 0.7; x += 8) {
      g.beginPath()
      g.arc(x, y, 2.4, 0, Math.PI * 2)
      g.fill()
    }
    g.fillStyle = '#3a3f55'
    g.fillRect(w * 0.75, 10, w * 0.2, h - 20)
  })

// ---------- City outside ----------
export function buildingWindows(seed) {
  return tex('bld' + seed, 128, 256, (g, w, h) => {
    g.fillStyle = '#0c1020'
    g.fillRect(0, 0, w, h)
    const r = rng(seed * 97 + 3)
    for (let y = 8; y < h - 4; y += 14) for (let x = 6; x < w - 6; x += 14) {
      const v = r()
      if (v > 0.78) {
        g.fillStyle = v > 0.93 ? '#a9c8ff' : v > 0.7 ? '#ffcf86' : '#e8a35c'
        g.globalAlpha = 0.55 + r() * 0.45
        g.fillRect(x, y, 8, 9)
        g.globalAlpha = 1
      } else {
        g.fillStyle = '#151a2e'
        g.fillRect(x, y, 8, 9)
      }
    }
  })
}

// ---------- Small things ----------
export const tabby = () =>
  tex('tabby', 256, 128, (g, w, h) => {
    g.fillStyle = '#b4b8c1'
    g.fillRect(0, 0, w, h)
    g.strokeStyle = '#7f838d'
    g.lineCap = 'round'
    for (let i = 0; i < 14; i++) {
      g.lineWidth = 5 + (i % 3) * 3
      const x = i * (w / 14) + 6
      g.beginPath()
      g.moveTo(x, 0)
      g.quadraticCurveTo(x + 10, h * 0.25, x - 4, h * 0.5)
      g.stroke()
    }
    // pale belly band
    const grad = g.createLinearGradient(0, h * 0.62, 0, h)
    grad.addColorStop(0, 'rgba(236,237,241,0)')
    grad.addColorStop(0.35, 'rgba(236,237,241,1)')
    g.fillStyle = grad
    g.fillRect(0, h * 0.62, w, h * 0.38)
  })

export const basketball = () =>
  tex('bball', 256, 128, (g, w, h) => {
    g.fillStyle = '#d9692e'
    g.fillRect(0, 0, w, h)
    g.strokeStyle = '#2b1a12'
    g.lineWidth = 3
    g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke()
    ;[0.25, 0.75].forEach((f) => { g.beginPath(); g.moveTo(w * f, 0); g.lineTo(w * f, h); g.stroke() })
    ;[0, 0.5].forEach((f) => {
      g.beginPath()
      g.ellipse(w * (f + 0.25), h / 2, w * 0.14, h * 0.5, 0, 0, Math.PI * 2)
      g.stroke()
    })
  })

export const bias = () =>
  tex('bias', 256, 128, (g, w, h) => {
    const r = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2)
    r.addColorStop(0, 'rgba(255,255,255,0.9)')
    r.addColorStop(0.5, 'rgba(255,255,255,0.35)')
    r.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = r
    g.fillRect(0, 0, w, h)
  })

export const corkNotes = () =>
  tex('cork', 512, 360, (g, w, h) => {
    g.fillStyle = '#c99c6e'
    g.fillRect(0, 0, w, h)
    const r = rng(11)
    for (let i = 0; i < 900; i++) {
      g.fillStyle = r() > 0.5 ? 'rgba(120,80,50,0.25)' : 'rgba(240,210,170,0.25)'
      g.fillRect(r() * w, r() * h, 2, 2)
    }
    const notes = [
      [40, 40, '#ffe07a', 'ship it'],
      [190, 30, '#a8dcff', 'su-57 ✈'],
      [340, 50, '#ffb3d1', 'drone v1'],
      [60, 200, '#c4f0c8', 'no GPS?'],
      [210, 190, '#fff7e8', 'CSAW 3rd'],
      [360, 210, '#ffe07a', 'sleep'],
    ]
    notes.forEach(([x, y, col, text], i) => {
      g.save()
      g.translate(x + 55, y + 55)
      g.rotate(((i % 3) - 1) * 0.08)
      g.fillStyle = 'rgba(0,0,0,0.18)'
      g.fillRect(-52, -50, 110, 110)
      g.fillStyle = col
      g.fillRect(-55, -55, 110, 110)
      g.fillStyle = '#3a3340'
      g.font = '24px "Comic Sans MS", "Segoe Print", cursive'
      g.textAlign = 'center'
      g.fillText(text, 0, 8)
      g.fillStyle = '#d9534f'
      g.beginPath()
      g.arc(0, -42, 7, 0, Math.PI * 2)
      g.fill()
      g.restore()
    })
  })

// ---------- Jet posters built from the attached photos ----------
// The photo is painted into a vintage aviation poster: warm sky wash, paper border, title.
export function photoPoster(key, url, title, sub) {
  if (cache[key]) return cache[key]
  const c = document.createElement('canvas')
  c.width = 600
  c.height = 800
  const g = c.getContext('2d')
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  cache[key] = t
  const draw = (img) => {
    const w = c.width, h = c.height
    g.fillStyle = '#f1e4c8'
    g.fillRect(0, 0, w, h)
    const ix = 36, iy = 120, iw = w - 72, ih = h - 250
    if (img) {
      const s = Math.max(iw / img.width, ih / img.height)
      const dw = img.width * s, dh = img.height * s
      g.save()
      g.beginPath()
      g.rect(ix, iy, iw, ih)
      g.clip()
      g.filter = 'saturate(0.8) contrast(1.05)'
      g.drawImage(img, ix + (iw - dw) / 2, iy + (ih - dh) / 2, dw, dh)
      g.filter = 'none'
      // dusk wash over the photo, like an old lithograph
      const wash = g.createLinearGradient(0, iy, 0, iy + ih)
      wash.addColorStop(0, 'rgba(36, 52, 98, 0.35)')
      wash.addColorStop(0.6, 'rgba(214, 120, 74, 0.18)')
      wash.addColorStop(1, 'rgba(242, 182, 107, 0.35)')
      g.fillStyle = wash
      g.fillRect(ix, iy, iw, ih)
      g.restore()
    }
    g.strokeStyle = '#2a2420'
    g.lineWidth = 4
    g.strokeRect(ix, iy, iw, ih)
    g.fillStyle = '#2a2420'
    g.font = '700 84px Georgia, serif'
    g.textAlign = 'left'
    g.fillText(title, 36, 96)
    g.font = '24px Georgia, serif'
    g.fillText(sub, 40, h - 92)
    g.fillStyle = '#b8483a'
    g.fillRect(40, h - 70, 120, 6)
    g.font = '18px Georgia, serif'
    g.fillStyle = '#5a4c40'
    g.fillText('SUKHOI · AIR DOMINANCE', 40, h - 36)
    t.needsUpdate = true
  }
  draw(null)
  const img = new Image()
  img.onload = () => draw(img)
  img.src = url
  return t
}

// ---------- Engineering blueprints ----------
function bpBase(g, w, h, title, dwg) {
  g.fillStyle = '#1f4f8f'
  g.fillRect(0, 0, w, h)
  g.strokeStyle = 'rgba(255,255,255,0.12)'
  g.lineWidth = 1
  for (let x = 0; x < w; x += 20) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke() }
  for (let y = 0; y < h; y += 20) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke() }
  g.strokeStyle = '#e9f1ff'
  g.lineWidth = 3
  g.strokeRect(10, 10, w - 20, h - 20)
  // title block
  g.strokeRect(w - 210, h - 70, 200, 60)
  g.font = '15px "Courier New", monospace'
  g.fillStyle = '#e9f1ff'
  g.fillText(title, w - 200, h - 46)
  g.fillText(dwg + '  ·  H. ALCHARIF', w - 200, h - 24)
  g.lineWidth = 2
}
function dim(g, x1, y1, x2, y2, label) {
  g.save()
  g.lineWidth = 1
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke()
  g.font = '12px "Courier New", monospace'
  g.fillText(label, (x1 + x2) / 2 + 4, (y1 + y2) / 2 - 4)
  g.restore()
}

export const blueprintDrone = () =>
  tex('bp-drone', 512, 384, (g, w, h) => {
    bpBase(g, w, h, 'QUAD FRAME 250', 'DWG-01')
    const cx = 210, cy = 180
    g.beginPath()
    g.rect(cx - 30, cy - 40, 60, 80)
    g.stroke()
    ;[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
      g.beginPath(); g.moveTo(cx + sx * 20, cy + sy * 25); g.lineTo(cx + sx * 110, cy + sy * 110); g.stroke()
      g.beginPath(); g.arc(cx + sx * 110, cy + sy * 110, 48, 0, Math.PI * 2); g.stroke()
      g.beginPath(); g.arc(cx + sx * 110, cy + sy * 110, 10, 0, Math.PI * 2); g.stroke()
    })
    dim(g, cx - 110, 345, cx + 110, 345, '250 mm')
    g.font = '14px "Courier New", monospace'
    g.fillText('NO GPS: VIO + IMU', 380, 60)
    g.fillText('FC / ESC STACK', 380, 82)
  })

export const blueprintArm = () =>
  tex('bp-arm', 512, 384, (g, w, h) => {
    bpBase(g, w, h, '5-DOF ARM / IK', 'DWG-02')
    const pts = [[120, 320], [150, 200], [280, 150], [370, 200], [400, 240]]
    g.beginPath(); g.rect(80, 320, 90, 26); g.stroke()
    for (let i = 0; i < pts.length - 1; i++) {
      g.beginPath(); g.moveTo(...pts[i]); g.lineTo(...pts[i + 1]); g.stroke()
    }
    pts.forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.stroke() })
    g.setLineDash([6, 6])
    g.beginPath(); g.arc(150, 200, 70, -1.2, 0.2); g.stroke()
    g.setLineDash([])
    g.font = '14px "Courier New", monospace'
    g.fillText('θ1..θ5', 250, 110)
    g.fillText('x = f(θ)', 60, 60)
  })

export const blueprintCircuit = () =>
  tex('bp-circuit', 512, 384, (g, w, h) => {
    bpBase(g, w, h, 'SENSOR BOARD', 'DWG-03')
    g.beginPath(); g.rect(200, 120, 110, 140); g.stroke()
    g.font = '14px "Courier New", monospace'
    g.fillText('JETSON', 222, 195)
    for (let i = 0; i < 6; i++) {
      g.beginPath(); g.moveTo(200, 135 + i * 22); g.lineTo(120, 135 + i * 22); g.stroke()
      g.beginPath(); g.moveTo(310, 135 + i * 22); g.lineTo(390, 135 + i * 22); g.stroke()
    }
    // resistor zig-zags + capacitor
    g.beginPath()
    let x = 60
    g.moveTo(x, 100)
    for (let i = 0; i < 6; i++) g.lineTo((x += 8), 100 + (i % 2 ? 10 : -10))
    g.stroke()
    g.beginPath(); g.moveTo(420, 80); g.lineTo(420, 110); g.moveTo(432, 80); g.lineTo(432, 110); g.stroke()
    g.fillText('AS7265x · IR · IND', 60, 320)
  })

export const blueprintConveyor = () =>
  tex('bp-conv', 512, 384, (g, w, h) => {
    bpBase(g, w, h, 'SORTING CONVEYOR', 'DWG-04')
    g.beginPath(); g.arc(90, 220, 30, 0, Math.PI * 2); g.stroke()
    g.beginPath(); g.arc(420, 220, 30, 0, Math.PI * 2); g.stroke()
    g.beginPath(); g.moveTo(90, 190); g.lineTo(420, 190); g.moveTo(90, 250); g.lineTo(420, 250); g.stroke()
    g.beginPath(); g.rect(220, 90, 70, 50); g.stroke()
    g.beginPath(); g.moveTo(255, 140); g.lineTo(225, 188); g.moveTo(255, 140); g.lineTo(285, 188); g.stroke()
    ;[150, 300, 360].forEach((bx) => { g.beginPath(); g.rect(bx, 280, 40, 40); g.stroke() })
    g.font = '14px "Courier New", monospace'
    g.fillText('CAM + SPECTRAL', 300, 80)
    g.fillText('3 → 11 CLASSES', 40, 60)
  })

export const plaid = () =>
  tex('plaid', 256, 256, (g, w, h) => {
    g.fillStyle = '#b5523f'
    g.fillRect(0, 0, w, h)
    const band = (c, a, horiz, pos, size) => {
      g.fillStyle = c
      g.globalAlpha = a
      horiz ? g.fillRect(0, pos, w, size) : g.fillRect(pos, 0, size, h)
      g.globalAlpha = 1
    }
    ;[0, 128].forEach((o) => {
      band('#f1e4c8', 0.55, true, o + 20, 26); band('#f1e4c8', 0.55, false, o + 20, 26)
      band('#3a2a2a', 0.35, true, o + 70, 12); band('#3a2a2a', 0.35, false, o + 70, 12)
      band('#e9b25e', 0.5, true, o + 100, 4); band('#e9b25e', 0.5, false, o + 100, 4)
    })
  }, { repeat: [2, 2] })
