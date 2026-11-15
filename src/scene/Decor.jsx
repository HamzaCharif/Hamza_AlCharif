import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { B, Glow, Hotspot, Limb, Model, Pill, Toon } from './parts'
import { basketball, corkNotes, photoPoster, blueprintDrone, blueprintArm, blueprintCircuit, blueprintConveyor } from './textures'
import { Strip, RGBLight, rgbAt } from './Setup'
import Cat from './Cat'

const WOOD = '#9a6640'
const WOOD_DARK = '#5e3d29'
const CREAM = '#e8dcc3'
const INK = '#262836'

// ---------- Window: frame, deep seat with cushion, cat, a plant and books ----------
export function WindowFrame({ x0 = 1.3, x1 = 3.3, y0 = 0.95, y1 = 2.65, z = -4.5 }) {
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  const w = x1 - x0
  const h = y1 - y0
  const left = useRef()
  const right = useRef()
  useFrame(({ clock }) => {
    const s = Math.sin(clock.elapsedTime * 0.5) * 0.012
    left.current.rotation.z = s
    right.current.rotation.z = -s
  })
  return (
    <group>
      <B p={[cx, y0, z]} s={[w + 0.16, 0.09, 0.18]} c={CREAM} />
      <B p={[cx, y1, z]} s={[w + 0.16, 0.09, 0.18]} c={CREAM} />
      <B p={[x0, cy, z]} s={[0.09, h, 0.18]} c={CREAM} />
      <B p={[x1, cy, z]} s={[0.09, h, 0.18]} c={CREAM} />
      <B p={[cx, cy, z - 0.01]} s={[0.05, h, 0.06]} c={CREAM} />
      <B p={[cx, cy + 0.15, z - 0.01]} s={[w, 0.04, 0.06]} c={CREAM} />
      {/* window seat + one long cushion */}
      <B p={[cx, y0 - 0.02, z + 0.25]} s={[w + 0.3, 0.08, 0.55]} c={CREAM} />
      <B p={[cx, y0 + 0.055, z + 0.25]} s={[w - 0.06, 0.07, 0.48]} c="#6f86b3" rad={0.035} />
      <Cat position={[cx + 0.25, y0 + 0.17, z + 0.27]} rotation={[0, -0.4, 0]} />
      {/* small plant + two books at the far end */}
      <Model url="./models/plant.json" height={0.34} position={[x1 - 0.22, y0 + 0.09, z + 0.2]} />
      <B p={[x0 + 0.28, y0 + 0.11, z + 0.22]} s={[0.22, 0.04, 0.16]} c="#b85c4f" rad={0.008} r={[0, 0.2, 0]} />
      <B p={[x0 + 0.28, y0 + 0.15, z + 0.22]} s={[0.2, 0.035, 0.15]} c="#e0c36a" rad={0.008} r={[0, -0.1, 0]} />
      {/* curtains */}
      <group ref={left} position={[x0 - 0.25, y1 + 0.18, z + 0.12]}>
        <B p={[0, -0.98, 0]} s={[0.4, 1.95, 0.08]} c="#c99050" rad={0.04} />
        <B p={[0.08, -0.98, 0.03]} s={[0.08, 1.9, 0.04]} c="#b57f43" rad={0.02} />
      </group>
      <group ref={right} position={[x1 + 0.25, y1 + 0.18, z + 0.12]}>
        <B p={[0, -0.98, 0]} s={[0.4, 1.95, 0.08]} c="#c99050" rad={0.04} />
        <B p={[-0.08, -0.98, 0.03]} s={[0.08, 1.9, 0.04]} c="#b57f43" rad={0.02} />
      </group>
      <B p={[cx, y1 + 0.2, z + 0.12]} s={[w + 1.1, 0.035, 0.035]} c={WOOD_DARK} />
    </group>
  )
}

