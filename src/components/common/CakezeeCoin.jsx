
import { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";

function Coin() {
  const coinRef = useRef(null);

  const logo = useTexture("/images/cakezee.png");

  useEffect(() => {
    logo.colorSpace = THREE.SRGBColorSpace;
    logo.anisotropy = 8;
    logo.needsUpdate = true;

    if (!coinRef.current) return;

    const coin = coinRef.current;

    // Continuous, smooth coin rotation.
    const rotation = gsap.to(coin.rotation, {
      y: Math.PI * 2,
      duration: 8,
      ease: "none",
      repeat: -1,
    });

    // Subtle floating motion.
    const floating = gsap.to(coin.position, {
      y: 0.12,
      duration: 2.2,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });

    return () => {
      rotation.kill();
      floating.kill();
    };
  }, [logo]);

  const gold = new THREE.MeshStandardMaterial({
    color: "#e8c57d",
    metalness: 0.85,
    roughness: 0.25,
  });

  const face = new THREE.MeshStandardMaterial({
    map: logo,
    metalness: 0.25,
    roughness: 0.38,
    side: THREE.DoubleSide,
  });

  // Cylinder's circular faces point along Z after this rotation.
  const geometry = new THREE.CylinderGeometry(
    1.18,
    1.18,
    0.14,
    96,
    1,
    false
  );
  geometry.rotateX(Math.PI / 2);

  return (
    <group>
      <mesh
        ref={coinRef}
        geometry={geometry}
        rotation={[0.08, 0, 0]}
        scale={1}
        castShadow
        receiveShadow
      >
        {/* Cylinder materials: rim, front, back */}
        <primitive
          object={[
            gold,
            face,
            face,
          ]}
          attach="material"
        />
      </mesh>

      {/* A thin dark rim gives the coin depth. */}
      <mesh
        geometry={geometry}
        scale={[1.025, 1.025, 1.025]}
        position={[0, 0, -0.015]}
      >
        <meshStandardMaterial
          color="#4a071b"
          metalness={0.65}
          roughness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export default function CakezeeCoin() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
    >
      <div className="absolute inset-0 opacity-70">
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 4.6], fov: 42 }}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: "low-power",
          }}
          fallback={null}
        >
          <ambientLight intensity={1.8} />
          <directionalLight
            position={[3, 4, 5]}
            intensity={3}
            color="#fff0ce"
          />
          <pointLight
            position={[-3, -1, 3]}
            intensity={2}
            color="#e9b966"
          />

          <Coin />
        </Canvas>
      </div>
    </div>
  );
}
