import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Outlines } from '@react-three/drei'
import * as THREE from 'three'
import { Ball, Limb, Toon, toonRamp } from './parts'
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js'
import { plaid } from './textures'

// Hamza in the style of an anime film: realistic proportions, simple soft shapes, thin ink outline.
// Seated, facing the monitors (-z), hands on the keyboard.
const SKIN = '#e2b18c'
const HAIR = '#1b1310'
const HOODIE = '#cdb99c'
const HOODIE_DK = '#b39f83'
const JEANS = '#36425e'
const SOCKS = '#ece6da'
const OL = 0.0035

// Dark curly hair as one smooth surface (metaballs): full, voluminous curls on top that fall
// forward over the forehead, shorter at the sides and back.
const HAIR_SCALE = 0.19
function toUnit(v) { return v / HAIR_SCALE / 2 + 0.5 }
function Hair() {
  const mc = useMemo(() => {
    const mat = new THREE.MeshToonMaterial({ color: HAIR, gradientMap: toonRamp() })
    const m = new MarchingCubes(48, mat, false, false, 60000)
    m.isolation = 80
    m.reset()
    const ball = (x, y, z, R) => m.addBall(toUnit(x), toUnit(y), toUnit(z), R * R / (HAIR_SCALE * HAIR_SCALE * 4) * 92, 12)
    // base cap hugging the skull (top and back)
    ball(0, 0.045, 0.015, 0.112)
    ball(0, 0.0, 0.04, 0.1)
    let seed = 11
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    // big curls over the crown
    for (let i = 0; i < 34; i++) {
      const theta = r() * Math.PI * 2
      const phi = r() * 1.05
      const R = 0.118 + r() * 0.02
      const x = Math.sin(phi) * Math.cos(theta) * R
      const z = Math.sin(phi) * Math.sin(theta) * R + 0.01
      const y = Math.cos(phi) * R * 0.95 + 0.06
      ball(x, y, z, 0.032 + r() * 0.014)
    }
    // shorter curls down the back and sides
    for (let i = 0; i < 16; i++) {
      const theta = Math.PI * 0.15 + r() * Math.PI * 0.7 // back half
      const x = Math.cos(theta) * 0.105 * (r() > 0.5 ? 1 : -1)
      const z = Math.sin(theta) * 0.1 + 0.01
      ball(x, -0.01 + r() * 0.05, z, 0.024 + r() * 0.008)
    }
    // fringe of curls falling onto the forehead
    ;[[-0.055, 0.075, -0.085], [-0.02, 0.085, -0.098], [0.02, 0.08, -0.1], [0.055, 0.07, -0.088], [0.0, 0.05, -0.105]].forEach(([x, y, z]) =>
      ball(x, y, z, 0.026)
    )
    m.update()
    m.castShadow = true
    m.scale.setScalar(HAIR_SCALE)
    return m
  }, [])
  return <primitive object={mc} />
}

function Hand({ side }) {
  const fingers = useRef([])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const typing = Math.sin(t * 0.5) > -0.6 // short pauses now and then
    fingers.current.forEach((f, i) => {
      if (!f) return
      const k = Math.max(0, Math.sin(t * 11 + i * 1.9 + side * 2.1))
      f.rotation.x = typing ? -k * 0.35 : 0
    })
  })
  const X = side * 0.115
  return (
    <group>
      <Ball p={[X, 0.812, -0.6]} s={0.04} c={SKIN} scale={[1, 0.42, 1.25]} ol={OL} />
      {[-0.024, -0.008, 0.008, 0.024].map((dx, i) => (
        <group key={i} ref={(el) => (fingers.current[i] = el)} position={[X + dx, 0.81, -0.64]}>
          <Limb a={[0, 0, 0]} b={[0, -0.016, -0.03]} rad={0.0075} c={SKIN} />
        </group>
      ))}
      {/* thumb */}
      <Limb a={[X - side * 0.03, 0.81, -0.6]} b={[X - side * 0.045, 0.8, -0.635]} rad={0.008} c={SKIN} />
    </group>
  )
}

function Arm({ side }) {
  const S = [side * 0.19, 1.0, -0.05]
  const E = [side * 0.23, 0.83, -0.3]
  const W = [side * 0.12, 0.815, -0.565]
  return (
    <group>
      <Ball p={S} s={0.07} c={HOODIE} ol={OL} />
      <Limb a={S} b={E} rad={0.056} c={HOODIE} ol={OL} />
      <Limb a={E} b={W} rad={0.048} c={HOODIE} ol={OL} />
      <Ball p={W} s={0.045} c={HOODIE_DK} scale={[1, 1, 0.6]} />
      <Hand side={side} />
    </group>
  )
}

// A soft plaid blanket draped like a cape: wraps the shoulders, falls down the back
// and over the arms, with gentle folds.
function useCapeGeometry() {
  return useMemo(() => {
    const cols = 48, rows = 24
    const pos = [], uv = [], idx = []
    for (let j = 0; j <= rows; j++) {
      const v = j / rows // 0 at the shoulders, 1 at the hem
      for (let i = 0; i <= cols; i++) {
        const u = i / cols
        const th = (u - 0.5) * Math.PI * 1.45 // wraps from one arm, around the back, to the other
        const fold = Math.sin(th * 9 + v * 2) * 0.012 * (0.3 + v)
        const rad = 0.2 + v * 0.09 + fold
        const wide = 1.22 - v * 0.15
        let x = Math.sin(th) * rad * wide
        let z = Math.cos(th) * rad * 0.8 + 0.04
        let y = 1.06 - v * 0.52
        // the top edge rolls over the shoulders a little
        y += Math.cos(th) * 0.015 * (1 - v)
        // sides drape forward over the arms
        z -= Math.max(0, Math.abs(th) - 1.0) * 0.12 * v
        pos.push(x, y, z)
        uv.push(u * 2.2, v * 1.6)
      }
    }
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const a = j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1
        idx.push(a, c, b, b, c, d)
      }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    g.setIndex(idx)
    g.computeVertexNormals()
    return g
  }, [])
}

