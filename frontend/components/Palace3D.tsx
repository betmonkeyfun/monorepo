'use client';

import { useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, Float, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP ScrollTrigger
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Casino Palace Model Component - LOADING THE REAL DEAL!
function PalaceModel({ scrollProgress }: { scrollProgress: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Group>(null);
  const leftDoorRef = useRef<THREE.Object3D | null>(null);
  const rightDoorRef = useRef<THREE.Object3D | null>(null);

  // LOAD THE ACTUAL PALACE.GLB MODEL!
  const { scene } = useGLTF('/models/palace.glb');

  useEffect(() => {
    if (!scene || !group.current) return;

    // Clone the scene to avoid issues with multiple instances
    const clonedScene = scene.clone();

    // Add the model to our group
    if (modelRef.current) {
      group.current.remove(modelRef.current);
    }
    modelRef.current = clonedScene;
    group.current.add(clonedScene);

    // Traverse the model to find doors and enhance materials
    clonedScene.traverse((child) => {
      // Look for door objects (common naming patterns)
      const name = child.name.toLowerCase();
      if (name.includes('left') && (name.includes('door') || name.includes('gate'))) {
        leftDoorRef.current = child;
      }
      if (name.includes('right') && (name.includes('door') || name.includes('gate'))) {
        rightDoorRef.current = child;
      }

      // Enhance materials for casino vibe
      if (child instanceof THREE.Mesh) {
        if (child.material) {
          // Make materials more reflective and casino-like
          const material = child.material as THREE.MeshStandardMaterial;
          if (material.color) {
            // Add some metallic shine to golden colors
            if (material.color.getHex() === 0xffd700 ||
                material.color.r > 0.8 && material.color.g > 0.6) {
              material.metalness = Math.max(material.metalness || 0, 0.6);
              material.roughness = Math.min(material.roughness || 1, 0.3);
            }
          }
        }
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Calculate bounding box to auto-scale the model
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Scale the model to fit the scene perfectly
    const maxDimension = Math.max(size.x, size.y, size.z);
    const targetSize = 10; // Target size for the model
    const scale = targetSize / maxDimension;

    clonedScene.scale.set(scale, scale, scale);

    // Center the model
    clonedScene.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

  }, [scene]);

  // Animate based on scroll progress
  useFrame(() => {
    if (!modelRef.current) return;

    const progress = scrollProgress.current;

    // 40-60% scroll: Rotate the palace
    if (progress >= 0.4 && progress <= 0.6) {
      const rotateProgress = (progress - 0.4) / 0.2;
      const targetRotation = rotateProgress * Math.PI / 4; // 45 degrees
      modelRef.current.rotation.y = THREE.MathUtils.lerp(
        modelRef.current.rotation.y,
        targetRotation,
        0.1
      );
    }

    // 20-40% scroll: Open doors if found
    if (leftDoorRef.current && rightDoorRef.current) {
      if (progress >= 0.2 && progress <= 0.4) {
        const doorProgress = (progress - 0.2) / 0.2;
        const angle = doorProgress * Math.PI / 2; // 90 degrees

        leftDoorRef.current.rotation.y = -angle;
        rightDoorRef.current.rotation.y = angle;
      }
    }
  });

  return (
    <group ref={group} position={[0, 0.5, 0]} rotation={[0, 0, 0]}>
      {/* The loaded palace model is added in useEffect */}
    </group>
  );
}

// Floating particles for atmosphere
function CasinoParticles() {
  const particlesRef = useRef<THREE.Points>(null);

  useEffect(() => {
    if (!particlesRef.current) return;

    const positions = particlesRef.current.geometry.attributes.position;
    const count = positions.count;

    for (let i = 0; i < count; i++) {
      positions.setXYZ(
        i,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50
      );
    }
    positions.needsUpdate = true;
  }, []);

  useFrame((state) => {
    if (!particlesRef.current) return;
    particlesRef.current.rotation.y += 0.0002;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={1000}
          array={new Float32Array(1000 * 3)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#FFD700"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// Camera controller for scroll animations
function CameraController({ scrollProgress }: { scrollProgress: React.MutableRefObject<number> }) {
  const { camera } = useThree();

  useFrame(() => {
    const progress = scrollProgress.current;

    // 0% to 20%: Zoom EVEN CLOSER into palace entrance
    if (progress <= 0.2) {
      const zoomProgress = progress / 0.2;
      camera.position.z = THREE.MathUtils.lerp(12, 4, zoomProgress);
      camera.position.y = THREE.MathUtils.lerp(2, 1, zoomProgress);
      camera.position.x = 0;
      camera.lookAt(0, 1, 0);
    }
    // 20% to 40%: Hold CLOSE position for door opening
    else if (progress <= 0.4) {
      camera.position.z = 4;
      camera.position.y = 1;
      camera.position.x = 0;
      camera.lookAt(0, 1, 0);
    }
    // 40% to 60%: Rotate around palace
    else if (progress <= 0.6) {
      const rotateProgress = (progress - 0.4) / 0.2;
      const angle = rotateProgress * Math.PI / 4; // 45 degrees
      camera.position.x = Math.sin(angle) * 8;
      camera.position.z = Math.cos(angle) * 8;
      camera.position.y = THREE.MathUtils.lerp(1, 2.5, rotateProgress);
      camera.lookAt(0, 1, 0);
    }
  });

  return null;
}

// Scene with palace and lighting
function Scene({ scrollProgress }: { scrollProgress: React.MutableRefObject<number> }) {
  return (
    <>
      {/* GOLDEN CASINO LIGHTING WITH SHADOWS! */}
      <ambientLight intensity={0.8} color="#FFE5B4" />

      {/* Main golden spotlights from above */}
      <spotLight
        position={[0, 20, 0]}
        angle={0.5}
        penumbra={1}
        intensity={3}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        color="#FFD700"
      />

      {/* Front golden key light */}
      <directionalLight
        position={[5, 15, 15]}
        intensity={2.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        color="#FFA500"
      />

      {/* Side golden fill lights */}
      <pointLight position={[10, 8, 10]} intensity={2} color="#FFD700" castShadow />
      <pointLight position={[-10, 8, 10]} intensity={2} color="#FFD700" castShadow />

      {/* Back rim light for depth */}
      <pointLight position={[0, 10, -15]} intensity={1.5} color="#FF8C00" />

      {/* GLOOMY FOG ATMOSPHERE */}
      <fog attach="fog" args={['#1a0033', 10, 50]} />

      {/* Environment */}
      <Stars radius={100} depth={50} count={5000} factor={4} fade speed={1} />

      {/* Casino atmosphere particles */}
      <CasinoParticles />

      {/* Palace model */}
      <PalaceModel scrollProgress={scrollProgress} />

      {/* Camera animations */}
      <CameraController scrollProgress={scrollProgress} />

      {/* Post-processing effects */}
      <EffectComposer>
        <Bloom
          intensity={0.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
        />
      </EffectComposer>
    </>
  );
}

// Loading fallback
function Loader() {
  return (
    <div className="flex items-center justify-center w-full h-full bg-gradient-to-b from-purple-900 to-black">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-pulse">🎰</div>
        <p className="text-white text-xl font-bold">Loading Palace Casino...</p>
      </div>
    </div>
  );
}

// Main Palace3D Component with Performance Optimizations
export default function Palace3D({ scrollProgress }: { scrollProgress: React.MutableRefObject<number> }) {
  // Responsive camera FOV based on screen size
  const getFOV = () => {
    if (typeof window === 'undefined') return 50;
    return window.innerWidth < 768 ? 60 : 50;
  };

  const getPosition = (): [number, number, number] => {
    if (typeof window === 'undefined') return [0, 2, 12];
    return window.innerWidth < 768 ? [0, 2, 14] : [0, 2, 12];
  };

  return (
    <Canvas
      camera={{ position: getPosition(), fov: getFOV() }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        stencil: false,
      }}
      dpr={[1, typeof window !== 'undefined' && window.devicePixelRatio > 2 ? 2 : 1.5]}
      shadows
      performance={{ min: 0.5 }}
      frameloop="always"
    >
      <Suspense fallback={null}>
        <Scene scrollProgress={scrollProgress} />
      </Suspense>
    </Canvas>
  );
}

// Preload the palace model for faster loading!
useGLTF.preload('/models/palace.glb');