// ---------- Edison bulbs on a sagging cable (clearly lamps, not markers) ----------
export function EdisonLights() {
  const { curve, bulbs } = useMemo(() => {
    const anchors = [[-1.9, 2.95], [-0.6, 2.95], [0.7, 2.95], [2.0, 2.95], [3.4, 2.95]]
    const pts = []
    const bulbs = []
    for (let i = 0; i < anchors.length - 1; i++) {
      const [x0, y0] = anchors[i]
      const [x1] = anchors[i + 1]
      for (let k = 0; k < 8; k++) {
        const t = k / 8
        pts.push(new THREE.Vector3(x0 + (x1 - x0) * t, y0 - Math.sin(t * Math.PI) * 0.28, -4.36))
      }
      bulbs.push([(x0 + x1) / 2, y0 - 0.28, -4.36])
    }
    pts.push(new THREE.Vector3(3.4, 2.95, -4.36))
    return { curve: new THREE.CatmullRomCurve3(pts), bulbs }
  }, [])
  const group = useRef()
  useFrame(({ clock }) => {
    group.current.children.forEach((m, i) => {
      const k = 1.5 + Math.sin(clock.elapsedTime * 0.9 + i * 2.1) * 0.15
      m.material.color.setRGB(1.0 * k, 0.55 * k, 0.2 * k)
    })
  })
  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 80, 0.006, 6, false]} />
        <meshBasicMaterial color="#2a2018" />
      </mesh>
      {bulbs.map(([x, y, z], i) => (
        <group key={'s' + i}>
          <Limb a={[x, y, z]} b={[x, y - 0.1, z]} rad={0.004} c="#2a2018" />
          <B p={[x, y - 0.11, z]} s={[0.035, 0.03, 0.035]} c="#8a6a3a" rad={0.008} />
        </group>
      ))}
      <group ref={group}>
        {bulbs.map(([x, y, z], i) => (
          <mesh key={i} position={[x, y - 0.18, z]} scale={[1, 1.5, 1]}>
            <sphereGeometry args={[0.04, 14, 12]} />
            <meshBasicMaterial toneMapped={false} />
          </mesh>
        ))}
      </group>
      <pointLight position={[-0.6, 2.6, -4.0]} color="#ffaa5c" intensity={1.6} distance={4.5} />
      <pointLight position={[2.0, 2.6, -4.0]} color="#ffaa5c" intensity={1.2} distance={4} />
    </group>
  )
}

