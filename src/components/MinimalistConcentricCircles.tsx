import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface MinimalistConcentricCirclesProps {
  canvasHeight?: number;
  beginAnimation?: boolean;
}

const MinimalistConcentricCircles: React.FC<MinimalistConcentricCirclesProps> = ({
  canvasHeight = 1600,
  beginAnimation = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const animationStartTimeRef = useRef<number | null>(null);
  const sceneInitializedRef = useRef(false);

  // Direct reference to objects we need for animation
  const ringsDataRef = useRef<any[]>([]); // Now storing data per ring instead of per circle
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // CONFIGURATION - All settings hardcoded here
  // ==========================================

  // Circle arrangement settings
  const rings = 50; // Number of concentric rings
  const baseRadius = 3; // Radius of innermost ring
  const radiusStep = 3; // Space between rings

  // Per-ring density (number of circles in each ring)
  const ringDensities = [
    8, 12, 18, 20, 26, 32, 40, 50, 61, 76, 85, 91, 102, 112, 120, 132, 142, 143, 144, 143, 144, 143, 144, 153, 154, 153,
    164, 163, 164, 173, 174, 183, 184, 193, 202, 211, 220, 231, 242, 253, 264, 273, 282,
  ]; // Must match length of 'rings'

  // Texture quality
  const anisotropyLevel = 16; // Level of anisotropic filtering (typical values: 1-16)

  // Circle appearance
  const circleWidth = 2; // Width of each circle
  const circleHeight = 2.4; // Height of each circle (creates elliptical shapes when different from width)

  // Animation settings
  const fadeInDuration = 1.2; // Time in seconds for each ring to fade in
  const fadeInStaggering = 0.1; // Time between each ring starting to fade in

  // Camera position
  const cameraDistance = 20; // How far camera is from the center
  const cameraAngleX = 60; // Camera angle (up/down) in degrees
  const cameraAngleY = 0; // Camera angle (left/right) in degrees
  // ==========================================

  // Initial scene setup
  useEffect(() => {
    if (!mountRef.current || sceneInitializedRef.current) return;

    console.log("Initializing scene...");

    // Clear rings data array
    ringsDataRef.current = [];

    // Basic Three.js setup
    const width = mountRef.current.clientWidth;
    const height = canvasHeight;

    // Initialize renderer with transparent background
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0); // Transparent background
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Get the maximum anisotropy level supported by the GPU
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const actualAnisotropy = Math.min(anisotropyLevel, maxAnisotropy);

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Setup camera with fixed position
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    cameraRef.current = camera;

    // Set camera position
    const radians = cameraAngleY * (Math.PI / 180);
    const radiansX = cameraAngleX * (Math.PI / 180);
    camera.position.x = cameraDistance * Math.sin(radians);
    camera.position.z = cameraDistance * Math.cos(radians);
    camera.position.y = cameraDistance * Math.sin(radiansX);
    camera.lookAt(0, 0, 0);

    // Create group for all circles
    const circlesGroup = new THREE.Group();
    scene.add(circlesGroup);

    // Create ellipse texture with higher quality
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Could not get 2D context for canvas");
      return;
    }

    const size = 256; // Increased texture size for better quality
    canvas.width = size;
    canvas.height = size;

    // Draw the circle with a smoother edge
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Create texture with anisotropic filtering
    const circleTexture = new THREE.CanvasTexture(canvas);
    circleTexture.anisotropy = actualAnisotropy;
    circleTexture.wrapS = THREE.ClampToEdgeWrapping;
    circleTexture.wrapT = THREE.ClampToEdgeWrapping;
    circleTexture.minFilter = THREE.LinearMipmapLinearFilter;
    circleTexture.magFilter = THREE.LinearFilter;
    circleTexture.needsUpdate = true;

    // Create the visualization
    const createCircles = () => {
      for (let i = 0; i < Math.min(rings, ringDensities.length); i++) {
        const radius = baseRadius + i * radiusStep;
        const dotsCount = ringDensities[i] || 16; // Fallback to 16 if not specified
        const circlesInRing: THREE.Mesh[] = []; // Store all circles in this ring
        const materialsInRing: THREE.MeshBasicMaterial[] = []; // Store all materials in this ring

        for (let j = 0; j < dotsCount; j++) {
          const angle = (j / dotsCount) * Math.PI * 2;
          const x = radius * Math.cos(angle);
          const z = radius * Math.sin(angle);

          // Get color for this circle
          const circleColor = new THREE.Color().setHex(0x387f5c); // pinto-green-4

          // Create a flat circle/ellipse as a plane with texture
          const planeGeometry = new THREE.PlaneGeometry(circleWidth, circleHeight);

          // Create material with flat shading and no lighting effects
          const circleMaterial = new THREE.MeshBasicMaterial({
            color: circleColor,
            map: circleTexture,
            transparent: true,
            opacity: 0, // Start invisible
            depthWrite: false,
            side: THREE.DoubleSide,
            alphaTest: 0.1, // Slightly improved edge quality
          });

          const circle = new THREE.Mesh(planeGeometry, circleMaterial);
          circle.position.set(x, 0, z);

          // First, rotate the plane to face upward (along Y-axis)
          circle.rotation.x = -Math.PI / 2;

          // Then rotate around the Y axis to face the center
          const angleToCenter = Math.atan2(z, x) + Math.PI / 2;
          circle.rotation.z = angleToCenter;

          circlesGroup.add(circle);

          // Add to our collections for this ring
          circlesInRing.push(circle);
          materialsInRing.push(circleMaterial);
        }

        // Store data for this entire ring
        const startDelay = i * fadeInStaggering; // Delay based on ring index

        ringsDataRef.current.push({
          circles: circlesInRing,
          materials: materialsInRing,
          startDelay: startDelay,
          ringIndex: i,
        });
      }
    };

    // Create all the circles
    createCircles();
    console.log(`Created ${ringsDataRef.current.length} rings`);

    // Initial render (all circles invisible)
    renderer.render(scene, camera);

    // Mark scene as initialized
    sceneInitializedRef.current = true;

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return;
      const width = mountRef.current.clientWidth;
      camera.aspect = width / canvasHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(width, canvasHeight);
      renderer.render(scene, camera);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener("resize", handleResize);

      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }

      // Dispose of geometries and materials
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (object.material.map) object.material.map.dispose();
          object.material.dispose();
        }
      });

      // Reset initialization flag
      sceneInitializedRef.current = false;
    };
  }, [canvasHeight]);

  // Handle animation based on beginAnimation prop
  useEffect(() => {
    // Stop any ongoing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Don't start animation if scene isn't initialized or beginAnimation is false
    if (!sceneInitializedRef.current || !beginAnimation) {
      // Reset start time if animation is stopped
      if (!beginAnimation) {
        animationStartTimeRef.current = null;

        // If we have a valid scene setup, render all circles as invisible
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          ringsDataRef.current.forEach((ringData) => {
            ringData.materials.forEach((material: THREE.MeshBasicMaterial) => {
              material.opacity = 0;
            });
          });
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      }
      return;
    }

    console.log("Starting animation...");

    // Make sure we have all required objects
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const ringsData = ringsDataRef.current;

    if (!renderer || !scene || !camera || !ringsData || ringsData.length === 0) {
      console.error("Missing required objects for animation");
      return;
    }

    // Record animation start time if beginning for the first time
    if (animationStartTimeRef.current === null) {
      animationStartTimeRef.current = performance.now() / 1000;
      console.log("Animation start time set:", animationStartTimeRef.current);
    }

    // Animation function
    const animate = (time: number) => {
      const currentTime = time / 1000; // Convert to seconds
      const startTime = animationStartTimeRef.current || currentTime;
      const elapsed = currentTime - startTime;

      // Update each ring's opacity
      let allComplete = true;

      ringsData.forEach((ringData) => {
        const { materials, startDelay } = ringData;

        // Calculate normalized time for this ring's fade-in
        const normalizedTime = Math.max(0, Math.min(1, (elapsed - startDelay) / fadeInDuration));

        // If any ring is still fading in, animation isn't complete
        if (normalizedTime < 1) {
          allComplete = false;
        }

        // Ease-in-out function for smoother fade
        const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
        const fadeValue = easeInOut(normalizedTime);

        // Apply the same opacity to all circles in this ring
        materials.forEach((material: THREE.MeshBasicMaterial) => {
          material.opacity = fadeValue;
        });
      });

      // Render the scene
      renderer.render(scene, camera);

      // Continue animation if not all rings are fully visible and animation should continue
      if (!allComplete && beginAnimation) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation is complete or should stop
        animationRef.current = null;
      }
    };

    // Start the animation
    animationRef.current = requestAnimationFrame(animate);

    // Cleanup animation on unmount or when beginAnimation becomes false
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [beginAnimation]);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default MinimalistConcentricCircles;
