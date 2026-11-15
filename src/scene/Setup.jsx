import { useMemo, useRef } from 'react'
import { useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { B, Ball, Glow, Hotspot, Limb, Toon } from './parts'
import { codeScreen, sideScreen, serverGrill, bias } from './textures'

const DESK = '#1a1b23'
const METAL = '#2c2e3a'
const INK = '#20222d'
const tmp = new THREE.Color()

// One shared rainbow clock so every RGB light in the room flows together like a synced setup.
export function rgbAt(t, offset = 0, sat = 0.85, light = 0.58) {
  return tmp.setHSL((((t * 0.14 + offset) % 1) + 1) % 1, sat, light)
}

// A glowing strip whose colour follows the shared RGB clock.
// The colour runs along the strip as a moving rainbow wave, like real addressable LEDs.
const stripVert = /* glsl */ `
varying float vPos;
uniform float uAxis;
void main() {
  vPos = uAxis < 0.5 ? position.x : (uAxis < 1.5 ? position.y : position.z);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`
const stripFrag = /* glsl */ `
varying float vPos;
uniform float uTime; uniform float uOffset; uniform float uK;
vec3 hsl2rgb(float h, float s, float l) {
  vec3 rgb = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return l + s * (rgb - 0.5) * (1.0 - abs(2.0 * l - 1.0));
}
void main() {
  float h = fract(vPos * 0.35 - uTime * 0.22 + uOffset);
  // a soft bright pulse chasing along the strip
  float chase = 0.75 + 0.45 * pow(0.5 + 0.5 * sin(vPos * 6.0 - uTime * 3.0), 6.0);
  gl_FragColor = vec4(hsl2rgb(h, 0.85, 0.55) * uK * chase, 1.0);
}`
export function Strip({ p, s, r, offset = 0, k = 1.8 }) {
  const axis = s[0] >= s[1] && s[0] >= s[2] ? 0 : s[1] >= s[2] ? 1 : 2
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uOffset: { value: offset }, uK: { value: k }, uAxis: { value: axis } }), [offset, k, axis])
  useFrame(({ clock }) => (uniforms.uTime.value = clock.elapsedTime))
  return (
    <mesh position={p} rotation={r}>
      <boxGeometry args={s} />
      <shaderMaterial uniforms={uniforms} vertexShader={stripVert} fragmentShader={stripFrag} toneMapped={false} />
    </mesh>
  )
}

// Point light that follows the RGB clock, so the colours actually light the room.
export function RGBLight({ p, offset = 0, intensity = 1.2, distance = 2.5 }) {
  const l = useRef()
  useFrame(({ clock }) => l.current.color.copy(rgbAt(clock.elapsedTime, offset, 0.8, 0.55)))
  return <pointLight ref={l} position={p} intensity={intensity} distance={distance} />
}

function RGBRing({ p, r = 0.055, rot = [0, 0, 0], offset = 0 }) {
  const m = useRef()
  useFrame(({ clock }) => m.current.color.copy(rgbAt(clock.elapsedTime, offset)).multiplyScalar(2.2))
  return (
    <group position={p} rotation={rot}>
      <mesh>
        <torusGeometry args={[r, r * 0.12, 8, 28]} />
        <meshBasicMaterial ref={m} toneMapped={false} />
      </mesh>
      <mesh>
        <circleGeometry args={[r * 0.85, 20]} />
        <meshBasicMaterial color="#0c0d14" />
      </mesh>
    </group>
  )
}