// ---------- RGB: ceiling cove strips and hexagon light panels ----------
export function RoomRGB() {
  const hexes = useMemo(() => {
    const out = []
    const r = 0.13
    const cells = [[0, 0], [1, 0], [0.5, 0.87], [-0.5, 0.87], [1.5, 0.87], [0, 1.73], [1, 1.73]]
    cells.forEach(([q, s], i) => out.push([q * r * 1.75, s * r * 1.75, i]))
    return out
  }, [])
  const hexRefs = useRef([])
  useFrame(({ clock }) => {
    hexRefs.current.forEach((m, i) => m && m.color.copy(rgbAt(clock.elapsedTime, i * 0.07, 0.75, 0.55)).multiplyScalar(1.3))
  })
  return (
    <group>
      {/* ceiling cove: back, left and right walls */}
      <Strip p={[-0.25, 3.14, -4.45]} s={[9.4, 0.025, 0.025]} offset={0} k={1.4} />
      <Strip p={[-4.95, 3.14, -1]} s={[0.025, 0.025, 6.9]} offset={0.33} k={1.4} />
      <Strip p={[4.45, 3.14, -1]} s={[0.025, 0.025, 6.9]} offset={0.66} k={1.4} />
      <RGBLight p={[-2.5, 3.0, -3.8]} offset={0.1} intensity={1.0} distance={4} />
      <RGBLight p={[2.5, 3.0, -3.8]} offset={0.5} intensity={1.0} distance={4} />
      {/* hexagon panels on the wall beside the window */}
      <group position={[3.62, 1.65, -4.48]}>
        {hexes.map(([x, y, i]) => (
          <group key={i} position={[x, y, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.13, 0.13, 0.02, 6]} />
              <Toon c="#2a2c3a" />
            </mesh>
            <mesh position={[0, 0, 0.012]}>
              <circleGeometry args={[0.115, 6]} />
              <meshBasicMaterial ref={(el) => (hexRefs.current[i] = el)} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>
      <RGBLight p={[3.8, 1.9, -4.2]} offset={0.2} intensity={1.0} distance={2.2} />
    </group>
  )
}

// ---------- Back wall: jet posters, awards shelf, corkboard, blueprints ----------
function Framed({ p, size, map, r = 0, frame = '#2b2118' }) {
  return (
    <group position={p} rotation={[0, 0, r]}>
      <B p={[0, 0, 0]} s={[size[0] + 0.05, size[1] + 0.05, 0.022]} c={frame} rad={0.006} />
      <mesh position={[0, 0, 0.012]}>
        <planeGeometry args={size} />
        <Toon map={map} c="#ffffff" />
      </mesh>
    </group>
  )
}

function Pinned({ p, size, map, r = 0, wall = 'back' }) {
  const rot = wall === 'left' ? [0, Math.PI / 2, r] : [0, 0, r]
  return (
    <group position={p} rotation={rot}>
      <mesh>
        <planeGeometry args={size} />
        <Toon map={map} c="#ffffff" side={THREE.DoubleSide} />
      </mesh>
      {[[-1, 1], [1, 1]].map(([sx, sy], i) => (
        <mesh key={i} position={[sx * (size[0] / 2 - 0.03), sy * (size[1] / 2 - 0.03), 0.01]}>
          <sphereGeometry args={[0.012, 8, 6]} />
          <Toon c="#d9534f" />
        </mesh>
      ))}
    </group>
  )
}

export function Wall() {
  const su57 = useMemo(() => photoPoster('su57', './media/su57.jpg', 'SU-57', 'Felon · fifth-generation fighter'), [])
  const su47 = useMemo(() => photoPoster('su47', './media/su47.jpg', 'SU-47', 'Berkut · forward-swept wing'), [])
  const cork = useMemo(() => corkNotes(), [])
  const bpDrone = useMemo(() => blueprintDrone(), [])
  const bpArm = useMemo(() => blueprintArm(), [])
  const bpCircuit = useMemo(() => blueprintCircuit(), [])
  const bpConv = useMemo(() => blueprintConveyor(), [])
  return (
    <group>
      {/* jet posters above the setup */}
      <Framed p={[-1.3, 2.35, -4.48]} size={[0.48, 0.64]} map={su57} r={-0.01} />
      <Framed p={[-0.35, 2.35, -4.48]} size={[0.48, 0.64]} map={su47} r={0.012} />
      {/* warm picture light for the wall corner */}
      <pointLight position={[-3.3, 2.5, -3.9]} color="#ffc98a" intensity={1.4} distance={2.6} />

      {/* corkboard: about me */}
      <Hotspot id="about" labelAt={[-4.0, 2.0, -4.45]}>
        <B p={[-4.0, 1.55, -4.49]} s={[1.0, 0.72, 0.04]} c="#8f6a45" rad={0.02} />
        <mesh position={[-4.0, 1.55, -4.465]}>
          <planeGeometry args={[0.92, 0.65]} />
          <Toon map={cork} c="#ffffff" />
        </mesh>
      </Hotspot>

      {/* blueprints pinned around the wall */}
      <Pinned p={[-3.65, 2.5, -4.485]} size={[0.56, 0.42]} map={bpDrone} r={0.02} />
      <Pinned p={[-2.8, 2.52, -4.485]} size={[0.5, 0.38]} map={bpConv} r={-0.025} />
      <Pinned p={[-4.985, 1.75, -0.75]} size={[0.56, 0.42]} map={bpArm} r={0.015} wall="left" />
      <Pinned p={[-4.985, 1.75, -0.15]} size={[0.5, 0.38]} map={bpCircuit} r={-0.02} wall="left" />

      {/* shelf: trophy (awards), certificate, books, plant */}
      <B p={[-2.75, 1.85, -4.38]} s={[0.95, 0.04, 0.26]} c={WOOD} rad={0.012} />
      <RGBLight p={[-2.75, 1.78, -4.3]} offset={0.8} intensity={0.5} distance={1.0} />
      <Strip p={[-2.75, 1.826, -4.27]} s={[0.9, 0.006, 0.006]} offset={0.8} />
      <Hotspot id="awards" labelAt={[-2.88, 2.32, -4.38]}>
        <B p={[-2.88, 1.9, -4.38]} s={[0.12, 0.05, 0.12]} c="#4a3a2e" rad={0.012} />
        <Pill p={[-2.88, 1.97, -4.38]} len={0.04} rad={0.015} c="#d6a443" />
        <mesh position={[-2.88, 2.09, -4.38]} castShadow userData={{ glow: true }}>
          <cylinderGeometry args={[0.08, 0.045, 0.14, 20]} />
          <Toon c="#e6b54a" e="#5a3a00" ei={0.3} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[-2.88 + s * 0.085, 2.1, -4.38]} rotation={[0, 0, s * -0.3]}>
            <torusGeometry args={[0.03, 0.007, 6, 12, Math.PI]} />
            <Toon c="#e6b54a" />
          </mesh>
        ))}
        <B p={[-2.68, 1.97, -4.44]} s={[0.16, 0.2, 0.015]} c="#2b2118" rad={0.004} r={[-0.1, 0, 0]} />
        <B p={[-2.68, 1.97, -4.43]} s={[0.13, 0.16, 0.004]} c="#f3ead7" rad={0.002} r={[-0.1, 0, 0]} shadow={false} />
      </Hotspot>
      {['#b85c4f', '#5e7fa8', '#7da36a', '#d9b25e', '#8a6ab0'].map((col, i) => (
        <B key={i} p={[-2.5 + i * 0.045, 1.98 + (i % 3) * 0.012, -4.38]} s={[0.038, 0.22 + (i % 3) * 0.025, 0.17]} c={col} rad={0.006} />
      ))}
      <Model url="./models/plant.json" height={0.26} position={[-3.12, 1.87, -4.38]} />
    </group>
  )
}

