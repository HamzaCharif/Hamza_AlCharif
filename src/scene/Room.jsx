import { useMemo } from 'react'
import * as THREE from 'three'
import { B, Hotspot, Limb, Model, Occluder, Toon } from './parts'
import Character from './Character'
import Setup from './Setup'
import Workbench from './Workbench'
import Outside from './Outside'
import Lounge from './Lounge'
import { WindowFrame, EdisonLights, RoomRGB, Wall, Bed, Guitar, Basketball, Rug } from './Decor'

// Deep navy room, warm wood floor.
const WALL = '#26355e'
const TRIM = '#1c2747'
const CEIL = '#1b2440'
const FLOOR = '#80553a'
const PLANK = '#6a442d'

// Room box: x -5..4.5, z -4.5..2.5, height 3.2. Window hole in the back wall: x 1.3..3.3, y 0.95..2.65.
function Shell() {
  return (
    <group>
      <B p={[-0.25, -0.05, -1]} s={[9.5, 0.1, 7]} c={FLOOR} rad={0.01} />
      {Array.from({ length: 16 }).map((_, i) => (
        <mesh key={i} position={[-4.85 + i * 0.6, 0.001, -1]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.012, 7]} />
          <meshBasicMaterial color={PLANK} />
        </mesh>
      ))}
      <B p={[-1.85, 1.6, -4.55]} s={[6.3, 3.2, 0.1]} c={WALL} rad={0.01} />
      <B p={[3.9, 1.6, -4.55]} s={[1.2, 3.2, 0.1]} c={WALL} rad={0.01} />
      <B p={[2.3, 0.475, -4.55]} s={[2.0, 0.95, 0.1]} c={WALL} rad={0.01} />
      <B p={[2.3, 2.925, -4.55]} s={[2.0, 0.55, 0.1]} c={WALL} rad={0.01} />
      <B p={[-5.05, 1.6, -1]} s={[0.1, 3.2, 7]} c={WALL} rad={0.01} />
      <B p={[4.55, 1.6, -1]} s={[0.1, 3.2, 7]} c={WALL} rad={0.01} />
      <B p={[-0.25, 3.25, -1]} s={[9.7, 0.1, 7.2]} c={CEIL} rad={0.01} shadow={false} />
      <B p={[-0.25, 0.07, -4.48]} s={[9.5, 0.14, 0.04]} c={TRIM} rad={0.01} />
      <B p={[-4.98, 0.07, -1]} s={[0.04, 0.14, 7]} c={TRIM} rad={0.01} />
      <B p={[4.48, 0.07, -1]} s={[0.04, 0.14, 7]} c={TRIM} rad={0.01} />
    </group>
  )
}

// Racing-style gaming chair: bucket seat with side bolsters, winged backrest, head + lumbar pillows.
function GamingChair({ position }) {
  const back = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.2, 0)
    s.lineTo(0.2, 0)
    s.bezierCurveTo(0.26, 0.2, 0.22, 0.38, 0.27, 0.55) // shoulder wing
    s.bezierCurveTo(0.28, 0.66, 0.2, 0.7, 0.17, 0.74)
    s.bezierCurveTo(0.16, 0.86, 0.12, 0.92, 0.0, 0.93)
    s.bezierCurveTo(-0.12, 0.92, -0.16, 0.86, -0.17, 0.74)
    s.bezierCurveTo(-0.2, 0.7, -0.28, 0.66, -0.27, 0.55)
    s.bezierCurveTo(-0.22, 0.38, -0.26, 0.2, -0.2, 0)
    // harness slots
    const hole = (x) => {
      const h = new THREE.Path()
      h.absellipse(x, 0.68, 0.025, 0.045, 0, Math.PI * 2)
      return h
    }
    s.holes.push(hole(-0.1), hole(0.1))
    return new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 4, curveSegments: 18 })
  }, [])
  const BLACK = '#1d1e26'
  const ACCENT = '#d4573b'
  return (
    <group position={position}>
      {/* backrest, slightly reclined */}
      <group position={[0, 0.5, 0.27]} rotation={[0.14, 0, 0]}>
        <mesh geometry={back} position={[0, 0, -0.05]} castShadow>
          <Toon c={BLACK} />
        </mesh>
        <B p={[0, 0.45, 0.07]} s={[0.16, 0.7, 0.01]} c={ACCENT} rad={0.005} />
        <B p={[0, 0.8, -0.1]} s={[0.24, 0.1, 0.08]} c={BLACK} rad={0.04} />
        <B p={[0, 0.25, -0.1]} s={[0.3, 0.1, 0.07]} c={ACCENT} rad={0.035} />
      </group>
      {/* bucket seat */}
      <B p={[0, 0.46, 0]} s={[0.5, 0.09, 0.52]} c={BLACK} rad={0.04} />
      <B p={[-0.25, 0.5, 0]} s={[0.07, 0.12, 0.5]} c={BLACK} rad={0.035} />
      <B p={[0.25, 0.5, 0]} s={[0.07, 0.12, 0.5]} c={BLACK} rad={0.035} />
      <B p={[-0.25, 0.53, 0]} s={[0.075, 0.02, 0.4]} c={ACCENT} rad={0.008} />
      <B p={[0.25, 0.53, 0]} s={[0.075, 0.02, 0.4]} c={ACCENT} rad={0.008} />
      {/* 4D armrests */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Limb a={[s * 0.3, 0.44, 0.05]} b={[s * 0.3, 0.64, 0.02]} rad={0.018} c="#33353f" />
          <B p={[s * 0.3, 0.665, -0.02]} s={[0.07, 0.035, 0.26]} c={BLACK} rad={0.015} />
        </group>
      ))}
      {/* gas lift + 5-star base with wheels */}
      <Limb a={[0, 0.06, 0]} b={[0, 0.42, 0]} rad={0.032} c="#3b3e4a" />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 + 0.3
        const x = Math.cos(a) * 0.32
        const z = Math.sin(a) * 0.32
        return (
          <group key={i}>
            <Limb a={[0, 0.08, 0]} b={[x, 0.06, z]} rad={0.022} c="#2a2c36" />
            <mesh position={[x, 0.03, z]} rotation={[0, -a, Math.PI / 2]}>
              <cylinderGeometry args={[0.03, 0.03, 0.03, 14]} />
              <Toon c="#15161c" />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

export default function Room() {
  return (
    <group>
      <Outside windowCenter={[2.3, 1.8, -4.55]} windowSize={[2.0, 1.7]} />
      <Occluder>
        <Shell />
        <Rug />
        <EdisonLights />
        <RoomRGB />
        <WindowFrame />
        <Wall />
        <Setup />
        <Workbench />
        <GamingChair position={[-0.8, 0, -3.28]} />
        <Bed />
        <Lounge />
        <Guitar position={[3.55, 0, -3.35]} rotation={[0, -0.7, 0]} />
        <Basketball p={[-3.15, 0.12, 0.55]} />
        <Model url="./models/plant.json" height={0.95} position={[4.1, 0, -2.45]} rotation={[0, 0.6, 0]} />
        <Model url="./models/plant.json" height={0.7} position={[-2.75, 0, 2.15]} rotation={[0, 2.0, 0]} />
        <Hotspot id="me" labelAt={[-0.8, 1.6, -3.3]}>
          <Character position={[-0.8, 0, -3.28]} />
        </Hotspot>
      </Occluder>
    </group>
  )
}