// ---------- Gaming desk: black top, Z-legs, RGB edge, XXL mousepad, cable tray ----------
const DX = -0.6
const DZ = -4.12
const TOP = 0.75
function Desk() {
  return (
    <group>
      <B p={[DX, TOP - 0.02, DZ]} s={[2.8, 0.045, 0.76]} c={DESK} rad={0.018} />
      {/* RGB edge: front and both sides */}
      <Strip p={[DX, TOP - 0.035, DZ + 0.385]} s={[2.78, 0.012, 0.01]} offset={0.0} />
      <Strip p={[DX - 1.405, TOP - 0.035, DZ]} s={[0.01, 0.012, 0.74]} offset={0.25} />
      <Strip p={[DX + 1.405, TOP - 0.035, DZ]} s={[0.01, 0.012, 0.74]} offset={0.75} />
      <RGBLight p={[DX, 0.5, DZ + 0.45]} offset={0} intensity={1.4} distance={2.4} />
      {/* Z-shaped legs */}
      {[-1.25, 1.25].map((x) => (
        <group key={x} position={[DX + x, 0, DZ]}>
          <Limb a={[0, TOP - 0.05, -0.25]} b={[0, 0.06, 0.25]} rad={0.035} c={METAL} />
          <B p={[0, 0.03, 0]} s={[0.08, 0.05, 0.7]} c={METAL} rad={0.02} />
          <B p={[0, TOP - 0.07, 0]} s={[0.07, 0.04, 0.66]} c={METAL} rad={0.015} />
          {/* red accent caps, gaming-desk style */}
          <B p={[0, 0.03, 0.36]} s={[0.085, 0.055, 0.03]} c="#c23b3b" rad={0.01} />
        </group>
      ))}
      {/* cable tray + headphone hook + cup holder */}
      <B p={[DX, TOP - 0.15, DZ - 0.25]} s={[1.8, 0.08, 0.16]} c={METAL} rad={0.01} />
      <Limb a={[DX - 1.4, TOP - 0.05, DZ + 0.2]} b={[DX - 1.47, TOP - 0.14, DZ + 0.2]} rad={0.01} c={METAL} />
      <mesh position={[DX + 1.47, TOP - 0.04, DZ + 0.22]}>
        <torusGeometry args={[0.045, 0.008, 8, 20]} />
        <Toon c={METAL} />
      </mesh>
      {/* XXL mousepad with RGB border */}
      <B p={[DX - 0.1, TOP + 0.006, -3.92]} s={[1.0, 0.006, 0.38]} c="#1e2030" rad={0.003} shadow={false} />
      <Strip p={[DX - 0.1, TOP + 0.007, -3.92 + 0.19]} s={[1.0, 0.004, 0.006]} offset={0.1} />
      <Strip p={[DX - 0.1, TOP + 0.007, -3.92 - 0.19]} s={[1.0, 0.004, 0.006]} offset={0.3} />
    </group>
  )
}

// ---------- Keyboard with a per-key RGB wave ----------
function Keyboard() {
  const keys = useRef()
  const layout = useMemo(() => {
    const out = []
    for (let row = 0; row < 5; row++) for (let col = 0; col < 15; col++) out.push([-0.265 + col * 0.038, row])
    return out
  }, [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    layout.forEach(([x, row], i) => {
      dummy.position.set(x, TOP + 0.03 + (Math.random() < 0.004 ? -0.004 : 0), -3.98 + row * 0.036)
      dummy.updateMatrix()
      keys.current.setMatrixAt(i, dummy.matrix)
      keys.current.setColorAt(i, rgbAt(t, -x * 0.9 + row * 0.03, 0.8, 0.55).multiplyScalar(1.25))
    })
    keys.current.instanceMatrix.needsUpdate = true
    keys.current.instanceColor.needsUpdate = true
  })
  return (
    <group>
      <group position={[DX - 0.2, 0, 0]}>
        <B p={[0, TOP + 0.016, -3.905]} s={[0.62, 0.022, 0.21]} c="#262834" rad={0.01} />
        <instancedMesh ref={keys} args={[null, null, layout.length]}>
          <boxGeometry args={[0.032, 0.012, 0.031]} />
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
      </group>
      {/* gaming mouse with lit logo */}
      <Ball p={[DX + 0.25, TOP + 0.02, -3.9]} s={0.032} c="#262834" scale={[0.85, 0.55, 1.4]} />
      <Strip p={[DX + 0.25, TOP + 0.038, -3.885]} s={[0.012, 0.004, 0.012]} offset={0.5} k={2.5} />
    </group>
  )
}

