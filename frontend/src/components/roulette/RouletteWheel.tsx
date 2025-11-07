'use client';

import { useRef, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

// European roulette numbers and colors
const ROULETTE_NUMBERS = [
  { number: 0, color: 'green' },
  { number: 32, color: 'red' },
  { number: 15, color: 'black' },
  { number: 19, color: 'red' },
  { number: 4, color: 'black' },
  { number: 21, color: 'red' },
  { number: 2, color: 'black' },
  { number: 25, color: 'red' },
  { number: 17, color: 'black' },
  { number: 34, color: 'red' },
  { number: 6, color: 'black' },
  { number: 27, color: 'red' },
  { number: 13, color: 'black' },
  { number: 36, color: 'red' },
  { number: 11, color: 'black' },
  { number: 30, color: 'red' },
  { number: 8, color: 'black' },
  { number: 23, color: 'red' },
  { number: 10, color: 'black' },
  { number: 5, color: 'red' },
  { number: 24, color: 'black' },
  { number: 16, color: 'red' },
  { number: 33, color: 'black' },
  { number: 1, color: 'red' },
  { number: 20, color: 'black' },
  { number: 14, color: 'red' },
  { number: 31, color: 'black' },
  { number: 9, color: 'red' },
  { number: 22, color: 'black' },
  { number: 18, color: 'red' },
  { number: 29, color: 'black' },
  { number: 7, color: 'red' },
  { number: 28, color: 'black' },
  { number: 12, color: 'red' },
  { number: 35, color: 'black' },
  { number: 3, color: 'red' },
  { number: 26, color: 'black' },
];

interface WheelProps {
  isSpinning: boolean;
  winningNumber: number | null;
  onSpinComplete: () => void;
}

function Wheel({ isSpinning, winningNumber, onSpinComplete }: WheelProps) {
  const wheelRef = useRef<THREE.Group>(null);
  const ballRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (isSpinning && winningNumber !== null && wheelRef.current && ballRef.current) {
      // Find the angle for the winning number
      const winningIndex = ROULETTE_NUMBERS.findIndex(n => n.number === winningNumber);
      const anglePerSegment = (Math.PI * 2) / ROULETTE_NUMBERS.length;
      const targetAngle = winningIndex * anglePerSegment;

      // Add multiple rotations for effect (5-8 full rotations)
      const extraRotations = 5 + Math.random() * 3;
      const totalRotation = extraRotations * Math.PI * 2 + targetAngle;

      // Animate wheel spin
      gsap.to(wheelRef.current.rotation, {
        z: -totalRotation,
        duration: 4,
        ease: 'power2.out',
        onComplete: () => {
          onSpinComplete();
        }
      });

      // Animate ball
      const ballTimeline = gsap.timeline();

      // Ball spins opposite direction on the rim
      ballTimeline.to(ballRef.current.position, {
        duration: 2,
        repeat: 0,
        ease: 'power1.in',
        onUpdate: function() {
          if (ballRef.current) {
            const progress = this.progress();
            const angle = progress * Math.PI * 2 * 3; // 3 rotations
            const radius = 2.5 - progress * 0.8; // Move inward
            ballRef.current.position.x = Math.cos(angle) * radius;
            ballRef.current.position.y = Math.sin(angle) * radius;
            ballRef.current.position.z = 0.5 - progress * 0.3;
          }
        }
      });

      // Ball falls into pocket
      ballTimeline.to(ballRef.current.position, {
        x: Math.cos(-targetAngle) * 2.2,
        y: Math.sin(-targetAngle) * 2.2,
        z: 0.1,
        duration: 1,
        ease: 'bounce.out'
      });
    }
  }, [isSpinning, winningNumber, onSpinComplete]);

  // Create wheel segments
  const segments = useMemo(() => {
    const anglePerSegment = (Math.PI * 2) / ROULETTE_NUMBERS.length;

    return ROULETTE_NUMBERS.map((slot, i) => {
      const angle = i * anglePerSegment;
      const nextAngle = (i + 1) * anglePerSegment;

      // Create segment geometry
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.arc(0, 0, 2.5, angle, nextAngle, false);
      shape.lineTo(0, 0);

      const geometry = new THREE.ShapeGeometry(shape);

      const color = slot.color === 'red' ? '#DC2626' :
                   slot.color === 'black' ? '#171717' :
                   '#059669';

      return (
        <mesh key={i} geometry={geometry} position={[0, 0, 0]}>
          <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
        </mesh>
      );
    });
  }, []);

  // Create number labels
  const labels = useMemo(() => {
    const anglePerSegment = (Math.PI * 2) / ROULETTE_NUMBERS.length;

    return ROULETTE_NUMBERS.map((slot, i) => {
      const angle = i * anglePerSegment + anglePerSegment / 2;
      const radius = 2.0;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      return (
        <Text
          key={`label-${i}`}
          position={[x, y, 0.05]}
          rotation={[0, 0, angle + Math.PI / 2]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {slot.number}
        </Text>
      );
    });
  }, []);

  return (
    <group ref={wheelRef}>
      {/* Outer rim */}
      <mesh position={[0, 0, -0.1]}>
        <cylinderGeometry args={[3, 3, 0.3, 64]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Wheel segments */}
      {segments}

      {/* Number labels */}
      {labels}

      {/* Center hub */}
      <mesh position={[0, 0, 0.05]}>
        <cylinderGeometry args={[0.5, 0.5, 0.1, 32]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Ball */}
      <mesh ref={ballRef} position={[2.5, 0, 0.5]}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshStandardMaterial color="white" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

interface RouletteWheelProps {
  isSpinning: boolean;
  winningNumber: number | null;
  onSpinComplete: () => void;
}

export default function RouletteWheel({ isSpinning, winningNumber, onSpinComplete }: RouletteWheelProps) {
  return (
    <div className="w-full h-[600px] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#0a0a0a']} />

        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <pointLight position={[0, 0, 5]} intensity={1} />
        <pointLight position={[5, 5, 5]} intensity={0.5} color="#D4AF37" />
        <pointLight position={[-5, -5, 5]} intensity={0.5} color="#D4AF37" />
        <spotLight
          position={[0, 0, 10]}
          angle={0.5}
          penumbra={1}
          intensity={1.5}
          castShadow
        />

        {/* Roulette Wheel */}
        <Wheel
          isSpinning={isSpinning}
          winningNumber={winningNumber}
          onSpinComplete={onSpinComplete}
        />

        {/* Table/Floor reflection */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1]}>
          <planeGeometry args={[20, 20]} />
          <MeshReflectorMaterial
            blur={[300, 100]}
            resolution={1024}
            mixBlur={1}
            mixStrength={40}
            roughness={1}
            depthScale={1.2}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#0a0a0a"
            metalness={0.8}
          />
        </mesh>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}
