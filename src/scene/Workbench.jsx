import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { B, Ball, Glow, Hotspot, Limb, Pill, Toon } from './parts'
import { pegboard, blueprintDrone } from './textures'

const WOOD = '#a9744a'
const WOOD_DARK = '#5e3d29'
const STEEL = '#8d94a6'
const DARK = '#262836'

const BX = -4.6 // bench center x
const TOP = 0.9 // bench top height

function Bench() {
  return (
    <group>
      <B p={[BX, TOP - 0.03, -2.65]} s={[0.8, 0.06, 2.7]} c={WOOD} rad={0.02} />
      {[[-4.95, -3.95], [-4.25, -3.95], [-4.95, -1.35], [-4.25, -1.35]].map(([x, z], i) => (
        <B key={i} p={[x, TOP / 2 - 0.03, z]} s={[0.06, TOP - 0.06, 0.06]} c={WOOD_DARK} />
      ))}
      <B p={[BX, 0.18, -2.65]} s={[0.72, 0.04, 2.6]} c={WOOD_DARK} rad={0.01} />
      {/* storage boxes under the bench */}
      {[['#4f6fa3', -3.5], ['#c8742f', -2.9], ['#4f8a55', -2.3]].map(([c, z], i) => (
        <B key={i} p={[BX + 0.05, 0.33, z]} s={[0.5, 0.26, 0.5]} c={c} rad={0.03} />
      ))}
    </group>
  )
}

// Pegboard with hanging tools.
function Tools() {
  const peg = useMemo(() => {
    const t = pegboard().clone()
    t.needsUpdate = true
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(4, 1.6)
    return t
  }, [])
  const X = -4.965
  const screwdriver = (z, y, col) => (
    <group key={'sd' + z}>
      <Pill p={[X + 0.02, y, z]} len={0.07} rad={0.016} c={col} />
      <Limb a={[X + 0.02, y - 0.05, z]} b={[X + 0.02, y - 0.17, z]} rad={0.004} c={STEEL} />
    </group>
  )
  return (
    <group>
      <mesh position={[-4.995, 1.62, -2.65]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[2.5, 0.95]} />
        <Toon map={peg} c="#ffffff" />
      </mesh>
      {screwdriver(-3.7, 1.95, '#d9534f')}
      {screwdriver(-3.6, 1.95, '#e3b23c')}
      {screwdriver(-3.5, 1.95, '#4f6fa3')}
      {screwdriver(-3.4, 1.95, '#4f8a55')}
      {/* wrenches */}
      {[0, 1, 2, 3].map((i) => (
        <group key={'w' + i}>
          <Limb a={[X + 0.012, 1.85 - i * 0.015, -3.15 + i * 0.07]} b={[X + 0.012, 1.55 - i * 0.03, -3.15 + i * 0.07]} rad={0.008} c={STEEL} />
          <mesh position={[X + 0.012, 1.86 - i * 0.015, -3.15 + i * 0.07]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.022, 0.007, 6, 12, Math.PI * 1.5]} />
            <Toon c={STEEL} />
          </mesh>
        </group>
      ))}
      {/* pliers */}
      <Limb a={[X + 0.015, 1.9, -2.7]} b={[X + 0.015, 1.68, -2.74]} rad={0.012} c="#d9534f" />
      <Limb a={[X + 0.015, 1.9, -2.66]} b={[X + 0.015, 1.68, -2.62]} rad={0.012} c="#d9534f" />
      <Limb a={[X + 0.015, 1.9, -2.68]} b={[X + 0.015, 1.98, -2.68]} rad={0.01} c={STEEL} />
      {/* hammer */}
      <Limb a={[X + 0.02, 1.98, -2.35]} b={[X + 0.02, 1.68, -2.35]} rad={0.013} c="#b98a5e" />
      <B p={[X + 0.025, 1.99, -2.35]} s={[0.04, 0.04, 0.13]} c="#5a5f70" rad={0.01} />
      {/* tape + solder spool + zip ties */}
      <mesh position={[X + 0.03, 1.75, -2.05]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.04, 0.018, 10, 20]} />
        <Toon c="#e3b23c" />
      </mesh>
      <mesh position={[X + 0.03, 1.55, -2.05]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.035, 16]} />
        <Toon c="#c0c6d2" />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <Limb key={'z' + i} a={[X + 0.01, 1.95, -1.75 + i * 0.012]} b={[X + 0.01, 1.7, -1.76 + i * 0.012]} rad={0.003} c="#f1ece2" />
      ))}
      {/* safety glasses */}
      <B p={[X + 0.02, 1.4, -1.6]} s={[0.03, 0.05, 0.16]} c="#9fd3ff" rad={0.02} />
      {/* shelf with labelled parts bins */}
      <B p={[-4.84, 2.35, -2.65]} s={[0.32, 0.035, 2.5]} c={WOOD} rad={0.012} />
      {Array.from({ length: 9 }).map((_, i) => (
        <group key={'bin' + i}>
          <B p={[-4.82, 2.45, -3.75 + i * 0.27]} s={[0.24, 0.16, 0.22]} c={['#4f6fa3', '#e3b23c', '#d9534f'][i % 3]} rad={0.02} />
          <B p={[-4.695, 2.47, -3.75 + i * 0.27]} s={[0.004, 0.05, 0.12]} c="#f3ead7" rad={0.002} shadow={false} />
        </group>
      ))}
      {/* under-shelf work light */}
      <mesh position={[-4.75, 2.325, -2.65]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.05, 2.3]} />
        <Glow c="#fff0d6" k={2.2} />
      </mesh>
      <pointLight position={[-4.6, 2.2, -2.65]} color="#ffe2b8" intensity={2.2} distance={2.6} />
    </group>
  )
}

