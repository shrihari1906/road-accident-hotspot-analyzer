import { useEffect, useRef } from "react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

// Animated counter hook
function useAnimatedCounter(endValue, duration = 1200) {
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

function HotspotInsights({ accidents }) {

  const cityCount = {};

  accidents.forEach((accident) => {
    cityCount[accident.city] = (cityCount[accident.city] || 0) + 1;
  });

  const sortedCities = Object.entries(cityCount).sort(
    (a, b) => b[1] - a[1]
  );

  const mostDangerousCity = sortedCities[0];
  const topFiveCities = sortedCities.slice(0, 5);

  const dangerCountRef = useAnimatedCounter(
    mostDangerousCity ? mostDangerousCity[1] : 0
  );

  const chartData = {
    labels: topFiveCities.map((city) => city[0]),
    datasets: [
      {
        label: "Accidents",
        data: topFiveCities.map((city) => city[1]),
        backgroundColor: [
          "rgba(239, 83, 80, 0.8)",
          "rgba(255, 138, 101, 0.8)",
          "rgba(255, 167, 38, 0.75)",
          "rgba(252, 211, 77, 0.7)",
          "rgba(167, 139, 250, 0.7)",
        ],
        borderColor: [
          "#ef5350",
          "#ff8a65",
          "#ffa726",
          "#fcd34d",
          "#a78bfa",
        ],
        borderWidth: 1,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Top 5 Accident-Prone Cities",
        font: { size: 16, family: "'Space Grotesk', sans-serif", weight: "700" },
        color: "#f3f5f8",
        padding: { bottom: 16 },
      },
      tooltip: {
        backgroundColor: "#252830",
        titleColor: "#f3f5f8",
        bodyColor: "#c7cbd6",
        borderColor: "#2e323d",
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: "rgba(46, 50, 61, 0.5)" },
        ticks: { color: "#c7cbd6" },
        title: {
          display: true,
          text: "Number of Accidents",
          color: "#c7cbd6",
          font: { size: 12 },
        },
      },
      y: {
        grid: { display: false },
        ticks: { color: "#c7cbd6" },
        title: {
          display: true,
          text: "Cities",
          color: "#c7cbd6",
          font: { size: 12 },
        },
      },
    },
  };

  return (
    <div className="hotspots-insights">

      <h3 className="hotspots-insights-title">
        <span>📍</span> Hotspot Insights
      </h3>

      <div className="hotspots-insights-grid">

        {/* Most Dangerous City */}
        <div className="hotspots-danger-card">
          <div className="hotspots-danger-icon">🏆</div>
          <div className="hotspots-danger-label">Most Dangerous City</div>
          <div className="hotspots-danger-city">
            {mostDangerousCity ? mostDangerousCity[0] : "—"}
          </div>
          <div className="hotspots-danger-count">
            🚨 <span ref={dangerCountRef}>0</span>
          </div>
          <div className="hotspots-danger-sub">Recorded Accidents</div>
        </div>

        {/* Top 5 Dangerous Cities Chart */}
        <div className="hotspots-chart-panel">
          <div style={{ height: "280px" }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

      </div>

    </div>
  );
}

export default HotspotInsights;