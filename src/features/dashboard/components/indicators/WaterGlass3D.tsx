// WaterGlass3D.tsx - Copo d'água renderizado com Three.js + Física Volumétrica Contínua
import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import * as THREE from 'three';
import { storageService } from '../../../../core/services/StorageService';

interface WaterGlass3DProps {
  currentAmount: number;
  dailyGoal: number;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  onSpilled?: () => void;
}

const SIZE_CONFIG = {
  sm: { width: 130, height: 190, cameraZ: 13 },
  md: { width: 170, height: 235, cameraZ: 13 },
  lg: { width: 250, height: 345, cameraZ: 13 }
};

const WATER_BLUE = new THREE.Color('#1E88E5');
const OVERFLOW_CYAN = new THREE.Color('#00E5FF');

// Geometria do copo
const GLASS_H = 2.8;
const TOP_R = 0.92;
const BOTTOM_R = 0.7;
const INNER_BOTTOM = -1.32;
const INNER_HEIGHT = 2.64;

export function WaterGlass3D({ currentAmount, dailyGoal, size = 'md', animated = true, onSpilled }: WaterGlass3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const targetFillRef = useRef(0);
  const overflowRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const spillingRef = useRef(false);
  const onSpilledRef = useRef(onSpilled);

  useEffect(() => {
    reducedMotionRef.current = storageService.loadAppSettings().reducedMotion === true;
  }, []);

  useEffect(() => {
    onSpilledRef.current = onSpilled;
  }, [onSpilled]);

  useEffect(() => {
    const goal = dailyGoal > 0 ? dailyGoal : 1;
    const raw = Math.min(currentAmount / goal, 1.5);
    targetFillRef.current = Math.min(raw, 1);
    overflowRef.current = currentAmount > dailyGoal;
    
    if (currentAmount === 0) {
      spillingRef.current = false;
    }
  }, [currentAmount, dailyGoal]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const { width, height, cameraZ } = SIZE_CONFIG[size];

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, stencil: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Configuração de CSS rígida para garantir que o canvas acompanhe o contêiner 100% do tempo
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.localClippingEnabled = true;
    
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(18, width / height, 0.1, 100);
    camera.position.set(0, 0.4, cameraZ);
    camera.lookAt(0, 0, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x90cdf4, 0.5);
    fillLight.position.set(-3, 2, -3);
    scene.add(fillLight);

    const group = new THREE.Group();
    scene.add(group);

    // Render Order Setup
    const baseMat = new THREE.MeshPhongMaterial({
      color: 0x9cc4e8,
      transparent: true,
      opacity: 0.35,
      shininess: 120,
      specular: 0xffffff,
      depthWrite: false
    });
    const baseGeom = new THREE.CylinderGeometry(BOTTOM_R, 0.66, 0.12, 48);
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = -GLASS_H / 2 - 0.06;
    base.renderOrder = 0;
    group.add(base);

    // --- Geometria Base da Água ---
    const waterGeom = new THREE.CylinderGeometry(TOP_R - 0.01, BOTTOM_R - 0.01, INNER_HEIGHT, 48, 1, false);
    const waterGeomPos = INNER_BOTTOM + INNER_HEIGHT / 2;
    const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 10);

    // --- 1. Stencil Masks (Front/Back Faces) ---
    const stencilGroup = new THREE.Group();
    stencilGroup.position.y = waterGeomPos;

    const stencilBaseMat = new THREE.MeshBasicMaterial({
      depthWrite: false,
      depthTest: true,
      colorWrite: false,
      stencilWrite: true,
      stencilFunc: THREE.AlwaysStencilFunc,
    });

    const backStencilMat = stencilBaseMat.clone();
    backStencilMat.side = THREE.BackSide;
    backStencilMat.clippingPlanes = [clipPlane];
    backStencilMat.stencilFail = THREE.KeepStencilOp;
    backStencilMat.stencilZFail = THREE.KeepStencilOp;
    backStencilMat.stencilZPass = THREE.IncrementWrapStencilOp;

    const backStencilMesh = new THREE.Mesh(waterGeom, backStencilMat);
    backStencilMesh.renderOrder = 1;
    stencilGroup.add(backStencilMesh);

    const frontStencilMat = stencilBaseMat.clone();
    frontStencilMat.side = THREE.FrontSide;
    frontStencilMat.clippingPlanes = [clipPlane];
    frontStencilMat.stencilFail = THREE.KeepStencilOp;
    frontStencilMat.stencilZFail = THREE.KeepStencilOp;
    frontStencilMat.stencilZPass = THREE.DecrementWrapStencilOp;

    const frontStencilMesh = new THREE.Mesh(waterGeom, frontStencilMat);
    frontStencilMesh.renderOrder = 2;
    stencilGroup.add(frontStencilMesh);

    group.add(stencilGroup);

    // --- 2. Superfície da Água (Cap mascarado pelo Stencil) ---
    // Plano gigante renderizado apenas onde Stencil != 0
    const surfaceGeom = new THREE.PlaneGeometry(10, 10);
    const surfaceMat = new THREE.MeshPhongMaterial({
      color: WATER_BLUE,
      transparent: true,
      opacity: 0.95,
      shininess: 220,
      specular: 0xffffff,
      side: THREE.DoubleSide,
      depthWrite: false,
      stencilWrite: true,
      stencilRef: 0,
      stencilFunc: THREE.NotEqualStencilFunc,
      stencilFail: THREE.ReplaceStencilOp,
      stencilZFail: THREE.ReplaceStencilOp,
      stencilZPass: THREE.ReplaceStencilOp,
    });
    
    // O Cap pertence à Scene para não ser afetado pela rotação do grupo local.
    const surface = new THREE.Mesh(surfaceGeom, surfaceMat);
    surface.renderOrder = 3;
    scene.add(surface);

    // --- 3. Corpo da Água Visível ---
    const waterMat = new THREE.MeshPhongMaterial({
      color: WATER_BLUE,
      transparent: true,
      opacity: 0.85,
      shininess: 130,
      specular: 0xffffff,
      depthWrite: false,
      clippingPlanes: [clipPlane],
      clipIntersection: false
    });
    
    const water = new THREE.Mesh(waterGeom, waterMat);
    water.position.y = waterGeomPos;
    water.renderOrder = 4;
    group.add(water);

    // --- Copo de vidro ---
    const glassMat = new THREE.MeshPhongMaterial({
      color: 0xb3d9ff,
      transparent: true,
      opacity: 0.14,
      shininess: 220,
      specular: 0xffffff,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const glassGeom = new THREE.CylinderGeometry(TOP_R, BOTTOM_R, GLASS_H, 48, 1, false);
    const glass = new THREE.Mesh(glassGeom, glassMat);
    glass.renderOrder = 5;
    group.add(glass);

    const rimMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      shininess: 120,
      specular: 0xffffff,
      depthWrite: false
    });
    const rimGeom = new THREE.TorusGeometry(TOP_R, 0.035, 16, 48);
    const rim = new THREE.Mesh(rimGeom, rimMat);
    rim.position.y = GLASS_H / 2;
    rim.rotation.x = Math.PI / 2;
    rim.renderOrder = 6;
    group.add(rim);

    // Estado da animação
    const currentFillState = { current: 0 };
    const displayColor = WATER_BLUE.clone();

    let raf = 0;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let lastT = performance.now();
    const baseRotX = -0.08;
    let dragRotX = 0;
    let dragRotY = 0;

    // Física de slosh (Inércia da superfície)
    const slosh = { v: 0, x: 0 };
    
    const reduceMotion = () => reducedMotionRef.current;

    const loop = (now: number) => {
      const dt = Math.min((now - lastT) / 1000, 0.033);
      lastT = now;
      const t = now / 1000;

      // Cor
      const targetColor = overflowRef.current ? OVERFLOW_CYAN : WATER_BLUE;
      displayColor.lerp(targetColor, reduceMotion() || !animated ? 1 : 0.08);
      waterMat.color.copy(displayColor);
      surfaceMat.color.copy(displayColor);

      // Lerp do preenchimento
      let targetFill = targetFillRef.current;
      if (spillingRef.current) targetFill = 0; // Escoa tudo rapidamente se virou!
      
      const factor = reduceMotion() || !animated ? 1 : (spillingRef.current ? 0.2 : 0.08);
      currentFillState.current += (targetFill - currentFillState.current) * factor;
      if (Math.abs(targetFill - currentFillState.current) < 0.002) {
        currentFillState.current = targetFill;
      }
      const fill = currentFillState.current;

      // Rotação do copo
      if (!dragging && !reduceMotion() && !spillingRef.current) {
        group.rotation.y += 0.006;
      }
      
      // Decay dragRotX to return to upright
      if (!dragging && !spillingRef.current) {
         dragRotX *= 0.92;
      }
      
      group.rotation.x = baseRotX + dragRotX;
      group.rotation.y += dragRotY;
      dragRotY *= 0.9;

      const tiltX = group.rotation.x;

      // Slosh Spring Physics (Oscilação do líquido na borda)
      if (!reduceMotion() && animated) {
         const targetSX = 0; 
         slosh.v += ((targetSX - slosh.x) * 60 - slosh.v * 6) * dt;
         slosh.x += slosh.v * dt;
      } else {
         slosh.x = 0;
         slosh.v = 0;
      }

      // Spilling Logic (Derramar)
      if (!spillingRef.current && fill > 0.001) {
        let rotX = tiltX % (Math.PI * 2);
        if (rotX < 0) rotX += Math.PI * 2;
        
        if (rotX > Math.PI / 2 + 0.1 && rotX < 3 * Math.PI / 2 - 0.1) {
          spillingRef.current = true;
          if (onSpilledRef.current) {
            onSpilledRef.current(); // Avisa o Dashboard
          }
        }
      }
      if (spillingRef.current && fill < 0.001) {
         spillingRef.current = false;
         // dragRotX decay will automatically smoothly bring it upright
      }

      // Visibilidade
      const hasWater = fill > 0.001;
      water.visible = hasWater;
      surface.visible = hasWater;
      backStencilMesh.visible = hasWater;
      frontStencilMesh.visible = hasWater;

      if (hasWater) {
         // 1. Calcula o centro geométrico do copo no World Space
         const h2 = INNER_HEIGHT / 2;
         const localCenter = new THREE.Vector3(0, INNER_BOTTOM + h2, 0);
         const centerWorld = localCenter.clone().applyMatrix4(group.matrixWorld);
         
         // 2. Calcula a extensão vertical (Y) do cilindro rotacionado
         const maxR = Math.max(TOP_R, BOTTOM_R);
         const extentY = h2 * Math.abs(Math.cos(tiltX)) + maxR * Math.abs(Math.sin(tiltX));
         
         const minY = centerWorld.y - extentY;
         const maxY = centerWorld.y + extentY;
         
         // 3. O nível da água no World Space acompanha a gravidade e flui para a parte mais baixa
         const worldY = minY + (maxY - minY) * fill;
         
         // 4. Aplica o balanço (Slosh) no vetor normal do mundo
         const upNormal = new THREE.Vector3(0, 1, 0);
         if (animated && !reduceMotion()) {
            upNormal.applyAxisAngle(new THREE.Vector3(1, 0, 0), slosh.x);
            upNormal.applyAxisAngle(new THREE.Vector3(0, 0, 1), Math.sin(t * 2) * 0.02);
         }

         // 5. Configura o Clipping Plane
         clipPlane.normal.copy(upNormal).negate(); 
         
         const worldCenter = new THREE.Vector3(centerWorld.x, worldY, centerWorld.z);
         clipPlane.constant = -worldCenter.dot(clipPlane.normal);

         // 6. Posiciona e orienta a "Tampa" Stencil
         surface.position.copy(worldCenter);
         surface.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), upNormal);
      }

      // Reset stencil by clearing it before rendering
      renderer.clearStencil();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      slosh.v -= 0.1;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      
      dragRotY += dx * 0.008;
      dragRotX += dy * 0.006;
      
      slosh.v += dy * 0.002;
      
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onPointerUp = () => {
      dragging = false;
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointerleave', onPointerUp);
    renderer.domElement.style.touchAction = 'none'; // Prevent page scroll when tilting
    renderer.domElement.style.cursor = 'grab';

    const resize = () => {
      const rect = mount.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        // Passa false para NÃO sobrescrever as regras CSS que fixamos (100%)
        renderer.setSize(Math.round(rect.width), Math.round(rect.height), false);
        camera.aspect = rect.width / rect.height;
        camera.updateProjectionMatrix();
      }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      
      [glassGeom, rimGeom, baseGeom, waterGeom, surfaceGeom].forEach((g) => g.dispose());
      [glassMat, rimMat, baseMat, waterMat, surfaceMat, backStencilMat, frontStencilMat, stencilBaseMat].forEach((m) => m.dispose());
      
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [size, animated]);

  const percentage = dailyGoal > 0 ? Math.min(Math.round((currentAmount / dailyGoal) * 100), 150) : 0;
  const isOverflowing = currentAmount > dailyGoal;

  return (
    <div className="relative flex flex-col items-center">
      <div
        ref={mountRef}
        className={`relative ${size === 'sm' ? 'w-[130px] h-[180px]' : size === 'md' ? 'w-[170px] h-[235px]' : 'w-[250px] h-[345px] md:w-[270px] md:h-[372px] xl:w-[310px] xl:h-[428px]'}`}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className={`font-bold drop-shadow-lg ${isOverflowing ? 'text-cyan-300' : 'text-white'} ${size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-2xl' : 'text-xl'}`}>
            {percentage}%
          </div>
          <div className={`font-medium drop-shadow ${size === 'lg' ? 'text-base' : size === 'md' ? 'text-sm' : 'text-xs'} ${isOverflowing ? 'text-cyan-200' : 'text-white/85'}`}>
            {currentAmount}ml
          </div>
        </div>
      </div>

      <div className={`mt-4 text-center flex flex-col items-center justify-start h-16 ${size === 'lg' ? 'text-sm' : size === 'md' ? 'text-xs' : 'text-xs'}`}>
        <div className="text-gray-500 dark:text-gray-400 h-5">
          Meta: {dailyGoal}ml ({(dailyGoal / 1000).toFixed(1)}L)
        </div>
        
        <div className="h-6 mt-1 flex items-center justify-center relative w-full">
          {currentAmount > 0 && currentAmount < dailyGoal && (
            <div className="text-[#1E88E5] font-medium absolute">
              Faltam {dailyGoal - currentAmount}ml
            </div>
          )}
          {currentAmount >= dailyGoal && !isOverflowing && (
            <motion.div
              className="text-[#00B894] font-semibold absolute flex items-center justify-center gap-1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
            >
              <span>🎉</span>
              Meta alcançada!
            </motion.div>
          )}
          {isOverflowing && (
            <motion.div
              className="text-cyan-400 font-bold absolute flex items-center justify-center gap-1"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            >
              <span>💎</span>
              Superou a meta!
              <span>💎</span>
            </motion.div>
          )}
          {currentAmount === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 absolute">Arraste o copo para inclinar</p>
          )}
        </div>
      </div>
    </div>
  );
}