// Enclosed 3D printer printing a drone arm.
function Printer() {
  const head = useRef()
  const part = useRef()
  const gantry = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const cyc = (t % 30) / 30
    const h = 0.01 + cyc * 0.16
    part.current.scale.y = h / 0.16
    part.current.position.y = TOP + 0.07 + h / 2
    gantry.current.position.y = TOP + 0.09 + h
    head.current.position.set(BX + Math.sin(t * 3.4) * 0.08, TOP + 0.12 + h, -3.5 + Math.cos(t * 2.6) * 0.07)
  })
  return (
    <Hotspot id="printer" labelAt={[BX, TOP + 0.62, -3.5]}>
      <group>
        {/* enclosure */}
        <B p={[BX, TOP + 0.26, -3.5]} s={[0.5, 0.52, 0.5]} c="#2a2c3a" rad={0.03} />
        <mesh position={[BX + 0.252, TOP + 0.28, -3.5]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.42, 0.4]} />
          <meshBasicMaterial color="#0e101a" />
        </mesh>
        {/* lit chamber visible through the door */}
        <pointLight position={[BX + 0.15, TOP + 0.42, -3.5]} color="#fff3dc" intensity={1.2} distance={0.9} />
        <mesh position={[BX + 0.256, TOP + 0.28, -3.5]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.42, 0.4]} />
          <meshPhysicalMaterial color="#cfd8ea" transparent opacity={0.16} roughness={0.05} />
        </mesh>
        <B p={[BX + 0.05, TOP + 0.065, -3.5]} s={[0.34, 0.012, 0.34]} c="#5a5d70" rad={0.004} />
        <mesh ref={part} position={[BX + 0.05, TOP + 0.1, -3.5]}>
          <boxGeometry args={[0.04, 0.16, 0.2]} />
          <Toon c="#ff9a5c" />
        </mesh>
        <group ref={gantry}>
          <B p={[BX + 0.05, 0, -3.5]} s={[0.025, 0.02, 0.4]} c="#7d8296" rad={0.006} />
        </group>
        <group ref={head}>
          <B p={[0.05, 0, 0]} s={[0.06, 0.06, 0.06]} c="#e07a3e" rad={0.012} />
        </group>
        {/* control screen */}
        <mesh position={[BX + 0.253, TOP + 0.04, -3.38]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.1, 0.05]} />
          <Glow c="#8fd6ff" k={1.4} />
        </mesh>
        {/* filament spool on top */}
        <mesh position={[BX, TOP + 0.58, -3.5]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.09, 0.09, 0.06, 24]} />
          <Toon c="#ff9a5c" />
        </mesh>
      </group>
    </Hotspot>
  )
}

function Oscilloscope() {
  const canvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 128
    c.height = 80
    return c
  }, [])
  const tex = useMemo(() => new THREE.CanvasTexture(canvas), [canvas])
  const last = useRef(0)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (t - last.current < 0.08) return
    last.current = t
    const g = canvas.getContext('2d')
    g.fillStyle = '#06210f'
    g.fillRect(0, 0, 128, 80)
    g.strokeStyle = 'rgba(80,200,120,0.25)'
    for (let x = 0; x < 128; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 80); g.stroke() }
    for (let y = 0; y < 80; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke() }
    g.strokeStyle = '#7dffa0'
    g.lineWidth = 2
    g.beginPath()
    for (let x = 0; x < 128; x++) {
      const y = 40 + Math.sin(x * 0.18 + t * 4) * 18 * Math.sin(t * 0.7 + x * 0.01)
      x ? g.lineTo(x, y) : g.moveTo(x, y)
    }
    g.stroke()
    tex.needsUpdate = true
  })
  return (
    <group position={[BX - 0.05, TOP, -2.85]}>
      <B p={[0, 0.1, 0]} s={[0.24, 0.2, 0.3]} c="#d8d2c4" rad={0.02} />
      <mesh position={[0.122, 0.12, -0.04]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.17, 0.11]} />
        <meshBasicMaterial map={tex} toneMapped={false} color={[1.4, 1.4, 1.4]} />
      </mesh>
      {[0.05, 0.1].map((z) => (
        <mesh key={z} position={[0.123, 0.13, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.012, 0.012, 0.01, 12]} />
          <Toon c="#3a3d50" />
        </mesh>
      ))}
    </group>
  )
}

