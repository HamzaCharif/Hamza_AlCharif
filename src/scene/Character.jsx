import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Outlines } from '@react-three/drei'
import * as THREE from 'three'
import { Ball, Limb, Toon } from './parts'

// Hamza in the style of an anime film: realistic proportions, simple soft shapes, thin ink outline.
// Seated, facing the monitors (-z), hands on the keyboard.
const SKIN = '#e2b18c'
const HAIR = '#241812'
const HOODIE = '#6f8669'
const HOODIE_DK = '#5e7459'
const JEANS = '#9a9ca6'
const SOCKS = '#efe4d2'
const OL = 0.0035

// Natural dark hair: one smooth sculpted shape around the head with a soft wavy surface,
// fuller on top, a fringe falling forward, tapered at the sides and back.
function noise3(x, y, z) {
  return Math.sin(x * 37.0 + Math.sin(z * 23.0)) * Math.cos(y * 31.0 + Math.sin(x * 19.0)) * Math.sin(z * 29.0 + y * 7.0)
}
function useHairGeometry() {
  return useMemo(() => {
    const g = new THREE.SphereGeometry(0.118, 72, 54)
    const p = g.attributes.position
    const v = new THREE.Vector3()
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i)
      const n = v.clone().normalize()
      // hairline: low at the back, higher at the temples, highest over the forehead (face is -z)
      const front = Math.max(0, -n.z)
      const hairline = THREE.MathUtils.lerp(-0.55, 0.32, front) - Math.abs(n.x) * 0.15 * (1 - front)
      let r = 0.118
      if (n.y < hairline) {
        r = 0.104 // tucked under the skin below the hairline
      } else {
        const top = Math.max(0, n.y)
        r += 0.012 + top * 0.03 // volume on top
        r += noise3(n.x, n.y, n.z) * 0.006 * (0.4 + top) // soft waves/curls
        r -= Math.abs(n.x) * 0.006 * (1 - top) // tapered sides
      }
      v.copy(n).multiplyScalar(r)
      // fringe: front-top strands fall forward a little
      if (n.z < -0.3 && n.y > 0.15) {
        v.z -= 0.012 * (n.y - 0.15)
        v.y -= 0.01 * Math.max(0, -n.z - 0.3)
      }
      p.setXYZ(i, v.x, v.y, v.z)
    }
    g.computeVertexNormals()
    return g
  }, [])
}

function Hair() {
  const geo = useHairGeometry()
  return (
    <mesh geometry={geo} position={[0, 0.02, 0.008]} castShadow>
      <Toon c={HAIR} />
    </mesh>
  )
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
