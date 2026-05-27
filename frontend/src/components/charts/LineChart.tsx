// LineChart — Gráfico de linhas (Chart.js)
// TODO: Implementar com react-chartjs-2
"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function LineChart({ data, labels, title }: {
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
        borderColor: '#836FFF', // violet-blue
        backgroundColor: 'rgba(131, 111, 255, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#836FFF',
        pointBorderWidth: 2,
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
      <Line data={chartData} options={options} />
    </div>
  );
}
