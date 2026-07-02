import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ParticleField = () => {
  const pointsRef = useRef();
  
  // Create random points in 3D space
  const particlesCount = 2500;
  const positions = useMemo(() => {
    const pos = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 25; // x
      pos[i * 3 + 1] = (Math.random() - 0.5) * 25; // y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 25; // z
    }
    return pos;
  }, []);

  // Smooth scroll interpolation
  const targetScroll = useRef(0);
  
  useFrame((state, delta) => {
    // Determine scroll progress 0 to 1 approx
    const scrollY = window.scrollY;
    // Handle cases where body might not be fully measured yet
    const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
    const scrollProgress = scrollY / maxScroll;
    
    // Lerp for smooth camera/particle movement
    targetScroll.current = THREE.MathUtils.lerp(targetScroll.current, scrollProgress, delta * 3);
    
    if (pointsRef.current) {
      // Rotate the entire particle field based on scroll and time
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.03 + targetScroll.current * Math.PI * 1.5;
      pointsRef.current.rotation.x = targetScroll.current * Math.PI * 0.5;
      // Move them slightly towards the camera on scroll
      pointsRef.current.position.z = targetScroll.current * 8;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#a1a1aa"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

const AbstractGeometries = () => {
  const groupRef = useRef();
  const targetScroll = useRef(0);

  const objects = useMemo(() => {
    return Array.from({ length: 20 }).map(() => ({
      position: [
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20 - 5
      ],
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
      scale: Math.random() * 0.6 + 0.2,
      speed: Math.random() * 0.2 + 0.05
    }));
  }, []);

  useFrame((state, delta) => {
    const scrollY = window.scrollY;
    const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
    const scrollProgress = scrollY / maxScroll;
    targetScroll.current = THREE.MathUtils.lerp(targetScroll.current, scrollProgress, delta * 3);

    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05 + targetScroll.current * Math.PI;
      groupRef.current.position.y = targetScroll.current * 12; // Objects float up as you scroll down
      
      // Rotate individual objects
      groupRef.current.children.forEach((child, i) => {
        child.rotation.x += delta * objects[i].speed;
        child.rotation.y += delta * objects[i].speed;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {objects.map((obj, i) => (
        <mesh key={i} position={obj.position} rotation={obj.rotation} scale={obj.scale}>
          <icosahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color="#3f3f46" wireframe transparent opacity={0.15} />
        </mesh>
      ))}
    </group>
  );
};

export default function CinematicBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -1, background: 'radial-gradient(circle at 50% 0%, #1a1a24 0%, #000 70%)', pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
        <fog attach="fog" args={['#000', 5, 20]} />
        <ParticleField />
        <AbstractGeometries />
      </Canvas>
    </div>
  );
}
