import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { buildingWindows } from './textures'
import { thunder } from '../audio'
import { useLab } from '../store'

// Shared weather state (lightning), read by the sky, the glass and the room light.
export const weather = { flash: 0, start: 0 }

// A real 3D city behind the window, so it shifts correctly as the camera moves.
function City() {
  const blocks = useMemo(() => {
    const out = []
    let seed = 1
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (let row = 0; row < 4; row++) {
      const z = -10 - row * 9
      for (let x = -6; x < 22; x += 2.2 + r() * 1.8) {
        const w = 1.6 + r() * 2.2
        const h = 6 + r() * (8 + row * 7)
        out.push({ x, z: z - r() * 3, w, d: 1.5 + r() * 2, h, tex: 1 + Math.floor(r() * 6) })
      }
    }
    return out
  }, [])
  return (
    <group position={[0, -9, 0]}>
      {blocks.map((b, i) => {
        const t = buildingWindows(b.tex).clone()
        t.needsUpdate = true
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        t.repeat.set(Math.max(1, b.w / 2), Math.max(1, b.h / 5))
        return (
          <mesh key={i} position={[b.x, b.h / 2, b.z]}>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshBasicMaterial map={t} color="#9aa6c8" />
          </mesh>
        )
      })}
      {/* rooftop beacons */}
      {blocks.filter((_, i) => i % 5 === 0).map((b, i) => (
        <mesh key={'r' + i} position={[b.x, b.h + 0.3, b.z]}>
          <sphereGeometry args={[0.12, 8, 6]} />
          <meshBasicMaterial color={[3, 0.4, 0.3]} toneMapped={false} />
        </mesh>
      ))}
      {/* street glow far below */}
      {Array.from({ length: 14 }).map((_, i) => (
        <mesh key={'s' + i} position={[-4 + i * 1.8, 0.4, -7.5 - (i % 3) * 0.8]}>
          <sphereGeometry args={[0.1, 8, 6]} />
          <meshBasicMaterial color={[2.6, 1.5, 0.6]} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

const skyFrag = /* glsl */ `
uniform float uFlash; uniform float uTime;
varying vec2 vUv;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
void main(){
  vec3 top = vec3(0.04,0.06,0.13), mid = vec3(0.12,0.12,0.22), low = vec3(0.32,0.2,0.2);
  vec3 col = mix(low, mid, smoothstep(0.0,0.35,vUv.y));
  col = mix(col, top, smoothstep(0.35,1.0,vUv.y));
  // slow heavy clouds lit from below by the city
  float c = n(vUv*vec2(6.,3.) + vec2(uTime*0.01,0.)) * 0.6 + n(vUv*vec2(13.,6.) - vec2(uTime*0.02,0.)) * 0.4;
  col += vec3(0.12,0.08,0.07) * smoothstep(0.4,0.9,c) * (1.0 - vUv.y);
  col += uFlash * vec3(0.6,0.65,0.9) * (0.4 + c);
  gl_FragColor = vec4(col,1.0);
}`
const basicVert = /* glsl */ `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`

function Sky() {
  const mat = useRef()
  const uniforms = useMemo(() => ({ uFlash: { value: 0 }, uTime: { value: 0 } }), [])
  useFrame(({ clock }) => {
    mat.current.uniforms.uFlash.value = weather.flash
    mat.current.uniforms.uTime.value = clock.elapsedTime
  })
  return (
    <mesh position={[6, 4, -60]}>
      <planeGeometry args={[140, 60]} />
      <shaderMaterial ref={mat} vertexShader={basicVert} fragmentShader={skyFrag} uniforms={uniforms} fog={false} toneMapped={false} />
    </mesh>
  )
}

// Falling rain outside: thin streaks moved on the GPU.
function Rain({ count = 2600 }) {
  const mat = useRef()
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 6)
    const seed = new Float32Array(count * 2)
    for (let i = 0; i < count; i++) {
      const x = -1 + Math.random() * 14
      const y = Math.random() * 14 - 6
      const z = -4.9 - Math.random() * 14
      pos.set([x, y, z, x - 0.03, y - 0.38, z], i * 6)
      const s = Math.random()
      seed.set([s, s], i * 2)
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('seed', new THREE.BufferAttribute(seed, 1))
    return g
  }, [count])
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])
  useFrame(({ clock }) => (mat.current.uniforms.uTime.value = clock.elapsedTime))
  return (
    <lineSegments geometry={geo} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          attribute float seed; uniform float uTime; varying float vA;
          void main(){
            vec3 p = position;
            float speed = 7.0 + seed * 4.0;
            p.y = mod(p.y - uTime * speed + 6.0, 14.0) - 6.0;
            p.x += (p.y) * 0.02;
            vA = 0.12 + seed * 0.16;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }`}
        fragmentShader={/* glsl */ `varying float vA; void main(){ gl_FragColor = vec4(0.7,0.78,0.95, vA); }`}
      />
    </lineSegments>
  )
}

// Window glass: transparent, with drops sliding down, small beads, and mist at the bottom.
const glassFrag = /* glsl */ `
uniform float uTime; uniform float uAspect; uniform float uFlash;
varying vec2 vUv;
float h11(float p){ return fract(sin(p*127.1)*43758.5453); }
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float beads(vec2 uv, float t){
  vec2 g = uv * vec2(42.0*uAspect, 42.0);
  vec2 id = floor(g); vec2 f = fract(g)-0.5;
  float r = h21(id);
  f -= (vec2(h21(id+1.3), h21(id+7.7))-0.5)*0.6;
  float life = fract(t*0.08 + r*10.0);
  float fade = smoothstep(0.0,0.05,life)*smoothstep(1.0,0.6,life);
  float rad = 0.08 + 0.14*h21(id+3.3);
  return smoothstep(rad, rad*0.5, length(f)) * fade * step(0.6, r);
}
float slide(vec2 uv, float t, float cols, out float trail){
  float cx = uv.x*cols; float id = floor(cx); float r = h11(id+0.17);
  float y = 1.2 - fract(t*(0.03+0.05*h11(id+4.2)) + r*13.0)*1.45;
  float x = fract(cx)-0.5 + 0.12*sin(uv.y*12.0 + r*6.28);
  vec2 d = vec2(x/cols*uAspect, uv.y - y);
  float rad = 0.011 + 0.008*r; float on = step(0.45, r);
  float tr = (1.0-smoothstep(0.0,0.003,abs(d.x))) * smoothstep(0.0,0.02,d.y) * smoothstep(0.35,0.0,d.y);
  trail = tr * smoothstep(0.35,0.65, fract(d.y*40.0+r)) * on;
  return smoothstep(rad, rad*0.4, length(d*vec2(1.0,0.75))) * on;
}
void main(){
  float t1, t2;
  float d = beads(vUv, uTime) + slide(vUv, uTime, 18.0, t1) + slide(vUv+vec2(0.31,0.0), uTime*1.2, 9.0, t2);
  d = clamp(d + t1*0.7 + t2*0.7, 0.0, 1.0);
  float mist = smoothstep(0.5, 0.0, vUv.y) * 0.22;
  vec3 col = mix(vec3(0.55,0.62,0.8), vec3(0.85,0.9,1.0), d);
  float a = 0.06 + mist + d*0.45;
  col += uFlash*0.4;
  gl_FragColor = vec4(col, a);
}`

export function Glass({ position, size }) {
  const mat = useRef()
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uAspect: { value: size[0] / size[1] }, uFlash: { value: 0 } }), [size])
  useFrame(({ clock }) => {
    mat.current.uniforms.uTime.value = clock.elapsedTime
    mat.current.uniforms.uFlash.value = weather.flash
  })
  return (
    <mesh position={position}>
      <planeGeometry args={size} />
      <shaderMaterial ref={mat} transparent depthWrite={false} vertexShader={basicVert} fragmentShader={glassFrag} uniforms={uniforms} toneMapped={false} />
    </mesh>
  )
}

// Lightning: rare and soft, with thunder rolling in a few seconds later.
function Lightning({ at }) {
  const light = useRef()
  const entered = useLab((s) => s.entered)
  const next = useRef(25)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (entered && t > next.current) {
      weather.start = t
      next.current = t + 45 + Math.random() * 50
      thunder(2 + Math.random() * 2)
    }
    const k = weather.start ? t - weather.start : 99
    weather.flash = k < 0.1 ? 0.7 : k < 0.18 ? 0.15 : k < 0.3 ? 0.55 : Math.max(0, 0.4 * Math.exp(-(k - 0.3) * 5))
    if (light.current) light.current.intensity = weather.flash * 8
  })
  return <pointLight ref={light} position={at} color="#c9d6ff" intensity={0} distance={10} />
}

export default function Outside({ windowCenter = [2.8, 1.8, -4.55], windowSize = [2.2, 1.7] }) {
  return (
    <group>
      <Sky />
      <City />
      <Rain />
      <Glass position={[windowCenter[0], windowCenter[1], windowCenter[2] + 0.02]} size={windowSize} />
      {/* cool city light spilling in */}
      <pointLight position={[windowCenter[0], windowCenter[1], windowCenter[2] + 0.9]} color="#6f86c9" intensity={1.4} distance={5} />
      <Lightning at={[windowCenter[0], windowCenter[1] + 0.3, windowCenter[2] + 0.8]} />
    </group>
  )
}
