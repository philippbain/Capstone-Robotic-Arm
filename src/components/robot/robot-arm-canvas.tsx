"use client";

import { ContactShadows } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { ArmPose, RobotPart, RobotStoryStep } from "@/data/robot-story";

type RobotArmCanvasProps = {
  step: RobotStoryStep;
};

type LiveArmPose = {
  baseYaw: number;
  shoulderPitch: number;
  elbowPitch: number;
  wristPitch: number;
  wristRoll: number;
  gripperOpen: number;
};

function resolvePartColor(part: RobotPart, activePart: RobotPart, accent: string) {
  if (activePart === "overview") {
    return "#b7c2d9";
  }

  return activePart === part ? accent : "#8d9ab3";
}

function CameraRig({ pose }: { pose: ArmPose }) {
  const { camera } = useThree();
  const targetCamera = useRef(new THREE.Vector3(...pose.camera));
  const targetLookAt = useRef(new THREE.Vector3(...pose.lookAt));
  const liveLookAt = useRef(new THREE.Vector3(...pose.lookAt));

  useFrame((_state, delta) => {
    targetCamera.current.set(...pose.camera);
    targetLookAt.current.set(...pose.lookAt);
    const t = 1 - Math.exp(-3.2 * delta);
    camera.position.lerp(targetCamera.current, t);
    liveLookAt.current.lerp(targetLookAt.current, t);
    camera.lookAt(liveLookAt.current);
  });

  return null;
}