// ---------- Bed in the front corner, kept dim ----------
export function Bed() {
  return (
    <group>
      <Model url="./models/bed.json" height={0.62} position={[-4.15, 0, 1.55]} rotation={[0, Math.PI / 2, 0]} />
    </group>
  )
}

// ---------- Electric guitar on an A-frame stand ----------
export function Guitar({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <Limb a={[-0.12, 0, 0.12]} b={[0, 0.5, 0.0]} rad={0.01} c={INK} />
      <Limb a={[0.12, 0, 0.12]} b={[0, 0.5, 0.0]} rad={0.01} c={INK} />
      <Limb a={[0, 0, -0.18]} b={[0, 0.5, 0.0]} rad={0.01} c={INK} />
      <group rotation={[-0.15, 0, 0]} position={[0, 0.08, 0.06]}>
        <Model url="./models/les-paul.json" height={1.0} tint={{ Finish: '#b8312b' }} />
      </group>
    </group>
  )
}

export function Basketball({ p }) {
  const map = useMemo(() => basketball(), [])
  return (
    <mesh position={p} rotation={[0.4, 0.8, 0.2]} castShadow>
      <sphereGeometry args={[0.12, 32, 24]} />
      <Toon map={map} c="#ffffff" />
    </mesh>
  )
}

export function Rug() {
  return (
    <group position={[-0.8, 0, -2.7]}>
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.5, 48]} />
        <Toon c="#a8573f" />
      </mesh>
      {[[1.18, 1.3], [0.58, 0.64]].map(([a, b], i) => (
        <mesh key={i} position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <ringGeometry args={[a, b, 48]} />
          <Toon c="#e0b57a" />
        </mesh>
      ))}
    </group>
  )
}

export { Glow }
