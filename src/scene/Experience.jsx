import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import Room from './Room'
import { Paint } from './Paint'
import { useLab, STATIONS, HOTSPOTS, walkInput } from '../store'

const spherical = (cam, target) => {
  const d = new THREE.Vector3(...cam).sub(new THREE.Vector3(...target))
  const s = new THREE.Spherical().setFromVector3(d)
  return s
}

// Station camera: glides between fixed shots; inside a shot you can only look around a little,
// so the camera can never end up inside a wall or the ceiling.
function Rig() {
  const ref = useRef()
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const focus = useLab((s) => s.focus)
  const entered = useLab((s) => s.entered)
  const station = useLab((s) => s.station)
  const walking = useLab((s) => s.walking)

  useEffect(() => {
    const c = ref.current
    if (!c || walking) return
    if (!entered) {
      c.setLookAt(2.6, 2.1, 2.2, ...STATIONS.room.target, false)
      return
    }
    const base = focus ? HOTSPOTS[focus] : STATIONS[station]
    // Tall phone screens see a much narrower slice of the room, so step the camera back
    // and widen the lens a little; everything in the shot (and its labels) stays on screen.
    const aspect = window.innerWidth / window.innerHeight
    const k = focus ? (aspect < 1 ? 1.25 : 1) : aspect < 0.8 ? 1.5 : aspect < 1.2 ? 1.2 : 1
    const cam = base.cam.map((x, i) => base.target[i] + (x - base.target[i]) * k)
    camera.fov = aspect < 0.8 ? 62 : 50
    camera.updateProjectionMatrix()
    const v = { cam, target: base.target }
    const sp = spherical(v.cam, v.target)
    // lock the orbit to a small window around this shot
    const look = focus ? 0 : 0.28
    c.minAzimuthAngle = sp.theta - look
    c.maxAzimuthAngle = sp.theta + look
    c.minPolarAngle = sp.phi - look * 0.5
    c.maxPolarAngle = sp.phi + look * 0.5
    c.minDistance = sp.radius * (focus ? 1 : 0.85)
    c.maxDistance = sp.radius
    c.setLookAt(...v.cam, ...v.target, true)
    const wide = window.innerWidth > 640
    const d = sp.radius
    const side = focus && focus !== 'monitor'
    c.setFocalOffset(side && wide ? d * 0.3 : 0, side && !wide ? -d * 0.22 : 0, 0, true)
  }, [focus, entered, station, walking, size.width, size.height])

  if (walking) return null
  return (
    <CameraControls
      ref={ref}
      makeDefault
      enabled={entered && !focus}
      smoothTime={0.7}
      truckSpeed={0}
      dollySpeed={0.3}
      azimuthRotateSpeed={0.5}
      polarRotateSpeed={0.4}
    />
  )
}

// ---------- Walk mode: first person, WASD / arrows + drag to look, with simple collisions ----------
const OBSTACLES = [
  [-2.05, 0.85, -4.5, -3.7], // desk
  [-1.15, -0.45, -3.65, -2.9], // chair
  [-5.0, -4.15, -4.0, -1.25], // workbench
  [-5.0, -3.35, 0.65, 2.5], // bed
  [3.65, 4.4, -4.5, -3.75], // rack
  [1.1, 3.5, -4.5, -3.95], // window seat
  [3.3, 3.8, -3.65, -3.05], // guitar
  [3.8, 4.4, -2.0, -1.4], // plant
  [0.85, 1.25, -3.55, -3.15], // lamp base
  [3.4, 4.5, -0.75, 1.45], // sofa
  [2.6, 3.1, 0.1, 0.6], // pouf
  [4.0, 4.5, -1.9, -0.7], // record console
  [-0.1, 0.9, 2.1, 2.5], // bookshelf
]
const R = 0.28
function blocked(x, z) {
  if (x < -4.7 || x > 4.2 || z < -4.2 || z > 2.2) return true
  return OBSTACLES.some(([x0, x1, z0, z1]) => x > x0 - R && x < x1 + R && z > z0 - R && z < z1 + R)
}


