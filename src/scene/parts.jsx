import { useEffect, useMemo, useRef, useState } from 'react'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'
import { Html, RoundedBox, Outlines } from '@react-three/drei'
import { useLab, HOTSPOTS } from '../store'

// Soft 4-step light ramp: the flat painted shading of anime films.
let ramp
export function toonRamp() {
  if (ramp) return ramp
  const steps = [95, 150, 205, 255]
  const data = new Uint8Array(steps.length * 4)
  steps.forEach((v, i) => data.set([v, v, v, 255], i * 4))
  ramp = new THREE.DataTexture(data, steps.length, 1, THREE.RGBAFormat)
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter
  ramp.needsUpdate = true
  return ramp
}

export function Toon({ c = '#888', e, ei = 1, map, ...rest }) {
  return (
    <meshToonMaterial
      color={c}
      map={map}
      gradientMap={toonRamp()}
      emissive={e || '#000000'}
      emissiveIntensity={e ? ei : 0}
      {...rest}
    />
  )
}

// Glowing material (screens, LEDs, bulbs): ignores lighting, feeds the bloom.
export function Glow({ c = '#fff', k = 1, ...rest }) {
  const color = useMemo(() => new THREE.Color(c).multiplyScalar(k), [c, k])
  return <meshBasicMaterial color={color} toneMapped={false} {...rest} />
}

const LINE = '#241a17'

// Rounded block: the basic building piece of the room.
export function B({ p = [0, 0, 0], s = [1, 1, 1], c = '#888', e, ei = 1, r, rad, shadow = true, glow, map, ol, ...rest }) {
  const radius = rad ?? Math.min(0.05, Math.min(...s) * 0.28)
  return (
    <RoundedBox
      args={s}
      radius={radius}
      smoothness={3}
      position={p}
      rotation={r}
      castShadow={shadow}
      receiveShadow
      userData={{ glow: glow !== false }}
      {...rest}
    >
      <Toon c={c} e={e} ei={ei} map={map} />
      {ol && <Outlines thickness={ol} color={LINE} />}
    </RoundedBox>
  )
}

export function Ball({ p, s = 0.1, c, e, ei, scale, r, map, ol, seg = 24, ...rest }) {
  return (
    <mesh position={p} rotation={r} scale={scale} castShadow receiveShadow userData={{ glow: true }} {...rest}>
      <sphereGeometry args={[s, seg, Math.round(seg * 0.75)]} />
      <Toon c={c} e={e} ei={ei} map={map} />
      {ol && <Outlines thickness={ol} color={LINE} />}
    </mesh>
  )
}

export function Pill({ p, r, len = 0.3, rad = 0.05, c, ol, ...rest }) {
  return (
    <mesh position={p} rotation={r} castShadow receiveShadow userData={{ glow: true }} {...rest}>
      <capsuleGeometry args={[rad, len, 6, 14]} />
      <Toon c={c} />
      {ol && <Outlines thickness={ol} color={LINE} />}
    </mesh>
  )
}

const UP = new THREE.Vector3(0, 1, 0)
// Capsule stretched between two points (arms, legs, tool handles).
export function Limb({ a, b, rad = 0.05, c, ol, rad2 }) {
  const { pos, quat, len } = useMemo(() => {
    const A = new THREE.Vector3(...a)
    const Bv = new THREE.Vector3(...b)
    const dir = Bv.clone().sub(A)
    const len = dir.length()
    return {
      pos: A.clone().add(Bv).multiplyScalar(0.5),
      quat: new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize()),
      len,
    }
  }, [a[0], a[1], a[2], b[0], b[1], b[2]])
  return (
    <mesh position={pos} quaternion={quat} castShadow receiveShadow userData={{ glow: true }}>
      {rad2 ? <cylinderGeometry args={[rad2, rad, len, 16]} /> : <capsuleGeometry args={[rad, Math.max(0.001, len), 6, 16]} />}
      <Toon c={c} />
      {ol && <Outlines thickness={ol} color={LINE} />}
    </mesh>
  )
}

const HOVER_GLOW = new THREE.Color('#ffd9a0')

// Makes an object clickable: warm hover glow, a firefly marker, and a camera fly-to.
// Only the object's own meshes belong inside, so the click area matches what you see.
export function Hotspot({ id, label, labelAt = [0, 0.4, 0], children }) {
  const ref = useRef()
  const hovered = useLab((s) => s.hovered === id)
  const focus = useLab((s) => s.focus)
  const entered = useLab((s) => s.entered)
  const setHovered = useLab((s) => s.setHovered)
  const setFocus = useLab((s) => s.setFocus)

  useEffect(() => {
    ref.current.traverse((o) => {
      if (!o.isMesh || !o.userData.glow) return
      const m = o.material
      if (!m || !m.emissive) return
      if (o.userData.baseE === undefined) {
        o.userData.baseE = m.emissive.clone()
        o.userData.baseEi = m.emissiveIntensity
      }
      if (hovered) {
        m.emissive.copy(HOVER_GLOW)
        m.emissiveIntensity = 0.25
      } else {
        m.emissive.copy(o.userData.baseE)
        m.emissiveIntensity = o.userData.baseEi
      }
    })
    document.body.style.cursor = hovered ? 'pointer' : ''
  }, [hovered])

  const station = useLab((s) => s.station)
  const walking = useLab((s) => s.walking)
  const text = label ?? HOTSPOTS[id].label
  const home = HOTSPOTS[id].station
  const showMarker = entered && !focus && (walking || station === home)

  return (
    <group
      ref={ref}
      onPointerOver={(e) => { e.stopPropagation(); if (!focus) setHovered(id) }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(null) }}
      onClick={(e) => { e.stopPropagation(); if (!focus) setFocus(id) }}
    >
      {children}
      {showMarker && (
        <Html position={labelAt} center zIndexRange={[20, 0]}>
          <button
            type="button"
            className={`tag ${hovered ? 'is-hover' : ''}`}
            onClick={() => setFocus(id)}
            onPointerEnter={() => setHovered(id)}
            onPointerLeave={() => setHovered(null)}
          >
            <span className="tag-pin" aria-hidden="true" />
            {text}
          </button>
        </Html>
      )}
    </group>
  )
}

