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

// --- INTERACTIVE MOUSE/TOUCH SPOTLIGHT GATEWAY ---
export default function IntroAnimation({ onComplete, onExitStart }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const [spotlightRadius, setSpotlightRadius] = useState(200);

  // Initialize spotlight in the center of the screen and calculate responsive radius
  useEffect(() => {
    const initializeSpotlight = () => {
      const isMobile = window.innerWidth < 768;
      setSpotlightRadius(isMobile ? 120 : 220);
      setMousePos({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    };
    initializeSpotlight();
    window.addEventListener('resize', initializeSpotlight);
    return () => window.removeEventListener('resize', initializeSpotlight);
  }, []);

  // Handle Mouse Movement for the Spotlight
  const handleMouseMove = (e) => {
    if (isUnlocked) return;
    setMousePos({ x: e.clientX, y: e.clientY });
    if (!hasMoved) setHasMoved(true);
  };

  // Handle Touch/Drag for mobile screens
  const handleTouch = (e) => {
    if (isUnlocked) return;
    if (e.touches && e.touches[0]) {
      setMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      if (!hasMoved) setHasMoved(true);
    }
  };

  // The Unlock Sequence
  const handleUnlock = () => {
    if (isUnlocked) return;
    setIsUnlocked(true);
    
    // Play burst for 0.6s, then exit
    setTimeout(() => {
      setExiting(true);
      if (onExitStart) onExitStart();
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 1000); 
    }, 600);
  };

  return (
    <AnimatePresence>
      <motion.div
        onClick={handleUnlock}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
        initial={{ backgroundColor: '#0c0c0c' }}
        animate={{ 
          backgroundColor: exiting ? 'rgba(12, 12, 12, 0)' : '#0c0c0c',
          pointerEvents: exiting ? 'none' : 'auto'
        }}
        transition={{ duration: 0.9, ease: 'easeInOut' }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          userSelect: 'none',
          cursor: exiting ? 'default' : 'pointer',
          overflow: 'hidden'
        }}
      >
        {/* Action Burst Canvas (Rendered only on unlock) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: (isUnlocked && !exiting) ? 1 : 0 }}
          transition={{ duration: 0.1 }}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}
        >
          {isUnlocked && !exiting && (
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
            // Spotlight mask becomes full screen on exit to reveal the text completely
            WebkitMaskImage: `radial-gradient(circle ${exiting ? 2500 : spotlightRadius}px at ${mousePos.x}px ${mousePos.y}px, black 35%, transparent 100%)`,
            maskImage: `radial-gradient(circle ${exiting ? 2500 : spotlightRadius}px at ${mousePos.x}px ${mousePos.y}px, black 35%, transparent 100%)`,
            transition: 'mask-image 0.25s ease-out, -webkit-mask-image 0.25s ease-out'
          }}
          animate={{ 
            opacity: 1 
          }}
        >
          {/* Typography revealed by spotlight & morphing on exit */}
          {!exiting && (
            <motion.h1
              layoutId="heroName"
              style={{
                fontSize: 'clamp(2.5rem, 8vw, 6rem)',
                textTransform: 'uppercase',
                margin: 0,
                textAlign: 'center',
                color: '#ffffff',
                width: '90%',
                fontWeight: 300,
                letterSpacing: '0.15em',
                textShadow: '0 0 40px rgba(255,255,255,0.4)',
              }}
            >
              Jayasurya CJ
            </motion.h1>
          )}
          
          <motion.p
            animate={{
              opacity: exiting ? 0 : 1,
              y: exiting ? 15 : 0
            }}
            transition={{ duration: exiting ? 0.4 : 0.3 }}
            style={{
              fontSize: 'clamp(0.8rem, 1.5vw, 1.2rem)',
              fontWeight: 500,
              letterSpacing: '0.4em',
              color: '#a1a1aa',
              textTransform: 'uppercase',
              marginTop: '1.5rem',
              textAlign: 'center',
              width: '90%'
            }}
          >
            Software Engineer
          </motion.p>
        </motion.div>

        {/* Guide text (Always slightly visible to tell them what to do) */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: (isUnlocked || exiting) ? 0 : 0.4 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'absolute',
            bottom: '12%',
            fontSize: '0.78rem',
            fontWeight: 600,
            letterSpacing: '0.25em',
            color: '#ffffff',
            textTransform: 'uppercase',
            pointerEvents: 'none',
            zIndex: 5,
            textAlign: 'center',
            width: '90%',
            lineHeight: 1.5
          }}
        >
          Tap or drag to explore • Click anywhere to enter
        </motion.p>
      </motion.div>
    </AnimatePresence>
  );
}