function Electronics() {
  const iron = useRef()
  return (
    <group>
      {/* soldering station */}
      <group position={[BX, TOP, -2.4]}>
        <B p={[0, 0.05, 0]} s={[0.16, 0.1, 0.14]} c="#c8742f" rad={0.015} />
        <mesh position={[0.082, 0.06, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.07, 0.03]} />
          <Glow c="#ff8a5a" k={1.6} />
        </mesh>
        <mesh position={[0.05, 0.12, 0.12]} rotation={[0.4, 0, 0]}>
          <torusGeometry args={[0.025, 0.004, 6, 14]} />
          <Toon c={STEEL} />
        </mesh>
        <group ref={iron}>
          <Limb a={[0.05, 0.12, 0.12]} b={[0.13, 0.22, 0.2]} rad={0.012} c="#2b2d3a" />
          <Limb a={[0.05, 0.12, 0.12]} b={[0.02, 0.06, 0.07]} rad={0.003} c={STEEL} />
        </group>
      </group>
      {/* breadboard with jumper wires */}
      <group position={[BX + 0.05, TOP, -2.08]}>
        <B p={[0, 0.008, 0]} s={[0.12, 0.016, 0.24]} c="#f1ece2" rad={0.004} />
        {[['#d9534f', -0.08, 0.04], ['#4f6fa3', -0.02, 0.06], ['#e3b23c', 0.03, -0.05], ['#4f8a55', 0.07, 0.02]].map(([c, z, dz], i) => (
          <mesh key={i} position={[0, 0.03, z]}>
            <torusGeometry args={[Math.abs(dz) * 0.5 + 0.01, 0.003, 6, 12, Math.PI]} />
            <Toon c={c} />
          </mesh>
        ))}
        {/* jetson-style dev board */}
        <B p={[-0.13, 0.015, 0.02]} s={[0.1, 0.03, 0.1]} c="#2f7a4a" rad={0.004} />
        <B p={[-0.13, 0.045, 0.02]} s={[0.07, 0.03, 0.07]} c="#22242f" rad={0.006} />
        <Blink p={[-0.08, 0.035, 0.06]} />
      </group>
      {/* multimeter */}
      <group position={[BX + 0.2, TOP, -2.55]} rotation={[0, 0.4, 0]}>
        <B p={[0, 0.02, 0]} s={[0.1, 0.04, 0.17]} c="#e3b23c" rad={0.015} />
        <mesh position={[0, 0.042, -0.04]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.07, 0.04]} />
          <Glow c="#cde8c5" k={1.1} />
        </mesh>
      </group>
      {/* magnifier ring light */}
      <group position={[-4.85, TOP, -2.25]}>
        <B p={[0, 0.02, 0]} s={[0.1, 0.04, 0.1]} c={DARK} rad={0.015} />
        <Limb a={[0, 0.03, 0]} b={[0.05, 0.4, 0]} rad={0.008} c={DARK} />
        <Limb a={[0.05, 0.4, 0]} b={[0.22, 0.38, 0]} rad={0.008} c={DARK} />
        <mesh position={[0.26, 0.34, 0]} rotation={[Math.PI / 2 - 0.4, 0, 0.6]}>
          <torusGeometry args={[0.06, 0.012, 8, 24]} />
          <Glow c="#fff3dc" k={1.6} />
        </mesh>
      </group>
    </group>
  )
}

function Blink({ p }) {
  const m = useRef()
  useFrame(({ clock }) => m.current.color.setScalar(Math.sin(clock.elapsedTime * 5) > 0 ? 3 : 0.2).multiply(new THREE.Color('#5dff8a')))
  return (
    <mesh position={p}>
      <sphereGeometry args={[0.007, 8, 6]} />
      <meshBasicMaterial ref={m} toneMapped={false} />
    </mesh>
  )
}

