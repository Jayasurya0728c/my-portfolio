import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/*
 * Spotlight Interactive Intro (Mouse Movement)
 * 
 * Features:
 * - Pitch black screen. Text is revealed only where the mouse cursor hovers (Spotlight effect).
 * - "Click to Enter" interaction.
 * - Minimal, hyper-fast cinematic action burst (0.6s) upon clicking.
 */

const premiumEase = [0.16, 1, 0.3, 1]; 

// --- MINIMAL ACTION BURST (Plays upon unlock) ---
const FastLines = () => {
  const lineGeo = React.useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 200;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100 - 50;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return geo;
  }, []);

  return (
    <points geometry={lineGeo}>
      <pointsMaterial color="#ffffff" size={0.3} sizeAttenuation={true} transparent opacity={0.7} />
    </points>
  );
};

const ActionCamera = () => {
  useFrame((state, delta) => {
    // Hyper-fast forward dive for the cinematic burst
    state.camera.position.z -= delta * 150;
    state.camera.fov = THREE.MathUtils.damp(state.camera.fov, 140, 15, delta);
    state.camera.updateProjectionMatrix();
  });
  return null;
};

// --- INTERACTIVE MOUSE SPOTLIGHT GATEWAY ---
export default function IntroAnimation({ onComplete }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);

  // Handle Mouse Movement for the Spotlight
  const handleMouseMove = (e) => {
    if (isUnlocked) return;
    setMousePos({ x: e.clientX, y: e.clientY });
    if (!hasMoved) setHasMoved(true);
  };

  // The Unlock Sequence
  const handleUnlock = () => {
    if (isUnlocked) return;
    setIsUnlocked(true);
    
    // Play burst for 0.6s, then exit
    setTimeout(() => {
      setExiting(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 1000); 
    }, 600);
  };

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          onClick={handleUnlock}
          onMouseMove={handleMouseMove}
          initial={{ y: 0 }}
          exit={{ 
            y: '-100vh', 
            transition: { duration: 1.0, ease: [0.76, 0, 0.24, 1] } 
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: '#0c0c0c',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            userSelect: 'none',
            cursor: 'pointer',
            overflow: 'hidden'
          }}
        >
          {/* Action Burst Canvas (Rendered only on unlock) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isUnlocked ? 1 : 0 }}
            transition={{ duration: 0.1 }}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}
          >
            {isUnlocked && (
              <Canvas camera={{ position: [0, 0, 50], fov: 60, near: 0.1, far: 200 }}>
                <FastLines />
                <ActionCamera />
              </Canvas>
            )}
          </motion.div>

          {/* The Spotlight Masking Layer */}
          <motion.div 
            style={{ 
              position: 'absolute', 
              inset: 0, 
              zIndex: 10,
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              // Use CSS mask-image to create a radial gradient "spotlight" at the mouse cursor
              WebkitMaskImage: hasMoved 
                ? `radial-gradient(circle 250px at ${mousePos.x}px ${mousePos.y}px, black 10%, transparent 100%)`
                : `radial-gradient(circle 0px at center, black 0%, transparent 0%)`,
              maskImage: hasMoved 
                ? `radial-gradient(circle 250px at ${mousePos.x}px ${mousePos.y}px, black 10%, transparent 100%)`
                : `radial-gradient(circle 0px at center, black 0%, transparent 0%)`,
              transition: 'mask-image 0.1s ease-out, -webkit-mask-image 0.1s ease-out'
            }}
            animate={{ opacity: isUnlocked ? 0 : 1, scale: isUnlocked ? 1.1 : 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {/* Typography revealed by spotlight */}
            <h1
              style={{
                fontSize: 'clamp(3rem, 8vw, 6rem)',
                fontWeight: 300,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                margin: 0,
                textAlign: 'center',
                textShadow: '0 0 40px rgba(255,255,255,0.4)',
                color: '#ffffff'
              }}
            >
              Jayasurya CJ
            </h1>
            
            <p
              style={{
                fontSize: 'clamp(0.9rem, 1.5vw, 1.2rem)',
                fontWeight: 500,
                letterSpacing: '0.4em',
                color: '#a1a1aa',
                textTransform: 'uppercase',
                marginTop: '1.5rem',
                textAlign: 'center'
              }}
            >
              Software Engineer
            </p>
          </motion.div>

          {/* Guide text (Always slightly visible to tell them what to do) */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: isUnlocked ? 0 : 0.3 }}
            transition={{ duration: 1.0, delay: 1.0 }}
            style={{
              position: 'absolute',
              bottom: '15%',
              fontSize: '0.85rem',
              fontWeight: 600,
              letterSpacing: '0.3em',
              color: '#ffffff',
              textTransform: 'uppercase',
              pointerEvents: 'none',
              zIndex: 5
            }}
          >
            {!hasMoved ? "Move cursor to explore" : "Click anywhere to enter"}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
