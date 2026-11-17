import { useEffect, useRef } from "react";

function useAnimatedCounter(endValue, duration = 1200) {
  const ref = useRef(null);
  const counted = useRef(false);

  useEffect(() => {
    // Reset on every value change so re-filtering re-animates the counter
    counted.current = false;
  }, [endValue]);

  useEffect(() => {
    if (!ref.current || counted.current || endValue === 0) return;
    counted.current = true;

    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      const current = Math.round(eased * endValue);
      if (ref.current) ref.current.textContent = current.toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [endValue, duration]);

  return ref;
}

function DashboardCards({ accidents }) {
  const totalAccidents = accidents.length;

  const highSeverity = accidents.filter(
    (accident) => accident.severity === "High"
  ).length;

  const fatalCount = accidents.filter(
    (accident) => accident.severity === "Fatal"
  ).length;

  const cities = new Set(
    accidents.map((accident) => accident.city)
  ).size;

  const rainyAccidents = accidents.filter(
    (accident) => accident.weather_condition === "Rainy"
  ).length;

  const totalRef = useAnimatedCounter(totalAccidents);
  const highRef = useAnimatedCounter(highSeverity);
  const citiesRef = useAnimatedCounter(cities);
  const rainyRef = useAnimatedCounter(rainyAccidents);

  const cards = [
    {
      label: "Total Accidents",
      ref: totalRef,
      sub: "All recorded incidents",
      icon: "📊",
      accent: "blue",
      trend: null,
    },
    {
      label: "High Severity",
      ref: highRef,
      sub: "Serious accidents reported",
      icon: "🚨",
      accent: "red",
      trend: fatalCount > 0 ? { direction: "up", text: `${fatalCount} fatal` } : null,
    },
    {
      label: "Cities Covered",
      ref: citiesRef,
      sub: "Across Karnataka",
      icon: "🌍",
      accent: "green",
      trend: null,
    },
    {
      label: "Rainy Accidents",
      ref: rainyRef,
      sub: "Weather-related incidents",
      icon: "🌧️",
      accent: "amber",
      trend: totalAccidents > 0
        ? {
            direction: rainyAccidents / totalAccidents > 0.2 ? "up" : "down",
            text: `${((rainyAccidents / totalAccidents) * 100).toFixed(0)}% of total`,
          }
        : null,
    },
  ];

  return (
    <div className="dash-cards">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`dash-card dash-card--${card.accent}`}
        >
          <div className="dash-card-top">
            <span className="dash-card-label">{card.label}</span>
            <div className="dash-card-icon">{card.icon}</div>
          </div>

          <div className="dash-card-value" ref={card.ref}>
            0
          </div>

          <div className="dash-card-sub">{card.sub}</div>

          {card.trend && (
            <div
              className={`dash-card-trend dash-card-trend--${card.trend.direction}`}
            >
              {card.trend.direction === "up" ? "▲" : "▼"}{" "}
              {card.trend.text}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default DashboardCards;