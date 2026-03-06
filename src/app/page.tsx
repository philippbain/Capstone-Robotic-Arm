import Link from "next/link";
import { RobotStory } from "@/components/robot/robot-story";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <div className="landing-page">
      <SiteHeader />

      <main>
        <section className="landing-hero">
          <p className="hero-kicker">CAPSTONE DESIGN PRESENTATION</p>
          <h1>Scroll Through Our Robotic Arm Design Story</h1>
          <p className="hero-description">
            This hybrid landing page showcases the mechanical architecture, joint strategy,
            and end-effector logic behind our capstone system.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="#story">
              Start Component Walkthrough
            </Link>
            <Link className="button button-secondary" href="/about">
              Meet the Team
            </Link>
          </div>
          <p className="cad-hint">
            CAD integration path: export your model as glTF and place it at{" "}
            <code>public/models/robot-arm.glb</code> to replace the procedural demo model.
          </p>
        </section>

        <RobotStory />

        <section className="closing-panel">
          <p className="hero-kicker">NEXT PHASE</p>
          <h2>Ready for your final presentation flow</h2>
          <p>
            The structure is now set up for your live demo: scroll narrative, animated 3D
            stage, and team section. Next, we can plug in the actual CAD hierarchy and fine
            tune camera beats for each subsystem.
          </p>
        </section>
      </main>
    </div>
  );
}
