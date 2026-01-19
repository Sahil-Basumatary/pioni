import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  animation: {
    duration: 450,
    easing: "easeOutQuad",
  },
  scales: {
    x: {
      grid: { color: "rgba(0,0,0,0.05)" },
      ticks: { color: "var(--text-muted)", font: { size: 10 } },
    },
    y: {
      grid: { color: "rgba(0,0,0,0.05)" },
      ticks: { color: "var(--text-muted)", font: { size: 10 } },
    },
  },
};

export default function SentimentChart({ data }) {
  return (
    <div className="w-full h-56 sm:h-64">
      <Line data={data} options={chartOptions} />
    </div>
  );
}