function Walker() {
  const { camera, gl } = useThree()
  const yaw = useRef(-0.25)
  const pitch = useRef(-0.08)
  const keys = useRef({})
  useEffect(() => {
    camera.position.set(0.9, 1.6, -0.6)
    const down = (e) => (keys.current[e.code] = true)
    const up = (e) => (keys.current[e.code] = false)
    let drag = null
    const pd = (e) => (drag = { x: e.clientX, y: e.clientY })
    const pm = (e) => {
      if (!drag) return
      yaw.current -= (e.clientX - drag.x) * 0.004
      pitch.current = THREE.MathUtils.clamp(pitch.current - (e.clientY - drag.y) * 0.003, -0.9, 0.7)
      drag = { x: e.clientX, y: e.clientY }
    }
    const pu = () => (drag = null)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    gl.domElement.addEventListener('pointerdown', pd)
    window.addEventListener('pointermove', pm)
    window.addEventListener('pointerup', pu)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      gl.domElement.removeEventListener('pointerdown', pd)
      window.removeEventListener('pointermove', pm)
      window.removeEventListener('pointerup', pu)
    }
  }, [camera, gl])
  useFrame((_, dt) => {
    const k = keys.current
    const f = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0) + walkInput.f
    const r = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0) + walkInput.r
    const turn = (k.ArrowLeft ? 1 : 0) - (k.ArrowRight ? 1 : 0)
    yaw.current += turn * dt * 1.6
    const speed = 1.6 * Math.min(dt, 0.05)
    const sx = -Math.sin(yaw.current), sz = -Math.cos(yaw.current)
    const nx = camera.position.x + (sx * f - sz * r) * speed
    const nz = camera.position.z + (sz * f + sx * r) * speed
    if (!blocked(nx, camera.position.z)) camera.position.x = nx
    if (!blocked(camera.position.x, nz)) camera.position.z = nz
    // gentle head bob while moving
    const moving = Math.abs(f) + Math.abs(r) > 0
    camera.position.y = 1.6 + (moving ? Math.sin(performance.now() * 0.009) * 0.015 : 0)
    camera.rotation.set(pitch.current, yaw.current, 0, 'YXZ')
  })
  return null
}

function Effects() {
  const small = typeof window !== 'undefined' && window.innerWidth < 700
  return (
    <EffectComposer multisampling={0}>
      <Paint radius={2} strength={small ? 0.15 : 0.25} />
      <Bloom mipmapBlur intensity={0.7} luminanceThreshold={0.72} luminanceSmoothing={0.25} />
      <Vignette offset={0.3} darkness={0.5} />
    </EffectComposer>
  )
}

export default function Experience() {
  const setFocus = useLab((s) => s.setFocus)
  const walking = useLab((s) => s.walking)
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ fov: 50, near: 0.05, far: 120, position: [2.6, 2.1, 2.2] }}
      gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.4 }}
      onPointerMissed={() => !walking && setFocus(null)}
    >
      <color attach="background" args={['#0a0e1c']} />
      <fog attach="fog" args={['#151b33', 7, 42]} />
      <hemisphereLight args={['#8090c8', '#4a3226', 0.85]} />
      <ambientLight intensity={0.4} color="#d9c6dc" />
      {/* warm fills so no corner falls into darkness */}
      <pointLight position={[-3.6, 2.2, -2.4]} color="#ffc48a" intensity={1.3} distance={5} />
      <pointLight position={[-3.5, 2.0, 1.2]} color="#ffb98a" intensity={1.0} distance={4.5} />
      <pointLight position={[2.8, 2.2, -2.6]} color="#ffd0a0" intensity={0.9} distance={4.5} />
      <pointLight position={[0.2, 2.9, -1.0]} color="#ffc68a" intensity={1.5} distance={9} />
      <pointLight position={[-2.5, 1.2, -1.0]} color="#ff9f6b" intensity={0.6} distance={5} />
      <Suspense fallback={null}>
        <Room />
      </Suspense>
      <Rig />
      {walking && <Walker />}
      <Effects />
    </Canvas>
  )
}