// ---------- Monitors (real sizes: 34" ultrawide + 27") ----------
function Monitors() {
  const code = useMemo(() => codeScreen(), [])
  const side = useMemo(() => sideScreen(), [])
  const biasTex = useMemo(() => bias(), [])
  const biasMat = useRef()
  useFrame(({ clock }) => biasMat.current.color.copy(rgbAt(clock.elapsedTime * 0.6, 0.6, 0.75, 0.55)))
  const segs = [-1, 0, 1]
  const segTex = useMemo(() => segs.map((_, i) => {
    const t = code.clone()
    t.needsUpdate = true
    t.repeat.set(1 / 3, 1)
    t.offset.set(i / 3, 0)
    return t
  }), [code])
  return (
    <group>
      {/* RGB glow on the wall behind the screens */}
      <mesh position={[DX + 0.2, 1.2, -4.44]}>
        <planeGeometry args={[2.0, 1.0]} />
        <meshBasicMaterial ref={biasMat} map={biasTex} transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <RGBLight p={[DX, 1.2, -4.4]} offset={0.6} intensity={1.2} distance={2.2} />

      <Hotspot id="monitor" labelAt={[DX, 1.5, -4.3]}>
        {/* monitor arm from a desk clamp */}
        <B p={[DX, TOP + 0.03, -4.44]} s={[0.08, 0.06, 0.08]} c={METAL} rad={0.01} />
        <Limb a={[DX, TOP + 0.05, -4.44]} b={[DX, 1.1, -4.42]} rad={0.018} c={METAL} />
        <Limb a={[DX, 1.1, -4.42]} b={[DX, 1.17, -4.33]} rad={0.018} c={METAL} />
        {segs.map((k, i) => (
          <group key={i} position={[DX + k * 0.272, 1.17, -4.3 + Math.abs(k) * 0.03]} rotation={[0, -k * 0.16, 0]}>
            <B p={[0, 0, 0]} s={[0.278, 0.37, 0.025]} c="#15161e" rad={0.008} />
            <mesh position={[0, 0.005, 0.0135]} userData={{ glow: false }}>
              <planeGeometry args={[0.27, 0.34]} />
              <meshBasicMaterial toneMapped={false} color={[1.0, 1.0, 1.05]} map={segTex[i]} />
            </mesh>
          </group>
        ))}
        {/* webcam + light bar */}
        <B p={[DX - 0.12, 1.37, -4.29]} s={[0.07, 0.03, 0.03]} c="#111" rad={0.01} />
        <B p={[DX + 0.08, 1.375, -4.29]} s={[0.36, 0.022, 0.04]} c="#2b2d3a" rad={0.008} />
        <mesh position={[DX + 0.08, 1.363, -4.27]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.32, 0.016]} />
          <Glow c="#ffd9a8" k={2.6} />
        </mesh>
      </Hotspot>
      <pointLight position={[DX + 0.05, 1.32, -4.1]} intensity={1.2} distance={1.3} color="#ffd2a0" />

      <Hotspot id="monitor2" labelAt={[0.28, 1.45, -4.2]}>
        <group position={[0.28, 0, -4.2]} rotation={[0, -0.45, 0]}>
          <B p={[0, TOP + 0.012, 0.02]} s={[0.24, 0.02, 0.18]} c={METAL} rad={0.008} />
          <B p={[0, 0.94, -0.03]} s={[0.05, 0.34, 0.035]} c={METAL} rad={0.01} />
          <B p={[0, 1.17, 0]} s={[0.62, 0.37, 0.025]} c="#15161e" rad={0.008} />
          <mesh position={[0, 1.175, 0.0135]} userData={{ glow: false }}>
            <planeGeometry args={[0.6, 0.34]} />
            <meshBasicMaterial map={side} toneMapped={false} color={[1.0, 1.0, 1.05]} />
          </mesh>
        </group>
      </Hotspot>
    </group>
  )
}

