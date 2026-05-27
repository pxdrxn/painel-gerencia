// BarChart — Gráfico de barras (Chart.js)
// TODO: Implementar com react-chartjs-2
// Props: data, labels, title

"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function BarChart({ data, labels, title }: {
  data: number[];
  labels: string[];
  title?: string;
}) {
  const chartData = {
    labels,
    datasets: [
      {
        label: title || 'Dados',
        data,
        backgroundColor: '#836FFF', // violet-blue
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: !!title,
        text: title,
        color: '#1e293b',
        font: {
          size: 16,
          weight: 'bold' as const,
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#f1f5f9',
        }
      },
      x: {
        grid: {
          display: false,
        }
      }
    }
  };

  return (
    <div className="w-full h-full min-h-[300px]">
      <Bar data={chartData} options={options} />
    </div>
  );
}
