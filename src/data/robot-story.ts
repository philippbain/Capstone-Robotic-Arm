export type RobotPart =
  | "overview"
  | "base"
  | "shoulder"
  | "elbow"
  | "wrist"
  | "gripper";

export type ArmPose = {
  baseYaw: number;
  shoulderPitch: number;
  elbowPitch: number;
  wristPitch: number;
  wristRoll: number;
  gripperOpen: number;
  camera: [number, number, number];
  lookAt: [number, number, number];
};

export type RobotStoryStep = {
  id: string;
  kicker: string;
  title: string;
  description: string;
  detail: string;
  part: RobotPart;
  accent: string;
  pose: ArmPose;
};

export const ROBOT_STEPS: RobotStoryStep[] = [
  {
    id: "system-overview",
    kicker: "01 SYSTEM OVERVIEW",
    title: "A modular arm built for precision and repeatability",
    description:
      "The robotic arm combines mechanical structure, embedded control, and tooling to execute smooth pick-and-place operations.",
    detail:
      "As the presentation scrolls, each section isolates a physical subsystem and the design decisions behind it.",
    part: "overview",
    accent: "#d77a61",
    pose: {
      baseYaw: 0.2,
      shoulderPitch: 0.2,
      elbowPitch: -0.35,
      wristPitch: 0.3,
      wristRoll: -0.1,
      gripperOpen: 0.04,
      camera: [4.4, 2.6, 4.2],
      lookAt: [0, 1.15, 0]
    }
  },
  {
    id: "base-rotation",
    kicker: "02 BASE STAGE",
    title: "Rotational base provides global workspace coverage",
    description:
      "A rigid lower platform supports the full load path and keeps backlash low while the turret rotates to orient the arm.",
    detail:
      "This stage is optimized for torsional stability so upper joints can move quickly without amplifying vibration.",
    part: "base",
    accent: "#2f847c",
    pose: {
      baseYaw: 1.3,
      shoulderPitch: 0.15,
      elbowPitch: -0.3,
      wristPitch: 0.2,
      wristRoll: 0.12,
      gripperOpen: 0.05,
      camera: [3.5, 2.1, 3.8],
      lookAt: [0, 0.8, 0]
    }
  },
  {
    id: "shoulder-joint",
    kicker: "03 SHOULDER ACTUATION",
    title: "High-torque shoulder joint drives vertical reach",
    description:
      "The shoulder carries the largest moment arm, so gearing and bracket geometry were tuned for controlled acceleration.",
    detail:
      "This design balances payload capacity with motor thermal limits during repeated classroom demonstrations.",
    part: "shoulder",
    accent: "#4f70af",
    pose: {
      baseYaw: 0.9,
      shoulderPitch: 0.75,
      elbowPitch: -0.5,
      wristPitch: 0.2,
      wristRoll: 0.18,
      gripperOpen: 0.03,
      camera: [3.2, 2.8, 3.1],
      lookAt: [0, 1.85, 0]
    }
  },
  {
    id: "elbow-link",
    kicker: "04 ELBOW LINKAGE",
    title: "Elbow geometry extends reach while preserving stiffness",
    description:
      "The elbow stage controls the working envelope depth and keeps end-effector paths smooth through intermediate angles.",
    detail:
      "Link lengths were selected to avoid singular poses across the expected capstone tasks.",
    part: "elbow",
    accent: "#7d5aa8",
    pose: {
      baseYaw: -0.55,
      shoulderPitch: 0.55,
      elbowPitch: 0.42,
      wristPitch: -0.08,
      wristRoll: -0.22,
      gripperOpen: 0.02,
      camera: [3.4, 2.9, 2.2],
      lookAt: [0, 2.55, 0]
    }
  },
  {
    id: "wrist-control",
    kicker: "05 WRIST CONTROL",
    title: "Wrist pitch and roll align the tool to each task",
    description:
      "Fine wrist articulation allows orientation corrections independent of the larger upstream joints.",
    detail:
      "This decoupled control improves accuracy when approaching fixtures from multiple directions.",
    part: "wrist",
    accent: "#6f9f4f",
    pose: {
      baseYaw: -1.15,
      shoulderPitch: 0.35,
      elbowPitch: 0.22,
      wristPitch: -0.55,
      wristRoll: 0.72,
      gripperOpen: 0.05,
      camera: [2.6, 2.7, 1.8],
      lookAt: [0, 3.15, 0]
    }
  },
  {
    id: "gripper-end-effector",
    kicker: "06 END EFFECTOR",
    title: "Adaptive gripper secures objects with minimal slip",
    description:
      "The end effector is tuned for reliable contact and release, closing with enough force for stability without damaging parts.",
    detail:
      "Finger travel and tip geometry can be customized for different demonstration objects.",
    part: "gripper",
    accent: "#cc6a4f",
    pose: {
      baseYaw: -0.2,
      shoulderPitch: 0.35,
      elbowPitch: -0.15,
      wristPitch: -0.85,
      wristRoll: 0.2,
      gripperOpen: 0.09,
      camera: [2, 2.4, 1.45],
      lookAt: [0, 3.55, 0]
    }
  }
];