function Blanket() {
  const map = useMemo(() => plaid(), [])
  const geo = useCapeGeometry()
  return (
    <group>
      <mesh geometry={geo} castShadow receiveShadow>
        <Toon map={map} c="#ffffff" side={THREE.DoubleSide} />
        <Outlines thickness={OL} color="#3a1f18" />
      </mesh>
      {/* soft rolled collar around the neck */}
      <mesh position={[0, 1.05, 0.03]} rotation={[Math.PI / 2 - 0.15, 0, 0]} scale={[1.2, 0.9, 1]}>
        <torusGeometry args={[0.13, 0.035, 12, 32, Math.PI * 1.4]} />
        <Toon map={map} c="#ffffff" />
      </mesh>
    </group>
  )
}

export default function Character(props) {
  const torso = useRef()
  const head = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    torso.current.scale.y = 1 + Math.sin(t * 1.5) * 0.012
    // reading the code, glancing to the second screen now and then
    const glance = Math.max(0, Math.sin(t * 0.22) - 0.7) * 3
    head.current.rotation.y = -glance * 0.35 + Math.sin(t * 0.6) * 0.02
    head.current.rotation.x = 0.12 + Math.sin(t * 0.9) * 0.015
  })
  return (
    <group {...props}>
      {/* legs */}
      <Ball p={[0, 0.56, 0.02]} s={0.15} c={JEANS} scale={[1.15, 0.6, 0.95]} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Limb a={[s * 0.095, 0.57, 0.0]} b={[s * 0.11, 0.56, -0.42]} rad={0.07} c={JEANS} ol={OL} />
          <Limb a={[s * 0.11, 0.56, -0.42]} b={[s * 0.12, 0.1, -0.47]} rad={0.054} c={JEANS} ol={OL} />
          <Ball p={[s * 0.12, 0.05, -0.53]} s={0.05} c={SOCKS} scale={[1, 0.6, 1.9]} ol={OL} />
        </group>
      ))}
      {/* torso in a hoodie */}
      <group ref={torso}>
        <Ball p={[0, 0.73, 0.0]} s={0.175} c={HOODIE} scale={[1.15, 1.0, 0.86]} ol={OL} />
        <Ball p={[0, 0.9, -0.02]} s={0.18} c={HOODIE} scale={[1.22, 1.05, 0.84]} r={[-0.12, 0, 0]} ol={OL} />
        {/* ribbed hem */}
        <Ball p={[0, 0.6, 0.0]} s={0.16} c={HOODIE_DK} scale={[1.2, 0.25, 0.88]} />
        <Ball p={[0, 1.04, 0.09]} s={0.1} c={HOODIE_DK} scale={[1.4, 0.7, 0.85]} ol={OL} />
        {[-1, 1].map((s) => (
          <Limb key={s} a={[s * 0.035, 1.0, -0.14]} b={[s * 0.04, 0.86, -0.165]} rad={0.005} c="#f1ece2" />
        ))}
        {/* front pocket */}
        <Ball p={[0, 0.66, -0.12]} s={0.09} c={HOODIE_DK} scale={[1.4, 0.55, 0.3]} />
      </group>
      <Arm side={1} />
      <Arm side={-1} />
      <Blanket />
      {/* neck + head */}
      <Limb a={[0, 1.0, -0.03]} b={[0, 1.13, -0.05]} rad={0.045} c={SKIN} />
      <group ref={head} position={[0, 1.24, -0.06]}>
        <Ball p={[0, 0, 0]} s={0.105} c={SKIN} scale={[0.92, 1.12, 1.02]} ol={OL} />
        <Ball p={[0, -0.06, -0.03]} s={0.07} c={SKIN} scale={[1.1, 0.8, 1.0]} />
        {/* face: nose, eyes, brows (seen when he glances over) */}
        <Ball p={[0, -0.005, -0.107]} s={0.016} c="#c98d68" scale={[0.8, 1, 1.2]} />
        {[-1, 1].map((s) => (
          <group key={s}>
            <Ball p={[s * 0.038, 0.022, -0.093]} s={0.012} c="#1e1412" scale={[0.9, 1.2, 0.6]} />
            <Ball p={[s * 0.034, 0.026, -0.1]} s={0.003} c="#ffffff" />
            <mesh position={[s * 0.04, 0.05, -0.095]} rotation={[0, 0, s * -0.12]}>
              <boxGeometry args={[0.035, 0.007, 0.006]} />
              <meshBasicMaterial color={HAIR} />
            </mesh>
            <Ball p={[s * 0.1, 0.0, 0.0]} s={0.025} c={SKIN} scale={[0.5, 1, 0.8]} />
          </group>
        ))}
        <Hair />
        {/* over-ear headphones, sitting on top of the curls */}
        <mesh position={[0, 0.03, 0.0]} scale={[1, 1.12, 1]}>
          <torusGeometry args={[0.135, 0.012, 8, 28, Math.PI]} />
          <Toon c="#2b2d3a" />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={'hp' + s}>
            <Ball p={[s * 0.128, 0.0, 0.0]} s={0.045} c="#2b2d3a" scale={[0.55, 1, 0.95]} ol={OL} />
            <Ball p={[s * 0.148, 0.0, 0.0]} s={0.028} c="#e9c46a" scale={[0.25, 1, 1]} />
          </group>
        ))}
      </group>
    </group>
  )
}
