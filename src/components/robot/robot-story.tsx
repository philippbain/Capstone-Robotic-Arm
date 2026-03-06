"use client";

import { useEffect, useRef, useState } from "react";
import { ROBOT_STEPS } from "@/data/robot-story";
import { RobotArmCanvas } from "./robot-arm-canvas";

export function RobotStory() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const updateActiveStep = () => {
      const scanline = window.innerHeight * 0.45;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      sectionRefs.current.forEach((section, index) => {
        if (!section) {
          return;
        }

        const rect = section.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const distance = Math.abs(center - scanline);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveStepIndex((current) => (current === closestIndex ? current : closestIndex));
    };

    updateActiveStep();
    window.addEventListener("scroll", updateActiveStep, { passive: true });
    window.addEventListener("resize", updateActiveStep);

    return () => {
      window.removeEventListener("scroll", updateActiveStep);
      window.removeEventListener("resize", updateActiveStep);
    };
  }, []);

  const activeStep = ROBOT_STEPS[activeStepIndex];

  return (
    <section id="story" className="robot-story">
      <div className="robot-story-grid">
        <aside className="visual-column">
          <div className="visual-sticky">
            <RobotArmCanvas step={activeStep} />
            <div className="visual-caption">
              <p className="step-kicker">{activeStep.kicker}</p>
              <p className="visual-title">{activeStep.title}</p>
              <div className="progress-track" aria-hidden="true">
                {ROBOT_STEPS.map((step, index) => (
                  <span
                    key={step.id}
                    className={`progress-dot ${index === activeStepIndex ? "is-active" : ""}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="content-column">
          {ROBOT_STEPS.map((step, index) => (
            <article
              key={step.id}
              ref={(element) => {
                sectionRefs.current[index] = element;
              }}
              className={`story-step ${index === activeStepIndex ? "is-active" : ""}`}
              aria-current={index === activeStepIndex}
            >
              <p className="step-kicker">{step.kicker}</p>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              <p>{step.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
