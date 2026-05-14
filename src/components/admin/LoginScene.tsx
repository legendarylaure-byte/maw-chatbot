"use client";

import { useRef, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Text } from "@react-three/drei";
import * as THREE from "three";
import ErrorBoundary from "./ErrorBoundary";

function FloatingShapes({
  focused,
  submitting,
}: {
  focused: boolean;
  submitting: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const torusRef = useRef<THREE.Mesh>(null);
  const icoRef = useRef<THREE.Mesh>(null);
  const octRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const { pointer } = useThree();

  const [particleGeo] = useState(() => {
    const count = 250;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
      new THREE.Color("#3B6EF8"),
      new THREE.Color("#5B5BD6"),
      new THREE.Color("#9227a0"),
      new THREE.Color("#E91E8C"),
    ];
    for (let i = 0; i < count; i++) {
      const r = 2 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  });

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.x +=
        (pointer.y * 0.3 - groupRef.current.rotation.x) * 0.03;
      groupRef.current.rotation.y +=
        (pointer.x * 0.3 - groupRef.current.rotation.y) * 0.03;
    }
    const speed = submitting ? 3 : focused ? 1.5 : 0.5;
    if (torusRef.current) {
      torusRef.current.rotation.x += delta * speed;
      torusRef.current.rotation.y += delta * speed * 0.7;
    }
    if (icoRef.current) {
      icoRef.current.rotation.x += delta * speed * 0.5;
      icoRef.current.rotation.z += delta * speed;
    }
    if (octRef.current) {
      octRef.current.rotation.y += delta * speed * 0.8;
      octRef.current.rotation.x += delta * speed * 0.3;
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * speed * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={1.5} color="#3B6EF8" />
      <pointLight position={[-5, -3, -5]} intensity={0.8} color="#E91E8C" />

      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.6}>
        <Text fontSize={1.8} color="#E91E8C" anchorX="center" anchorY="middle">
          M
        </Text>
      </Float>
      <pointLight position={[0, 0.5, 0.5]} intensity={focused ? 1.2 : 0.4} color="#E91E8C" />

      <mesh ref={torusRef} position={[2.8, 0.8, -1.5]}>
        <torusKnotGeometry args={[0.4, 0.15, 64, 8]} />
        <meshStandardMaterial
          color="#3B6EF8"
          wireframe
          emissive="#3B6EF8"
          emissiveIntensity={focused ? 0.5 : 0.1}
        />
      </mesh>

      <mesh ref={icoRef} position={[-2.5, -0.8, -1.5]}>
        <icosahedronGeometry args={[0.35]} />
        <meshStandardMaterial
          color="#9227a0"
          wireframe
          emissive="#9227a0"
          emissiveIntensity={focused ? 0.5 : 0.1}
        />
      </mesh>

      <mesh ref={octRef} position={[1.5, -1.5, -2.5]}>
        <octahedronGeometry args={[0.3]} />
        <meshStandardMaterial
          color="#5B5BD6"
          wireframe
          emissive="#5B5BD6"
          emissiveIntensity={focused ? 0.3 : 0.05}
        />
      </mesh>

      <points ref={pointsRef} geometry={particleGeo}>
        <pointsMaterial
          size={0.04}
          vertexColors
          transparent
          opacity={0.7}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  );
}

export default function LoginScene({
  focused = false,
  submitting = false,
}: {
  focused?: boolean;
  submitting?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-0">
      <ErrorBoundary
        fallback={
          <div className="fixed inset-0 bg-gradient-to-br from-[#0A0A1A] via-[#1a0a2e] to-[#0A0A1A]" />
        }
      >
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }} dpr={[1, 2]}>
          <Suspense fallback={null}>
            <FloatingShapes focused={focused} submitting={submitting} />
          </Suspense>
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}
