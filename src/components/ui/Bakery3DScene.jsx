
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";

export default function Bakery3DScene({ variant = "dreamy" }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer;
    let resizeObserver;
    let intersectionObserver;
    let raf = null;
    let visible = false;
    let disposed = false;

    const tweens = [];
    const geometries = new Set();
    const materials = new Set();

    const isBackground = variant === "background";
    const isStudio = variant === "studio";
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.z = 8.2;

    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: window.devicePixelRatio <= 1.5,
        powerPreference: "high-performance",
      });
    } catch (error) {
      console.error("Bakery 3D initialization failed:", error);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    Object.assign(renderer.domElement.style, {
      display: "block",
      width: "100%",
      height: "100%",
    });

    container.appendChild(renderer.domElement);

    // Transparent background: keep the actual page background visible.
    container.style.background = "transparent";

    scene.add(
      new THREE.HemisphereLight(
        0xffeee5,
        isBackground ? 0x100a09 : 0x49251e,
        2
      )
    );

    const keyLight = new THREE.DirectionalLight(0xffe0c4, 3.5);
    keyLight.position.set(-4, 5, 6);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(
      isBackground ? 0x9b654e : 0xffa8bd,
      isBackground ? 16 : 25,
      18
    );
    fillLight.position.set(4, 2, 3);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(
      isBackground ? 0x9c6b51 : 0xffb3a0,
      32,
      15
    );
    rimLight.position.set(-3, 3, -4);
    scene.add(rimLight);

    const model = new THREE.Group();
    scene.add(model);

    const cake = new THREE.Group();
    model.add(cake);

    const orbit = new THREE.Group();
    model.add(orbit);

    function makeMaterial(color, roughness = 0.4, extra = {}) {
      const m = new THREE.MeshPhysicalMaterial({
        color,
        roughness,
        ...extra,
      });
      materials.add(m);
      return m;
    }

    // Different materials for the two models.
    const sponge = makeMaterial(
      isBackground ? 0x241713 : 0xd5a06b,
      0.7
    );

    const spongeDark = makeMaterial(
      isBackground ? 0x120b09 : 0x9b5d3b,
      0.8
    );

    const cream = makeMaterial(
      isBackground ? 0x38231d : 0xffeee5,
      isBackground ? 0.35 : 0.32
    );

    const creamShadow = makeMaterial(
      isBackground ? 0x21120f : 0xe5b9a8,
      0.45
    );

    const chocolate = makeMaterial(
      isBackground ? 0x100908 : 0x401710,
      0.19,
      {
        clearcoat: 0.9,
        clearcoatRoughness: 0.15,
      }
    );

    const berryMaterial = makeMaterial(0xd71937, 0.26, {
      clearcoat: 0.55,
      clearcoatRoughness: 0.2,
    });

    const blueberryMaterial = makeMaterial(0x25294e, 0.3, {
      clearcoat: 0.35,
    });

    const leafMaterial = makeMaterial(0x365a31, 0.55);

    const ribbonMaterial = makeMaterial(
      isBackground ? 0x68453b : 0xe98c9f,
      0.3,
      { metalness: 0.15, clearcoat: 0.7 }
    );

    const gold = makeMaterial(
      isBackground ? 0x48352b : 0xc99a64,
      0.3,
      { metalness: 0.45 }
    );

    function addMesh(geometry, mat, parent = cake) {
      geometries.add(geometry);

      const object = new THREE.Mesh(geometry, mat);
      parent.add(object);
      return object;
    }

    function cylinder(
      top,
      bottom,
      height,
      mat,
      x,
      y,
      z,
      parent = cake
    ) {
      const object = addMesh(
        new THREE.CylinderGeometry(top, bottom, height, 64, 2),
        mat,
        parent
      );

      object.position.set(x, y, z);
      return object;
    }

    function sphere(
      mat,
      x, y, z,
      sx, sy, sz,
      parent = cake
    ) {
      const object = addMesh(
        new THREE.SphereGeometry(1, 24, 20),
        mat,
        parent
      );

      object.position.set(x, y, z);
      object.scale.set(sx, sy, sz);
      return object;
    }

    function torus(radius, tube, mat, parent = cake) {
      const object = addMesh(
        new THREE.TorusGeometry(radius, tube, 10, 80),
        mat,
        parent
      );

      object.rotation.x = Math.PI / 2;
      return object;
    }

    // Cake layers
    cylinder(1.17, 1.24, 0.68, sponge, 0, -0.28, 0);
    cylinder(1.2, 1.2, 0.07, spongeDark, 0, -0.61, 0);
    cylinder(1.2, 1.2, 0.09, cream, 0, 0.075, 0);

    cylinder(0.76, 0.82, 0.54, sponge, 0, 0.37, 0);
    cylinder(0.81, 0.81, 0.07, cream, 0, 0.665, 0);

    cylinder(1.205, 1.205, 0.065, creamShadow, 0, 0.01, 0);
    torus(1.18, 0.035, cream);

    cylinder(0.815, 0.815, 0.055, chocolate, 0, 0.715, 0);

    // Chocolate drips
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const length = [0.1, 0.18, 0.08, 0.23, 0.13][i % 5];

      sphere(
        chocolate,
        Math.cos(a) * 0.802,
        0.65 - length * 0.45,
        Math.sin(a) * 0.802,
        0.047,
        length,
        0.047
      );
    }

    // Cream decorations
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;

      sphere(
        cream,
        Math.cos(a) * 0.94,
        0.12,
        Math.sin(a) * 0.94,
        0.095,
        0.055,
        0.095
      );
    }

    // Fruit topping
    const fruitPositions = [
      [-0.42, 0.79, 0.05],
      [-0.13, 0.83, 0.31],
      [0.19, 0.81, 0.25],
      [0.42, 0.79, -0.03],
      [0.03, 0.83, -0.28],
      [-0.39, 0.81, -0.19],
      [0.37, 0.82, 0.11],
    ];

    fruitPositions.forEach(([x, y, z], i) => {
      const size = i % 3 === 0 ? 0.15 : 0.12;

      const berry = sphere(
        berryMaterial,
        x, y, z,
        size * 0.82,
        size * 1.18,
        size * 0.78
      );

      berry.rotation.z = i % 2 ? -0.3 : 0.25;

      for (let j = 0; j < 4; j++) {
        const a = (j / 4) * Math.PI * 2;

        const leaf = sphere(
          leafMaterial,
          x + Math.cos(a) * 0.045,
          y + size * 0.8,
          z + Math.sin(a) * 0.045,
          0.043,
          0.014,
          0.025
        );

        leaf.rotation.y = a;
      }
    });

    [
      [-0.56, 0.77, 0.12],
      [-0.27, 0.79, 0.39],
      [0.24, 0.78, 0.39],
      [0.53, 0.77, -0.12],
      [0.12, 0.79, -0.37],
      [-0.34, 0.78, -0.33],
    ].forEach(([x, y, z]) => {
      sphere(
        blueberryMaterial,
        x, y, z,
        0.075, 0.071, 0.073
      );
    });

    // Chocolate curls
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4;

      const curl = sphere(
        chocolate,
        Math.cos(a) * 0.59,
        0.79 + (i % 3) * 0.025,
        Math.sin(a) * 0.59,
        0.055, 0.018, 0.035
      );

      curl.rotation.y = a;
      curl.rotation.x = 0.5;
    }

    // Stand
    cylinder(1.42, 1.48, 0.1, gold, 0, -0.77, 0);
    cylinder(0.14, 0.2, 0.48, gold, 0, -1.04, 0);
    cylinder(0.42, 0.48, 0.09, gold, 0, -1.32, 0);

    // Orbit ribbons
    function createRibbon(radius, verticalScale, phase, tube) {
      const points = [];

      for (let i = 0; i <= 160; i++) {
        const t = (i / 160) * Math.PI * 2;
        const r = radius + 0.25 * Math.sin(t * 2 + phase);

        points.push(
          new THREE.Vector3(
            Math.cos(t + phase) * r,
            Math.sin(t * 1.4 + phase) * verticalScale,
            Math.sin(t + phase) * r * 0.45
          )
        );
      }

      const curve = new THREE.CatmullRomCurve3(points);

      return addMesh(
        new THREE.TubeGeometry(curve, 160, tube, 7, false),
        ribbonMaterial,
        orbit
      );
    }

    createRibbon(1.75, 1.3, 0.2, 0.025);
    createRibbon(2.05, 1.65, 2.1, 0.017);

    // Floating berries
    [
      [-1.65, 0.65, 0.2],
      [1.65, 0.45, 0.2],
      [-1.85, -0.48, -0.1],
      [1.82, -0.55, -0.2],
      [0.3, 1.65, -0.3],
      [-0.7, 1.48, 0.2],
    ].forEach(([x, y, z], i) => {
      const r = i % 2 === 0 ? 0.105 : 0.075;

      sphere(
        i % 2 === 0 ? berryMaterial : blueberryMaterial,
        x, y, z,
        r, r * 1.15, r
      );
    });

    // Separate position: each scene has its own independent rotation.
    model.rotation.set(-0.12, -0.34, -0.12);

    function render() {
      if (disposed || !visible || document.hidden) return;
      renderer.render(scene, camera);
    }

    function stop() {
      if (raf !== null) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    }

    function loop() {
      raf = null;
      if (disposed || !visible || document.hidden) return;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (disposed || !visible || document.hidden || raf !== null) return;

      render();
      raf = requestAnimationFrame(loop);
    }

    
