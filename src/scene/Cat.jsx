import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Outlines } from '@react-three/drei'
import { Ball, Toon } from './parts'
import { tabby } from './textures'

const FUR = '#e59a52'
const CREAM = '#f6dfbd'
const LINE = '#4a2a17'

// An orange tabby curled up asleep on the window seat, tail wrapped around.
export default function Cat(props) {
  const body = useRef()
  const earL = useRef()
  const earR = useRef()
  const fur = useMemo(() => tabby(), [])
  const tail = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.16, 0.0, -0.02),
      new THREE.Vector3(-0.17, -0.03, 0.09),
      new THREE.Vector3(-0.05, -0.05, 0.15),
      new THREE.Vector3(0.09, -0.05, 0.14),
      new THREE.Vector3(0.16, -0.05, 0.08),
    ])
    return new THREE.TubeGeometry(curve, 30, 0.026, 10, false)
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    body.current.scale.set(1, 1 + Math.sin(t * 1.3) * 0.025, 1)
    // an ear twitch every few seconds
    const tw = Math.max(0, Math.sin(t * 0.9) - 0.96) * 12
    earL.current.rotation.z = 0.25 + tw * 0.3
    earR.current.rotation.z = -0.25
  })

  return (
    <group {...props}>
      <group ref={body}>
        {/* main body + haunch */}
        <mesh position={[0, 0, 0]} scale={[1.25, 0.62, 0.95]} castShadow>
          <sphereGeometry args={[0.14, 28, 20]} />
          <Toon map={fur} c="#ffffff" />
          <Outlines thickness={0.004} color={LINE} />
        </mesh>
        <mesh position={[-0.09, 0.015, -0.01]} scale={[1, 0.8, 1]} castShadow>
          <sphereGeometry args={[0.1, 24, 18]} />
          <Toon map={fur} c="#ffffff" />
          <Outlines thickness={0.004} color={LINE} />
        </mesh>
      </group>
      {/* tail wrapped round the front, pale tip */}
      <mesh geometry={tail} castShadow>
        <Toon c="#d98a43" />
        <Outlines thickness={0.003} color={LINE} />
      </mesh>
      <Ball p={[0.16, -0.05, 0.08]} s={0.027} c={CREAM} />
      {/* front paws tucked in */}
      <Ball p={[0.12, -0.06, 0.06]} s={0.035} c={CREAM} scale={[1.3, 0.6, 1]} />
      <Ball p={[0.13, -0.06, -0.01]} s={0.035} c={CREAM} scale={[1.3, 0.6, 1]} />
      {/* head resting on the paws */}
      <group position={[0.14, 0.02, 0.03]} rotation={[0.1, 0.4, -0.15]}>
        <mesh scale={[1, 0.88, 1.05]} castShadow>
          <sphereGeometry args={[0.075, 26, 20]} />
          <Toon map={fur} c="#ffffff" />
          <Outlines thickness={0.004} color={LINE} />
        </mesh>
        {/* muzzle + nose */}
        <Ball p={[0.06, -0.022, 0]} s={0.032} c={CREAM} scale={[0.8, 0.7, 1.1]} />
        <Ball p={[0.084, -0.008, 0]} s={0.008} c="#d9817b" />
        {/* closed eyes */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0.058, 0.012, s * 0.03]} rotation={[0, 0, 0.1]}>
            <torusGeometry args={[0.011, 0.0025, 6, 12, Math.PI]} />
            <meshBasicMaterial color="#3a2414" />
          </mesh>
        ))}
        {/* ears with pink insides */}
        <group ref={earL} position={[0.0, 0.06, 0.04]} rotation={[0.35, 0, 0.25]}>
          <mesh castShadow>
            <coneGeometry args={[0.028, 0.055, 4]} />
            <Toon c={FUR} />
            <Outlines thickness={0.003} color={LINE} />
          </mesh>
          <mesh position={[0.006, -0.004, 0]} scale={0.6}>
            <coneGeometry args={[0.028, 0.055, 4]} />
            <Toon c="#f2a7a0" />
          </mesh>
        </group>
        <group ref={earR} position={[0.0, 0.06, -0.04]} rotation={[-0.35, 0, -0.25]}>
          <mesh castShadow>
            <coneGeometry args={[0.028, 0.055, 4]} />
            <Toon c={FUR} />
            <Outlines thickness={0.003} color={LINE} />
          </mesh>
          <mesh position={[0.006, -0.004, 0]} scale={0.6}>
            <coneGeometry args={[0.028, 0.055, 4]} />
            <Toon c="#f2a7a0" />
          </mesh>
        </group>
        {/* whiskers */}
        {[-1, 1].map((s) => (
          <group key={'wh' + s}>
            {[0, 1].map((k) => (
              <mesh key={k} position={[0.075, -0.02 - k * 0.006, s * 0.035]} rotation={[0, s * 0.5, -0.1 + k * 0.15]}>
                <boxGeometry args={[0.001, 0.001, 0.05]} />
                <meshBasicMaterial color="#fff6e6" />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  )
}
