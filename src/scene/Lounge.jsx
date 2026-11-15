import { useMemo } from 'react'
import * as THREE from 'three'
import { B, Ball, Glow, Limb, Model, Toon } from './parts'
import { blueprintArm } from './textures'

// The front half of the room: sofa corner with a record player, a bookshelf,
// a small gym corner by the bed, plants and a warm corner lamp.
const WOOD = '#9a6640'
const WOOD_DARK = '#5e3d29'
const BOOK = ['#b85c4f', '#5e7fa8', '#7da36a', '#d9b25e', '#8a6ab0', '#c8742f', '#3f5f7f', '#e0c36a']

function Bookshelf({ position, rotation }) {
  const books = useMemo(() => {
    const out = []
    let seed = 3
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (let shelf = 0; shelf < 4; shelf++) {
      let x = -0.42
      while (x < 0.38) {
        const w = 0.03 + r() * 0.03
        const h = 0.2 + r() * 0.08
        if (r() > 0.12) out.push({ p: [x + w / 2, 0.36 + shelf * 0.4 + h / 2, 0], s: [w, h, 0.2], c: BOOK[Math.floor(r() * BOOK.length)], lean: r() > 0.9 ? 0.2 : 0 })
        x += w + 0.004
      }
    }
    return out
  }, [])
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 1.0, -0.02]} s={[0.95, 2.0, 0.3]} c={WOOD_DARK} rad={0.02} />
      {[0, 1, 2, 3, 4].map((i) => (
        <B key={i} p={[0, 0.34 + i * 0.4, 0.02]} s={[0.88, 0.03, 0.28]} c={WOOD} rad={0.008} />
      ))}
      {books.map((b, i) => (
        <B key={i} p={[b.p[0], b.p[1], 0.03]} s={b.s} c={b.c} rad={0.006} r={[0, 0, b.lean]} />
      ))}
      {/* small things on the top shelf */}
      <Model url="./models/soda.json" height={0.12} position={[0.3, 1.95, 0.03]} />
      <Ball p={[-0.3, 1.99, 0.03]} s={0.06} c="#d9a441" />
    </group>
  )
}

function RecordConsole({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0.3, 0]} s={[1.1, 0.6, 0.42]} c={WOOD} rad={0.02} />
      {[-0.4, -0.13, 0.13, 0.4].map((x) => (
        <B key={x} p={[x, 0.3, 0.215]} s={[0.24, 0.5, 0.01]} c={WOOD_DARK} rad={0.004} />
      ))}
      <Model url="./models/turntable.json" height={0.13} position={[-0.2, 0.6, 0]} />
      {/* crate of records */}
      <B p={[0.32, 0.72, 0]} s={[0.34, 0.24, 0.32]} c="#c8955a" rad={0.01} />
      {[0, 1, 2, 3, 4].map((i) => (
        <B key={i} p={[0.22 + i * 0.05, 0.8, 0]} s={[0.012, 0.3, 0.3]} c={['#2a2a2a', '#b85c4f', '#3f5f7f', '#e0c36a', '#2a2a2a'][i]} rad={0.003} r={[0, 0, 0.12]} />
      ))}
    </group>
  )
}

function Dumbbell({ p, r = 0 }) {
  return (
    <group position={p} rotation={[0, r, 0]}>
      <Limb a={[-0.16, 0.06, 0]} b={[0.16, 0.06, 0]} rad={0.015} c="#8d94a6" />
      {[-0.13, 0.13].map((x) => (
        <mesh key={x} position={[x, 0.06, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.06, 18]} />
          <Toon c="#2b2d3a" />
        </mesh>
      ))}
    </group>
  )
}

function CornerLamp({ p }) {
  return (
    <group position={p}>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.15, 0.17, 0.04, 20]} />
        <Toon c="#2b2d3a" />
      </mesh>
      <Limb a={[0, 0.02, 0]} b={[0, 1.45, 0]} rad={0.012} c="#c9a26a" />
      <mesh position={[0, 1.55, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.22, 0.28, 24, 1, true]} />
        <Toon c="#efdcb8" side={THREE.DoubleSide} e="#ffcf8a" ei={0.4} />
      </mesh>
      <pointLight position={[0, 1.5, 0]} color="#ffb877" intensity={2.2} distance={4.5} />
    </group>
  )
}