// Wrap static scenery in this so it blocks clicks to objects behind it
// (otherwise you could click a monitor through a wall).
export function Occluder({ children }) {
  const stop = (e) => e.stopPropagation()
  const out = () => useLab.getState().setHovered(null)
  return (
    <group onClick={stop} onPointerOver={(e) => { stop(e); out() }} onPointerMove={stop}>
      {children}
    </group>
  )
}

// Loads a free CC0 glTF model, repaints it with the same soft toon shading, and fits it to a height.
// Models ship as .json glTF with the mesh data embedded as base64. Some hosts block fetching data: URLs,
// so the base64 is decoded here and the model is parsed straight from memory.
const modelCache = {}
function loadModel(url) {
  if (!modelCache[url]) {
    modelCache[url] = fetch(url)
      .then((r) => r.json())
      .then((js) => {
        const b64 = js.buffers[0].uri.split(',')[1]
        const raw = atob(b64)
        const bin = new Uint8Array(raw.length)
        for (let i = 0; i < raw.length; i++) bin[i] = raw.charCodeAt(i)
        delete js.buffers[0].uri
        js.buffers[0].byteLength = bin.length
        // pack JSON + binary into one GLB in memory
        let jsonBytes = new TextEncoder().encode(JSON.stringify(js))
        const jsonPad = (4 - (jsonBytes.length % 4)) % 4
        const binPad = (4 - (bin.length % 4)) % 4
        const total = 12 + 8 + jsonBytes.length + jsonPad + 8 + bin.length + binPad
        const buf = new ArrayBuffer(total)
        const dv = new DataView(buf)
        const u8 = new Uint8Array(buf)
        dv.setUint32(0, 0x46546c67, true)
        dv.setUint32(4, 2, true)
        dv.setUint32(8, total, true)
        dv.setUint32(12, jsonBytes.length + jsonPad, true)
        dv.setUint32(16, 0x4e4f534a, true)
        u8.set(jsonBytes, 20)
        u8.fill(0x20, 20 + jsonBytes.length, 20 + jsonBytes.length + jsonPad)
        let o = 20 + jsonBytes.length + jsonPad
        dv.setUint32(o, bin.length + binPad, true)
        dv.setUint32(o + 4, 0x004e4942, true)
        u8.set(bin, o + 8)
        return new Promise((res, rej) => new GLTFLoader().parse(buf, '', res, rej))
      })
  }
  return modelCache[url]
}

export function Model(props) {
  const [scene, setScene] = useState(null)
  useEffect(() => {
    let alive = true
    loadModel(props.url).then((g) => alive && setScene(g.scene)).catch((e) => console.warn('model failed', props.url, e))
    return () => { alive = false }
  }, [props.url])
  if (!scene) return null
  return <FittedModel scene={scene} {...props} />
}

function FittedModel({ scene, height = 1, position, rotation, tint, onlyColor }) {
  const obj = useMemo(() => {
    const root = scene.clone(true)
    root.traverse((o) => {
      if (!o.isMesh) return
      o.castShadow = true
      o.receiveShadow = true
      const src = o.material
      const c = (src.color || new THREE.Color('#888')).clone()
      if (tint) {
        const key = Object.keys(tint).find((k) => (src.name || '').toLowerCase().includes(k.toLowerCase()))
        if (key) c.set(tint[key])
      }
      o.material = new THREE.MeshToonMaterial({
        color: c,
        gradientMap: toonRamp(),
        map: onlyColor ? null : src.map || null,
        alphaMap: src.alphaMap || null,
        alphaTest: src.alphaTest || (src.map && src.transparent ? 0.4 : 0),
        transparent: false,
        side: src.side,
      })
      o.userData.glow = true
    })
    const box = new THREE.Box3().setFromObject(root)
    const size = box.getSize(new THREE.Vector3())
    const k = height / size.y
    root.scale.setScalar(k)
    const box2 = new THREE.Box3().setFromObject(root)
    const center = box2.getCenter(new THREE.Vector3())
    root.position.set(-center.x, -box2.min.y, -center.z)
    const wrap = new THREE.Group()
    wrap.add(root)
    return wrap
  }, [scene, height])
  return <primitive object={obj} position={position} rotation={rotation} />
}