function ProceduralRobotArm({ step }: { step: RobotStoryStep }) {
  const basePivot = useRef<THREE.Group>(null);
  const shoulderPivot = useRef<THREE.Group>(null);
  const elbowPivot = useRef<THREE.Group>(null);
  const wristPivot = useRef<THREE.Group>(null);
  const leftFinger = useRef<THREE.Mesh>(null);
  const rightFinger = useRef<THREE.Mesh>(null);

  const livePose = useRef<LiveArmPose>({
    baseYaw: step.pose.baseYaw,
    shoulderPitch: step.pose.shoulderPitch,
    elbowPitch: step.pose.elbowPitch,
    wristPitch: step.pose.wristPitch,
    wristRoll: step.pose.wristRoll,
    gripperOpen: step.pose.gripperOpen
  });

  useFrame((_state, delta) => {
    const current = livePose.current;
    const target = step.pose;
    const damping = 4.8;

    current.baseYaw = THREE.MathUtils.damp(current.baseYaw, target.baseYaw, damping, delta);
    current.shoulderPitch = THREE.MathUtils.damp(
      current.shoulderPitch,
      target.shoulderPitch,
      damping,
      delta
    );
    current.elbowPitch = THREE.MathUtils.damp(
      current.elbowPitch,
      target.elbowPitch,
      damping,
      delta
    );
    current.wristPitch = THREE.MathUtils.damp(
      current.wristPitch,
      target.wristPitch,
      damping,
      delta
    );
    current.wristRoll = THREE.MathUtils.damp(current.wristRoll, target.wristRoll, damping, delta);
    current.gripperOpen = THREE.MathUtils.damp(
      current.gripperOpen,
      target.gripperOpen,
      damping,
      delta
    );

    if (basePivot.current) {
      basePivot.current.rotation.y = current.baseYaw;
    }
    if (shoulderPivot.current) {
      shoulderPivot.current.rotation.z = current.shoulderPitch;
    }
    if (elbowPivot.current) {
      elbowPivot.current.rotation.z = current.elbowPitch;
    }
    if (wristPivot.current) {
      wristPivot.current.rotation.z = current.wristPitch;
      wristPivot.current.rotation.y = current.wristRoll;
    }

    const fingerOffset = 0.12 + current.gripperOpen;
    if (leftFinger.current) {
      leftFinger.current.position.x = -fingerOffset;
    }
    if (rightFinger.current) {
      rightFinger.current.position.x = fingerOffset;
    }
  });

  const baseColor = resolvePartColor("base", step.part, step.accent);
  const shoulderColor = resolvePartColor("shoulder", step.part, step.accent);
  const elbowColor = resolvePartColor("elbow", step.part, step.accent);
  const wristColor = resolvePartColor("wrist", step.part, step.accent);
  const gripperColor = resolvePartColor("gripper", step.part, step.accent);

  return (
    <group position={[0, -1.1, 0]}>
      <mesh receiveShadow>
        <cylinderGeometry args={[1.35, 1.45, 0.2, 40]} />
        <meshStandardMaterial color="#6f7d97" metalness={0.55} roughness={0.35} />
      </mesh>
      <group ref={basePivot} position={[0, 0.25, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.5, 0.58, 0.42, 30]} />
          <meshStandardMaterial color={baseColor} metalness={0.6} roughness={0.28} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, 0.42, 0]}>
          <boxGeometry args={[0.7, 0.2, 0.5]} />
          <meshStandardMaterial color={baseColor} metalness={0.6} roughness={0.28} />
        </mesh>

        <group ref={shoulderPivot} position={[0, 0.52, 0]}>
          <mesh castShadow receiveShadow position={[0, 0.88, 0]}>
            <boxGeometry args={[0.42, 1.78, 0.42]} />
            <meshStandardMaterial color={shoulderColor} metalness={0.62} roughness={0.24} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 1.77, 0]}>
            <sphereGeometry args={[0.22, 30, 30]} />
            <meshStandardMaterial color={shoulderColor} metalness={0.62} roughness={0.24} />
          </mesh>

          <group ref={elbowPivot} position={[0, 1.77, 0]}>
            <mesh castShadow receiveShadow position={[0, 0.7, 0]}>
              <boxGeometry args={[0.35, 1.4, 0.35]} />
              <meshStandardMaterial color={elbowColor} metalness={0.62} roughness={0.24} />
            </mesh>
            <mesh castShadow receiveShadow position={[0, 1.42, 0]}>
              <sphereGeometry args={[0.18, 26, 26]} />
              <meshStandardMaterial color={elbowColor} metalness={0.62} roughness={0.24} />
            </mesh>

            <group ref={wristPivot} position={[0, 1.42, 0]}>
              <mesh castShadow receiveShadow position={[0, 0.48, 0]}>
                <boxGeometry args={[0.27, 0.95, 0.27]} />
                <meshStandardMaterial color={wristColor} metalness={0.62} roughness={0.22} />
              </mesh>
              <mesh castShadow receiveShadow position={[0, 0.95, 0]}>
                <cylinderGeometry args={[0.14, 0.14, 0.36, 22]} />
                <meshStandardMaterial color={wristColor} metalness={0.65} roughness={0.2} />
              </mesh>

              <group position={[0, 1.14, 0]}>
                <mesh castShadow receiveShadow>
                  <boxGeometry args={[0.28, 0.2, 0.28]} />
                  <meshStandardMaterial color={gripperColor} metalness={0.58} roughness={0.24} />
                </mesh>
                <mesh ref={leftFinger} castShadow receiveShadow position={[-0.12, 0.22, 0]}>
                  <boxGeometry args={[0.08, 0.42, 0.12]} />
                  <meshStandardMaterial color={gripperColor} metalness={0.58} roughness={0.24} />
                </mesh>
                <mesh ref={rightFinger} castShadow receiveShadow position={[0.12, 0.22, 0]}>
                  <boxGeometry args={[0.08, 0.42, 0.12]} />
                  <meshStandardMaterial color={gripperColor} metalness={0.58} roughness={0.24} />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

export function RobotArmCanvas({ step }: RobotArmCanvasProps) {
  return (
    <div className="robot-canvas">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [4.4, 2.6, 4.2], fov: 36 }}>
        <color attach="background" args={["#edf2ff"]} />
        <fog attach="fog" args={["#edf2ff", 7, 15]} />
        <ambientLight intensity={0.75} />
        <directionalLight
          castShadow
          position={[5, 8, 4]}
          intensity={1.1}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <spotLight position={[-5, 6, 1]} intensity={0.45} angle={0.4} penumbra={0.5} />
        <ProceduralRobotArm step={step} />
        <ContactShadows position={[0, -1, 0]} opacity={0.45} blur={2.2} scale={8} far={4} />
        <CameraRig pose={step.pose} />
      </Canvas>
    </div>
  );
}