// The drone being built (ongoing project).
function Drone() {
  const props = useRef([])
  useFrame((_, d) => props.current.forEach((p) => p && (p.rotation.y += d * 1.2)))
  return (
    <Hotspot id="drone" labelAt={[BX, TOP + 0.3, -1.8]}>
      <group position={[BX, TOP + 0.05, -1.8]} rotation={[0, 0.5, 0]}>
        <B p={[0, 0, 0]} s={[0.16, 0.05, 0.12]} c="#2a2d3c" rad={0.015} />
        <B p={[0, 0.04, 0]} s={[0.09, 0.03, 0.07]} c="#2f7a4a" rad={0.006} />
        <B p={[0.06, 0.035, 0]} s={[0.04, 0.03, 0.04]} c="#22242f" rad={0.006} />
        {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([x, z], i) => (
          <group key={i}>
            <Limb a={[0, 0, 0]} b={[x * 0.16, 0, z * 0.16]} rad={0.012} c="#ff9a5c" />
            <mesh position={[x * 0.16, 0.02, z * 0.16]}>
              <cylinderGeometry args={[0.022, 0.022, 0.035, 14]} />
              <Toon c="#3a3d50" />
            </mesh>
            <mesh ref={(el) => (props.current[i] = el)} position={[x * 0.16, 0.042, z * 0.16]}>
              <boxGeometry args={[0.15, 0.004, 0.02]} />
              <Toon c="#c9d0dc" />
            </mesh>
          </group>
        ))}
        {/* loose wires: still being wired up */}
        <Limb a={[0.03, 0.03, 0.03]} b={[0.12, 0.0, 0.14]} rad={0.003} c="#d9534f" />
        <Limb a={[0.03, 0.03, -0.03]} b={[0.12, -0.02, -0.1]} rad={0.003} c="#2b2d3a" />
      </group>
      {/* spare printed arms */}
      <B p={[BX + 0.2, TOP + 0.01, -1.6]} s={[0.04, 0.02, 0.18]} c="#ff9a5c" rad={0.008} r={[0, 0.3, 0]} />
      <B p={[BX + 0.24, TOP + 0.01, -1.55]} s={[0.04, 0.02, 0.18]} c="#ff9a5c" rad={0.008} r={[0, 0.5, 0]} />
    </Hotspot>
  )
}

// Small robotic arm (Lynxmotion-style), slowly moving.
function RobotArm() {
  const j1 = useRef()
  const j2 = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    j1.current.rotation.y = Math.sin(t * 0.4) * 0.8
    j2.current.rotation.z = -0.6 + Math.sin(t * 0.6) * 0.3
  })
  return (
    <group position={[BX - 0.15, TOP, -1.45]}>
      <B p={[0, 0.02, 0]} s={[0.14, 0.04, 0.14]} c={DARK} rad={0.015} />
      <group ref={j1} position={[0, 0.04, 0]}>
        <Pill p={[0, 0.08, 0]} len={0.1} rad={0.022} c="#e3b23c" />
        <Ball p={[0, 0.16, 0]} s={0.028} c={DARK} />
        <group ref={j2} position={[0, 0.16, 0]}>
          <Pill p={[0.07, 0, 0]} r={[0, 0, Math.PI / 2]} len={0.1} rad={0.018} c="#e3b23c" />
          <B p={[0.16, 0, 0]} s={[0.04, 0.03, 0.05]} c={DARK} rad={0.008} />
        </group>
      </group>
    </group>
  )
}