function resize() {
  if (disposed || !renderer) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  if (!width || !height) return;

  const aspect = width / height;
  camera.aspect = aspect;

  if (variant === "background") {
    if (width < 768) {
      // Mobile: existing size unchanged
      camera.position.z = 10;
      model.position.x = 0;
      model.scale.setScalar(0.82);
    } else {
      // Desktop: larger background cake
      camera.position.z = 7.2;
      model.position.x = 0;
      model.scale.setScalar(1.35);
    }
  } else if (variant === "studio") {
    // Hero model: unchanged
    if (aspect < 0.7) {
      camera.position.z = 10;
      model.position.x = 0;
      model.scale.setScalar(0.82);
    } else if (aspect < 1.15) {
      camera.position.z = 9;
      model.position.x = 0.15;
      model.scale.setScalar(1);
    } else {
      camera.position.z = 8.2;
      model.position.x = 0.5;
      model.scale.setScalar(1.15);
    }
  } else {
    // Fallback for other variants
    camera.position.z = aspect < 0.7 ? 10 : 8.2;
    model.position.x = aspect < 0.7 ? 0 : 0.5;
    model.scale.setScalar(aspect < 0.7 ? 0.82 : 1.15);
  }

  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  render();
}


    function updatePlayback() {
      const shouldAnimate =
        !disposed &&
        visible &&
        !document.hidden &&
        !reducedMotion;

      tweens.forEach((tween) => {
        if (shouldAnimate) tween.play();
        else tween.pause();
      });

      if (shouldAnimate) start();
      else {
        stop();
        render();
      }
    }

    const onVisibilityChange = updatePlayback;

    document.addEventListener("visibilitychange", onVisibilityChange);

    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updatePlayback();
    });

    intersectionObserver.observe(container);

    resize();

    return () => {
      disposed = true;
      stop();

      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();

      document.removeEventListener(
        "visibilitychange",
        onVisibilityChange
      );

      tweens.forEach((tween) => tween.kill());

      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((mat) => mat.dispose());

      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [variant]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    />
  );
}