// ---------- PC: glass case, GPU, AIO, RAM, RGB fans ----------
function PC() {
  const fans = useRef([])
  useFrame((_, d) => fans.current.forEach((f) => f && (f.rotation.z += d * 9)))
  const X = -1.75, Y = TOP, Z = -4.15
  return (
    <Hotspot id="github" labelAt={[X, Y + 0.68, Z]}>
      <group position={[X, Y, Z]}>
        <B p={[0, 0.27, 0]} s={[0.24, 0.54, 0.48]} c="#16171f" rad={0.018} />
        <mesh position={[0.122, 0.27, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.44, 0.5]} />
          <meshPhysicalMaterial color="#9fb3d9" transparent opacity={0.16} roughness={0.05} />
        </mesh>
        <mesh position={[-0.1, 0.29, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.4, 0.46]} />
          <Toon c="#12141b" />
        </mesh>
        {/* GPU */}
        <B p={[0.0, 0.15, 0.02]} s={[0.18, 0.055, 0.36]} c="#2a2d3b" rad={0.01} />
        <Strip p={[0.092, 0.15, 0.02]} s={[0.004, 0.012, 0.32]} offset={0.15} />
        <RGBRing p={[0.0, 0.12, -0.08]} r={0.04} rot={[Math.PI / 2, 0, 0]} offset={0.1} />
        <RGBRing p={[0.0, 0.12, 0.11]} r={0.04} rot={[Math.PI / 2, 0, 0]} offset={0.2} />
        {/* RAM */}
        {[0, 1, 2, 3].map((i) => (
          <group key={i}>
            <B p={[-0.055, 0.38, -0.04 + i * 0.024]} s={[0.065, 0.1, 0.011]} c="#1b1d27" rad={0.003} />
            <Strip p={[-0.055, 0.435, -0.04 + i * 0.024]} s={[0.065, 0.01, 0.012]} offset={i * 0.08} k={2} />
          </group>
        ))}
        <RGBRing p={[-0.075, 0.32, 0.11]} r={0.036} rot={[0, Math.PI / 2, 0]} offset={0.4} />
        {[0.11, 0.27, 0.43].map((y, i) => (
          <group key={i} position={[0, y, 0.242]}>
            <RGBRing p={[0, 0, 0]} r={0.056} offset={0.3 + i * 0.1} />
            <mesh ref={(el) => (fans.current[i] = el)} position={[0, 0, 0.002]}>
              <circleGeometry args={[0.045, 5]} />
              <meshBasicMaterial color="#1a1c28" transparent opacity={0.7} />
            </mesh>
          </group>
        ))}
        <B p={[0, 0.53, 0]} s={[0.18, 0.022, 0.4]} c="#10121a" rad={0.006} />
        <RGBLight p={[0.12, 0.3, 0]} offset={0.2} intensity={1.3} distance={1.4} />
        <Ball p={[0.07, 0.04, 0.242]} s={0.02} c="#f4f1ea" scale={[1, 1, 0.15]} />
      </group>
    </Hotspot>
  )
}

// ---------- Mug with coffee and wispy steam ----------
const steamFrag = /* glsl */ `
uniform float uTime; varying vec2 vUv;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
void main(){
  vec2 uv = vUv;
  uv.x += (n(vec2(uv.y*3.0 - uTime*0.6, 1.3)) - 0.5) * 0.35 * uv.y;
  float s = n(vec2(uv.x*4.0, uv.y*3.0 - uTime*0.45)) * 0.65 + n(vec2(uv.x*9.0, uv.y*7.0 - uTime*0.8)) * 0.35;
  s = smoothstep(0.42, 0.85, s);
  float edge = smoothstep(0.0, 0.25, uv.x) * smoothstep(1.0, 0.75, uv.x);
  float fade = smoothstep(0.0, 0.15, uv.y) * smoothstep(1.0, 0.45, uv.y);
  gl_FragColor = vec4(vec3(1.0, 0.97, 0.94), s * edge * fade * 0.6);
}`
export function Mug({ p }) {
  const steam = useRef()
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])
  const body = useMemo(() => {
    const pts = [[0, 0], [0.042, 0], [0.046, 0.005], [0.048, 0.1], [0.044, 0.1], [0.042, 0.012], [0, 0.012]]
    return new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 32)
  }, [])
  useFrame(({ clock, camera }) => {
    uniforms.uTime.value = clock.elapsedTime
    steam.current.rotation.y = Math.atan2(camera.position.x - p[0], camera.position.z - p[2])
  })
  return (
    <group>
      <mesh position={[p[0], p[1] + 0.003, p[2]]}>
        <cylinderGeometry args={[0.06, 0.06, 0.006, 24]} />
        <Toon c="#b5895b" />
      </mesh>
      <mesh geometry={body} position={[p[0], p[1] + 0.006, p[2]]} castShadow>
        <Toon c="#e8dcc6" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[p[0], p[1] + 0.085, p[2]]}>
        <cylinderGeometry args={[0.0485, 0.0485, 0.018, 32, 1, true]} />
        <Toon c="#4f6fa3" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[p[0], p[1] + 0.09, p[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.043, 28]} />
        <meshToonMaterial color="#3b2416" />
      </mesh>
      <mesh position={[p[0], p[1] + 0.0905, p[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.03, 0.043, 28]} />
        <meshToonMaterial color="#8a5a35" />
      </mesh>
      <mesh position={[p[0] + 0.05, p[1] + 0.055, p[2]]}>
        <torusGeometry args={[0.024, 0.007, 8, 16, Math.PI]} />
        <Toon c="#e8dcc6" />
      </mesh>
      <group ref={steam} position={[p[0], p[1] + 0.1, p[2]]}>
        <mesh position={[0, 0.13, 0]}>
          <planeGeometry args={[0.1, 0.26]} />
          <shaderMaterial transparent depthWrite={false} uniforms={uniforms} fragmentShader={steamFrag}
            vertexShader={`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`} />
        </mesh>
      </group>
    </group>
  )
}

