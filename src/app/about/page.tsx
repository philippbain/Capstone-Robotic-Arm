import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { TEAM_MEMBERS } from "@/data/team";

export const metadata: Metadata = {
  title: "About Team | Capstone Robotic Arm",
  description: "Team, roles, and ownership across the robotic arm capstone project."
};

export default function AboutPage() {
  return (
    <div className="about-page">
      <SiteHeader />

      <main className="about-main">
        <section className="about-hero">
          <p className="hero-kicker">ABOUT THE TEAM</p>
          <h1>Built by a cross-functional capstone group</h1>
          <p>
            We combined mechanical design, controls engineering, electronics integration,
            and presentation strategy to deliver a robotic arm platform ready for live
            demonstration.
          </p>
        </section>

        <section className="team-grid">
          {TEAM_MEMBERS.map((member) => (
            <article key={member.name} className="team-card">
              <p className="member-role">{member.role}</p>
              <h2>{member.name}</h2>
              <p className="member-specialty">{member.specialty}</p>
              <p>{member.summary}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