function Painting({ p, r }) {
  const map = useMemo(() => blueprintArm(), [])
  return (
    <group position={p} rotation={r}>
      <B p={[0, 0, 0]} s={[1.0, 0.72, 0.03]} c="#2b2118" rad={0.008} />
      <mesh position={[0, 0, 0.017]}>
        <planeGeometry args={[0.92, 0.64]} />
        <Toon map={map} c="#ffffff" />
      </mesh>
    </group>
  )
}

export default function Lounge() {
  return (
    <group>
      {/* sofa against the right wall, facing into the room */}
      <Model url="./models/sofa.json" height={0.85} position={[3.95, 0, 0.35]} rotation={[0, -Math.PI / 2, 0]} tint={{ fabric: '#5b6f9e' }} />
      <B p={[3.85, 0.55, -0.35]} s={[0.12, 0.34, 0.38]} c="#e9c46a" rad={0.06} r={[0, 0, -0.2]} />
      <B p={[3.85, 0.55, 1.0]} s={[0.12, 0.34, 0.38]} c="#b3634a" rad={0.06} r={[0, 0, -0.15]} />
      <Painting p={[4.48, 1.75, 0.35]} r={[0, -Math.PI / 2, 0]} />
      {/* pouf as a coffee table, with a book and a mug */}
      <Model url="./models/pouf.json" height={0.42} position={[2.85, 0, 0.35]} tint={{ silk: '#c99050' }} />
      <B p={[2.82, 0.44, 0.3]} s={[0.2, 0.035, 0.15]} c="#5e7fa8" rad={0.008} r={[0, 0.4, 0]} />
      <RecordConsole position={[4.25, 0, -1.3]} rotation={[0, -Math.PI / 2, 0]} />
      <Model url="./models/fern.json" height={0.9} position={[4.1, 0, 1.85]} />
      <Bookshelf position={[0.4, 0, 2.38]} rotation={[0, Math.PI, 0]} />
      <CornerLamp p={[1.35, 0, 2.2]} />
      {/* gym corner by the bed */}
      <B p={[-2.4, 0.008, 1.6]} s={[0.65, 0.012, 1.7]} c="#4f8a55" rad={0.004} shadow={false} />
      <Dumbbell p={[-2.25, 0, 0.75]} r={0.3} />
      <Dumbbell p={[-2.55, 0, 0.8]} r={-0.2} />
      {/* table tennis paddles on the wall */}
      {[[0.1, 0], [0.35, 0.25]].map(([z, rot], i) => (
        <group key={i} position={[-4.97, 1.25, z]} rotation={[0, Math.PI / 2, rot]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.012, 24]} />
            <Toon c={i ? '#2b2d3a' : '#c23b3b'} />
          </mesh>
          <B p={[0, -0.12, 0]} s={[0.03, 0.1, 0.02]} c="#c8955a" rad={0.008} />
        </group>
      ))}
      {/* laundry basket with a hoodie spilling out */}
      <group position={[-1.75, 0, 2.2]}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.18, 0.4, 20, 1, true]} />
          <Toon c="#d8c7a6" side={THREE.DoubleSide} />
        </mesh>
        <Ball p={[0.05, 0.38, 0]} s={0.16} c="#3e5c86" scale={[1.2, 0.5, 1]} />
      </group>
      {/* hanging plant from the ceiling */}
      <group position={[2.6, 0, 1.7]}>
        <Limb a={[0, 3.2, 0]} b={[0, 2.5, 0]} rad={0.004} c="#5e3d29" />
        <mesh position={[0, 2.42, 0]} castShadow>
          <sphereGeometry args={[0.13, 18, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <Toon c="#e8dcc3" side={THREE.DoubleSide} />
        </mesh>
        <Model url="./models/plant.json" height={0.35} position={[0, 2.38, 0]} />
      </group>
      {/* string of warm light along the front-left wall above the bed */}
      <mesh position={[-4.95, 2.4, 1.5]}>
        <boxGeometry args={[0.02, 0.02, 1.6]} />
        <Glow c="#ffb867" k={1.4} />
      </mesh>
      <pointLight position={[-4.6, 2.3, 1.5]} color="#ffb867" intensity={0.9} distance={3} />
    </group>
  )
}
