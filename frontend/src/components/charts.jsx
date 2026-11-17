import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  LineController,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  LineController,
  Tooltip,
  Legend,
  Filler
);

// Shared dark-theme defaults
const darkThemeDefaults = {
  color: "#c7cbd6",
  borderColor: "rgba(46, 50, 61, 0.6)",
};

function Charts({ accidents }) {

  // ----------------------------------------
  // Severity Count
  // ----------------------------------------

  const severityCount = {
    Low: 0,
    Medium: 0,
    High: 0,
    Fatal: 0,
  };

  // ----------------------------------------
  // Weather Count
  // ----------------------------------------

  const weatherCount = {};

  // ----------------------------------------
  // Monthly Count
  // ----------------------------------------

  const monthlyCount = {};

  // ----------------------------------------
  // Count accidents
  // ----------------------------------------

  accidents.forEach((accident) => {

    // Severity
    if (
      severityCount[accident.severity] !== undefined
    ) {
      severityCount[accident.severity]++;
    }

    // Weather
    const weather = accident.weather_condition;

    if (weather) {
      weatherCount[weather] =
        (weatherCount[weather] || 0) + 1;
    }

    // Monthly
    if (accident.accident_date) {
      const date = new Date(accident.accident_date);
      const monthKey = date.toLocaleString("default", { month: "short" });
      monthlyCount[monthKey] = (monthlyCount[monthKey] || 0) + 1;
    }

  });

  // ----------------------------------------
  // Month order
  // ----------------------------------------

  const monthOrder = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const sortedMonths = monthOrder.filter((m) => monthlyCount[m]);
  const sortedMonthValues = sortedMonths.map((m) => monthlyCount[m]);

  // ----------------------------------------
  // Severity Bar Chart
  // ----------------------------------------

  const barData = {
    labels: Object.keys(severityCount),

    datasets: [
      {
        label: "Accidents",

        data: Object.values(severityCount),

        backgroundColor: [
          "rgba(52, 211, 153, 0.75)",
          "rgba(252, 211, 77, 0.75)",
          "rgba(255, 138, 101, 0.75)",
          "rgba(239, 83, 80, 0.75)",
        ],

        borderColor: [
          "#34d399",
          "#fcd34d",
          "#ff8a65",
          "#ef5350",
        ],

        borderWidth: 1,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
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
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(46, 50, 61, 0.5)",
        },
        ticks: { color: "#c7cbd6" },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#c7cbd6" },
      },
    },
    ...darkThemeDefaults,
  };

  // ----------------------------------------
  // Weather Doughnut Chart
  // ----------------------------------------

  const doughnutData = {
    labels: Object.keys(weatherCount),

    datasets: [
      {
        data: Object.values(weatherCount),

        backgroundColor: [
          "rgba(66, 165, 245, 0.8)",
          "rgba(102, 187, 106, 0.8)",
          "rgba(255, 167, 38, 0.8)",
          "rgba(171, 71, 188, 0.8)",
          "rgba(38, 166, 154, 0.8)",
          "rgba(239, 83, 80, 0.8)",
        ],

        borderColor: "#1e212a",
        borderWidth: 3,

        hoverBorderColor: "#f3f5f8",
        hoverBorderWidth: 2,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%",
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: "#c7cbd6",
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 10,
          font: {
            family: "'Inter', sans-serif",
            size: 12,
          },
        },
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
    ...darkThemeDefaults,
  };

  // ----------------------------------------
  // Monthly Trend Line Chart
  // ----------------------------------------

  const lineData = {
    labels: sortedMonths,

    datasets: [
      {
        label: "Accidents",
        data: sortedMonthValues,
        borderColor: "#1976d2",
        backgroundColor: "rgba(25, 118, 210, 0.08)",
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#1976d2",
        pointBorderColor: "#1e212a",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointHoverBackgroundColor: "#42a5f5",
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
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
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(46, 50, 61, 0.5)",
        },
        ticks: { color: "#c7cbd6" },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#c7cbd6" },
      },
    },
    ...darkThemeDefaults,
  };

  return (
    <>
      {/* Row 1: Bar + Doughnut */}
      <div className="dash-charts">

        {/* Accidents by Severity */}
        <div className="dash-chart-panel">
          <h4 className="dash-chart-title">
            <span className="dash-chart-title-icon">📊</span>
            Accidents by Severity
          </h4>
          <div style={{ height: "300px" }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        {/* Weather Distribution */}
        <div className="dash-chart-panel">
          <h4 className="dash-chart-title">
            <span className="dash-chart-title-icon">🌦️</span>
            Weather Distribution
          </h4>
          <div style={{ height: "300px" }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>

      </div>

      {/* Row 2: Monthly Trend (full width) */}
      <div className="dash-charts dash-charts--full">
        <div className="dash-chart-panel">
          <h4 className="dash-chart-title">
            <span className="dash-chart-title-icon">📈</span>
            Monthly Accident Trend
          </h4>
          <div style={{ height: "300px" }}>
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>
      </div>
    </>
  );
}

export default Charts;