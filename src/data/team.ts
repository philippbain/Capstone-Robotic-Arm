export type TeamMember = {
  name: string;
  role: string;
  specialty: string;
  summary: string;
};

export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Team Member 01",
    role: "Mechanical Lead",
    specialty: "CAD and structural iteration",
    summary:
      "Owned the arm geometry, clearances, and manufacturing-ready component design from concept to final assembly."
  },
  {
    name: "Team Member 02",
    role: "Controls Lead",
    specialty: "Motion planning and embedded logic",
    summary:
      "Implemented joint sequencing, calibration routines, and safe actuation behavior for repeatable movement."
  },
  {
    name: "Team Member 03",
    role: "Electronics Lead",
    specialty: "Power and signal integration",
    summary:
      "Designed wiring architecture, driver selection, and subsystem interfaces to keep the platform stable under load."
  },
  {
    name: "Team Member 04",
    role: "Systems and Presentation Lead",
    specialty: "Validation and storytelling",
    summary:
      "Coordinated testing, data capture, and final presentation materials to communicate engineering decisions clearly."
  }
];