// ---------- Arc floor lamp: warm light hanging over the desk ----------
function ArcLamp() {
  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.05, 0.05, -3.35),
    new THREE.Vector3(1.05, 1.4, -3.4),
    new THREE.Vector3(0.95, 2.15, -3.55),
    new THREE.Vector3(0.75, 2.25, -3.75),
    new THREE.Vector3(0.5, 2.0, -3.85),
  ]), [])
  return (
    <group>
      <mesh position={[1.05, 0.03, -3.35]} castShadow>
        <cylinderGeometry args={[0.16, 0.18, 0.05, 24]} />
        <Toon c="#2b2d3a" />
      </mesh>
      <mesh castShadow>
        <tubeGeometry args={[curve, 40, 0.013, 8, false]} />
        <Toon c="#c9a26a" />
      </mesh>
      <mesh position={[0.5, 1.9, -3.85]} castShadow>
        <coneGeometry args={[0.17, 0.2, 28, 1, true]} />
        <Toon c="#e7a45a" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.5, 1.83, -3.85]}>
        <sphereGeometry args={[0.045, 14, 10]} />
        <Glow c="#ffe2b0" k={4} />
      </mesh>
      <pointLight position={[0.5, 1.75, -3.85]} color="#ffb05a" intensity={6} distance={6} decay={1.5}
        castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.002} />
    </group>
  )
}

// ---------- Speakers: both pulse to the music, both open the music player ----------
function Speakers() {
  const cones = useRef([])
  useFrame(({ clock }) => cones.current.forEach((c) => c && c.scale.setScalar(1 + Math.max(0, Math.sin(clock.elapsedTime * 7.5)) * 0.05)))
  const one = (x, i) => (
    <group key={i} position={[x, TOP + 0.14, -4.32]} rotation={[0, i ? -0.25 : 0.25, 0]}>
      <B p={[0, 0, 0]} s={[0.15, 0.25, 0.16]} c="#c99a6a" rad={0.02} />
      <mesh ref={(el) => (cones.current[i] = el)} position={[0, -0.035, 0.082]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.048, 0.048, 0.008, 20]} />
        <Toon c="#2b2733" />
      </mesh>
      <mesh position={[0, 0.07, 0.082]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.008, 14]} />
        <Toon c="#2b2733" />
      </mesh>
      <Strip p={[0, -0.127, 0]} s={[0.15, 0.006, 0.16]} offset={0.4 + i * 0.3} />
    </group>
  )
  return (
    <Hotspot id="music" labelAt={[0.68, 1.12, -4.32]}>
      {one(-1.27, 0)}
      {one(0.7, 1)}
    </Hotspot>
  )
}

function Phone() {
  return (
    <Hotspot id="contact" labelAt={[0.48, 1.05, -3.92]}>
      <group position={[0.48, TOP, -3.92]} rotation={[0, -0.35, 0]}>
        <B p={[0, 0.01, 0]} s={[0.08, 0.02, 0.07]} c="#3a3d50" rad={0.008} />
        <group position={[0, 0.08, -0.01]} rotation={[-0.3, 0, 0]}>
          <B p={[0, 0, 0]} s={[0.075, 0.15, 0.01]} c="#1c1e2b" rad={0.008} />
          <mesh position={[0, 0, 0.0055]} userData={{ glow: false }}>
            <planeGeometry args={[0.066, 0.138]} />
            <Glow c="#5d7fd1" k={1.2} />
          </mesh>
        </group>
      </group>
    </Hotspot>
  )
}

