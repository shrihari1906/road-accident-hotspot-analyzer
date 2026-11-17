import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";

import Navbar from "../components/navbar";
import { getAccidents } from "../services/api";
import "../styles/About.css";

// Animated counter hook
function useAnimatedCounter(endValue, duration = 1400) {
  const ref = useRef(null);
  const counted = useRef(false);

  useEffect(() => {
    if (!ref.current || counted.current || endValue === 0) return;
    counted.current = true;

    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      const current = Math.round(eased * endValue);
      if (ref.current) ref.current.textContent = current.toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [endValue, duration]);

  return ref;
}

function About() {
  const [stats, setStats] = useState({
    total: 0,
    highSeverity: 0,
    cities: 0,
    fatal: 0,
    loaded: false,
  });

  useEffect(() => {
    getAccidents()
      .then((data) => {
        setStats({
          total: data.length,
          highSeverity: data.filter((a) => a.severity === "High").length,
          cities: new Set(data.map((a) => a.city)).size,
          fatal: data.filter((a) => a.severity === "Fatal").length,
          loaded: true,
        });
      })
      .catch((error) => console.error(error));
  }, []);

  const totalRef = useAnimatedCounter(stats.total);
  const highRef = useAnimatedCounter(stats.highSeverity);
  const citiesRef = useAnimatedCounter(stats.cities);
  const fatalRef = useAnimatedCounter(stats.fatal);

  const timelineSteps = [
    {
      id: "collect",
      icon: "📡",
      tag: "Step 1",
      title: "Data Collection",
      description:
        "We aggregate historical accident records from government databases and pull real-time incident data via the TomTom Traffic API — every ~60 seconds.",
    },
    {
      id: "analyze",
      icon: "🧠",
      tag: "Step 2",
      title: "Pattern Analysis",
      description:
        "Our engine clusters accidents by proximity, severity, and time patterns to surface hidden hotspots — streets, intersections, and highway stretches that are consistently dangerous.",
    },
    {
      id: "visualize",
      icon: "🗺️",
      tag: "Step 3",
      title: "Visual Mapping",
      description:
        "Every data point is plotted on an interactive Leaflet map with heat layers, filterable markers, and severity color-coding so you can explore patterns visually.",
    },
    {
      id: "route",
      icon: "🛡️",
      tag: "Step 4",
      title: "Safe Routing",
      description:
        "Enter your origin and destination — if your route crosses a high-risk zone, we calculate and suggest an alternate path that avoids the worst stretches.",
    },
  ];

  const techStack = [
    {
      icon: "⚛️",
      name: "React",
      desc: "Component-driven UI with real-time state management",
      badge: "frontend",
    },
    {
      icon: "🗺️",
      name: "Leaflet",
      desc: "Interactive maps with custom markers and heat layers",
      badge: "frontend",
    },
    {
      icon: "📊",
      name: "Chart.js",
      desc: "Beautiful, responsive data visualizations",
      badge: "frontend",
    },
    {
      icon: "🐍",
      name: "Flask",
      desc: "Lightweight Python backend with RESTful API endpoints",
      badge: "backend",
    },
    {
      icon: "🐘",
      name: "PostgreSQL",
      desc: "Robust relational database for accident records",
      badge: "data",
    },
    {
      icon: "🚗",
      name: "TomTom API",
      desc: "Real-time traffic incident feed and geocoding services",
      badge: "api",
    },
  ];

  return (
    <>
      <Navbar />

      <div className="about">

        {/* ================= HERO ================= */}
        <section className="about-hero">

          {/* Floating particles background */}
          <div className="about-hero-particles" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="about-particle" />
            ))}
          </div>

          <span className="about-hero-eyebrow">
            <span className="about-hero-eyebrow-dot" />
            Open-source · Karnataka-focused
          </span>

          <h1>Making Roads Safer,<br />One Data Point at a Time</h1>

          <p className="about-hero-sub">
            Road Accident Hotspot Analyzer is an intelligent platform that
            maps, analyzes, and visualizes road accident data to help
            commuters, city planners, and researchers make data-driven
            decisions for safer roads.
          </p>
        </section>

        {/* ================= MISSION ================= */}
        <section className="about-mission">
          <div className="about-mission-card">
            <div className="about-mission-accent" />
            <div className="about-mission-content">
              <h2>Our Mission</h2>
              <p>
                Every year, thousands of lives are lost on Karnataka's roads.
                Many of these accidents happen in the same locations, under similar
                conditions, at predictable times. We believe that by surfacing this
                data — making it visible, searchable, and actionable — we can help
                drivers avoid the most dangerous stretches and give authorities the
                insights they need to intervene where it matters most.
              </p>
            </div>
          </div>
        </section>

        {/* ================= HOW IT WORKS ================= */}
        <section className="about-timeline">
          <h2>How It Works</h2>

          <div className="about-timeline-track">
            {timelineSteps.map((step) => (
              <div key={step.id} className="about-timeline-step">
                <div className={`about-timeline-node about-timeline-node--${step.id}`}>
                  {step.icon}
                </div>
                <div className="about-timeline-body">
                  <span className={`about-timeline-tag about-timeline-tag--${step.id}`}>
                    {step.tag}
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= TECH STACK ================= */}
        <section className="about-tech">
          <h2>Built With</h2>

          <div className="about-tech-grid">
            {techStack.map((tech) => (
              <div key={tech.name} className="about-tech-card">
                <span className="about-tech-icon">{tech.icon}</span>
                <div className="about-tech-name">{tech.name}</div>
                <div className="about-tech-desc">{tech.desc}</div>
                <span className={`about-tech-badge about-tech-badge--${tech.badge}`}>
                  {tech.badge}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ================= IMPACT STATS ================= */}
        <section className="about-impact">
          <h2>Platform Impact</h2>

          <div className="about-impact-grid">
            <div className="about-impact-card">
              <div className="about-impact-value about-impact-value--blue" ref={totalRef}>
                {stats.loaded ? stats.total : "—"}
              </div>
              <div className="about-impact-label">Accidents Tracked</div>
            </div>

            <div className="about-impact-card">
              <div className="about-impact-value about-impact-value--amber" ref={highRef}>
                {stats.loaded ? stats.highSeverity : "—"}
              </div>
              <div className="about-impact-label">High Severity Flagged</div>
            </div>

            <div className="about-impact-card">
              <div className="about-impact-value about-impact-value--green" ref={citiesRef}>
                {stats.loaded ? stats.cities : "—"}
              </div>
              <div className="about-impact-label">Cities Analyzed</div>
            </div>

            <div className="about-impact-card">
              <div className="about-impact-value about-impact-value--red" ref={fatalRef}>
                {stats.loaded ? stats.fatal : "—"}
              </div>
              <div className="about-impact-label">Fatal Cases Recorded</div>
            </div>
          </div>
        </section>

        {/* ================= VISION ================= */}
        <section className="about-vision">
          <h2>The Road Ahead</h2>
          <p>
            We envision a future where no commuter unknowingly drives through
            a danger zone — where city planners act on data, not guesswork, and
            where every road has been analyzed, mapped, and improved. This is
            just the beginning.
          </p>
          <Link to="/safe-route" className="about-vision-cta">
            Plan a Safer Route →
          </Link>
          <p className="about-vision-footnote">
            Open source · Built for Karnataka · Powered by community data
          </p>
        </section>

      </div>
    </>
  );
}

export default About;