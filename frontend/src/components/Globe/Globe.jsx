import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const Globe = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Set the globe geometry and material
    const globeGeometry = new THREE.SphereGeometry(5, 32, 32);
    const globeMaterial = new THREE.MeshBasicMaterial({ color: 0x0077ff, wireframe: true });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);

    scene.add(globe);
    camera.position.z = 15;

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Add flight animation
    const loader = new GLTFLoader();
    loader.load('path/to/your/flight/model.glb', (gltf) => {
      const flight = gltf.scene;
      flight.scale.set(0.1, 0.1, 0.1);
      scene.add(flight);

      const animateFlight = () => {
        requestAnimationFrame(animateFlight);
        flight.rotation.y += 0.01; // Rotate flight model
        renderer.render(scene, camera);
      };
      animateFlight();
    });

    // Animate the scene
    const animate = () => {
      requestAnimationFrame(animate);
      globe.rotation.y += 0.001; // Rotate globe
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Clean up on unmount
    return () => {
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      scene.remove(globe);
      globe.geometry.dispose();
      globe.material.dispose();
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="globe-container" style={{ width: '100%', height: '100vh', position: 'absolute', top: 0, left: 0 }} />;
};

export default Globe;