// More gear: cordless drill, hand saw, level, tape measure, calipers, glue gun, clamps, ear muffs,
// a cable reel under the bench, and blueprints on the bench top.
function MoreTools() {
  const bp = useMemo(() => blueprintDrone(), [])
  const X = -4.965
  return (
    <group>
      {/* cordless drill on a hook */}
      <group position={[X + 0.06, 1.42, -3.55]} rotation={[0, Math.PI / 2, 0]}>
        <B p={[0, 0, 0]} s={[0.18, 0.08, 0.07]} c="#e3b23c" rad={0.025} />
        <B p={[-0.04, -0.09, 0]} s={[0.05, 0.13, 0.06]} c="#2b2d3a" rad={0.02} />
        <B p={[-0.04, -0.17, 0]} s={[0.09, 0.05, 0.08]} c="#2b2d3a" rad={0.015} />
        <Limb a={[0.09, 0, 0]} b={[0.17, 0, 0]} rad={0.006} c={STEEL} />
      </group>
      {/* hand saw */}
      <mesh position={[X + 0.012, 1.3, -3.05]} rotation={[0, Math.PI / 2, 0.15]}>
        <boxGeometry args={[0.38, 0.1, 0.004]} />
        <Toon c="#b9c0cc" />
      </mesh>
      <B p={[X + 0.02, 1.32, -2.83]} s={[0.03, 0.1, 0.07]} c="#b8312b" rad={0.02} />
      {/* spirit level */}
      <B p={[X + 0.02, 1.25, -2.4]} s={[0.025, 0.04, 0.5]} c="#e3b23c" rad={0.008} />
      <mesh position={[X + 0.034, 1.25, -2.4]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.05, 0.018]} />
        <Glow c="#9df27a" k={1.1} />
      </mesh>
      {/* tape measure + calipers */}
      <B p={[X + 0.03, 1.38, -1.95]} s={[0.05, 0.08, 0.08]} c="#e3b23c" rad={0.025} />
      <B p={[X + 0.012, 1.42, -1.7]} s={[0.006, 0.22, 0.025]} c={STEEL} rad={0.003} />
      <B p={[X + 0.014, 1.36, -1.68]} s={[0.008, 0.03, 0.06]} c={STEEL} rad={0.003} />
      {/* glue gun */}
      <group position={[X + 0.04, 1.18, -1.6]} rotation={[0, Math.PI / 2, 0]}>
        <B p={[0, 0, 0]} s={[0.12, 0.05, 0.04]} c="#4f6fa3" rad={0.015} />
        <B p={[-0.03, -0.06, 0]} s={[0.035, 0.08, 0.035]} c="#4f6fa3" rad={0.012} />
      </group>
      {/* ear muffs */}
      <mesh position={[X + 0.03, 1.2, -3.35]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.07, 0.01, 6, 16, Math.PI]} />
        <Toon c="#2b2d3a" />
      </mesh>
      {[-1, 1].map((s) => (
        <B key={s} p={[X + 0.04, 1.17, -3.35 + s * 0.07]} s={[0.05, 0.08, 0.04]} c="#d9534f" rad={0.02} />
      ))}
      {/* bar clamps */}
      {[0, 1].map((i) => (
        <group key={'cl' + i} position={[X + 0.02, 1.6, -1.52 + i * 0.06]}>
          <B p={[0, 0, 0]} s={[0.015, 0.3, 0.015]} c={STEEL} rad={0.004} />
          <B p={[0.01, 0.13, 0]} s={[0.04, 0.03, 0.03]} c="#d9534f" rad={0.008} />
          <B p={[0.01, -0.06, 0]} s={[0.04, 0.03, 0.03]} c="#d9534f" rad={0.008} />
        </group>
      ))}
      {/* cable reel under the bench */}
      <group position={[BX + 0.1, 0.33, -1.7]} rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.16, 0.16, 0.03, 24]} />
          <Toon c="#c23b3b" />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.03, 24]} />
          <Toon c="#c23b3b" />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.1, 24]} />
          <Toon c="#e3b23c" />
        </mesh>
      </group>
      {/* blueprint spread on the bench + rolled ones in a bin */}
      <mesh position={[BX + 0.12, TOP + 0.003, -2.95]} rotation={[-Math.PI / 2, 0, 0.2]}>
        <planeGeometry args={[0.34, 0.26]} />
        <Toon map={bp} c="#ffffff" />
      </mesh>
      <B p={[-4.0, 0.25, -0.95]} s={[0.22, 0.5, 0.22]} c="#5e3d29" rad={0.03} />
      {[[-0.04, 0.02, 0.15], [0.04, -0.03, -0.12], [0.0, 0.05, 0.05]].map(([dx, dz, tilt], i) => (
        <mesh key={'roll' + i} position={[-4.0 + dx, 0.62, -0.95 + dz]} rotation={[tilt, 0, tilt * 0.6]}>
          <cylinderGeometry args={[0.03, 0.03, 0.55, 12]} />
          <Toon c={i === 1 ? '#f1e4c8' : '#2f5f9f'} />
        </mesh>
      ))}
    </group>
  )
}

export default function Workbench() {
  return (
    <group>
      <Bench />
      <Tools />
      <Printer />
      <Oscilloscope />
      <Electronics />
      <Drone />
      <RobotArm />
      <MoreTools />
      {/* stool */}
      <group position={[-3.95, 0, -2.4]}>
        <mesh position={[0, 0.62, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.17, 0.05, 20]} />
          <Toon c="#c8742f" />
        </mesh>
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2
          return <Limb key={i} a={[0, 0.6, 0]} b={[Math.cos(a) * 0.18, 0, Math.sin(a) * 0.18]} rad={0.015} c={DARK} />
        })}
      </group>
    </group>
  )
}