// ---------- Mini server rack (skills) ----------
function Rack() {
  const leds = useRef()
  const count = 24
  const ledPos = useMemo(() => Array.from({ length: count }, (_, i) => [-0.18 + (i % 6) * 0.025, 0.25 + Math.floor(i / 6) * 0.2, 0.31]), [])
  const grill = useMemo(() => serverGrill(), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    ledPos.forEach((pp, i) => {
      dummy.position.set(...pp)
      dummy.updateMatrix()
      leds.current.setMatrixAt(i, dummy.matrix)
      const on = Math.sin(t * (3 + (i % 5)) + i * 1.7) > 0.2
      leds.current.setColorAt(i, tmp.set(i % 6 === 0 ? '#5fb6ff' : '#5dff8a').multiplyScalar(on ? 2.4 : 0.15))
    })
    leds.current.instanceMatrix.needsUpdate = true
    leds.current.instanceColor.needsUpdate = true
  })
  return (
    <Hotspot id="skills" labelAt={[4.0, 1.35, -4.1]}>
      <group position={[4.0, 0, -4.1]} rotation={[0, -0.25, 0]}>
        <B p={[0, 0.53, 0]} s={[0.55, 1.06, 0.6]} c="#151722" rad={0.02} />
        {[0.25, 0.45, 0.65, 0.85].map((y, i) => (
          <mesh key={i} position={[0, y, 0.302]}>
            <planeGeometry args={[0.48, 0.16]} />
            <meshToonMaterial map={grill} />
          </mesh>
        ))}
        <instancedMesh ref={leds} args={[null, null, count]}>
          <boxGeometry args={[0.012, 0.012, 0.004]} />
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
        <mesh position={[0, 0.53, 0.32]}>
          <planeGeometry args={[0.52, 1.0]} />
          <meshPhysicalMaterial color="#9fb3d9" transparent opacity={0.12} roughness={0.05} />
        </mesh>
        <pointLight position={[0, 0.6, 0.5]} color="#5dd0ff" intensity={0.6} distance={1.3} />
        <B p={[0, 1.09, 0]} s={[0.3, 0.035, 0.2]} c="#2b2d3a" rad={0.01} />
        <Strip p={[0, 1.07, 0.1]} s={[0.28, 0.006, 0.004]} offset={0.9} />
      </group>
    </Hotspot>
  )
}

// Small framed photo on the desk (a painted, low-detail version of the picture).
function PhotoFrame() {
  const map = useLoader(THREE.TextureLoader, './media/frame-photo.jpg')
  map.colorSpace = THREE.SRGBColorSpace
  return (
    <group position={[-1.5, TOP, -3.98]} rotation={[0, 0.55, 0]}>
      <group rotation={[-0.12, 0, 0]} position={[0, 0.1, 0]}>
        <B p={[0, 0, 0]} s={[0.15, 0.18, 0.015]} c="#c8955a" rad={0.006} />
        <mesh position={[0, 0, 0.0085]}>
          <planeGeometry args={[0.12, 0.15]} />
          <Toon map={map} c="#ffffff" />
        </mesh>
      </group>
      <Limb a={[0, 0.06, -0.01]} b={[0, 0.0, -0.07]} rad={0.004} c="#8a5a35" />
    </group>
  )
}

export default function Setup() {
  return (
    <group>
      <Desk />
      <Monitors />
      <Keyboard />
      <PC />
      <Mug p={[0.12, TOP, -3.85]} />
      <ArcLamp />
      <Speakers />
      <Phone />
      <Rack />
      <PhotoFrame />
      {/* notebook + pen */}
      <B p={[-1.25, TOP + 0.006, -3.9]} s={[0.17, 0.012, 0.23]} c="#d8cdb6" rad={0.004} r={[0, 0.3, 0]} />
      <Limb a={[-1.3, TOP + 0.016, -3.85]} b={[-1.2, TOP + 0.016, -3.98]} rad={0.004} c="#e07a3e" />
    </group>
  )
}
