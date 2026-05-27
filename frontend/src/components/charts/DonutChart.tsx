// DonutChart — Gráfico donut (Chart.js) — para retenção
// TODO: Implementar com react-chartjs-2
"use client";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function DonutChart({ data, labels, title }: {
  data: number[];
  labels: string[];
  title?: string;
}) {
  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: [
          '#1e293b', // navy
          '#836FFF', // violet-purple (brand)
          '#10b981', // green
          '#f59e0b', // yellow
          '#ef4444', // red
          '#8b5cf6', // purple
        ],
        borderWidth: 0,
        hoverOffset: 4
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: !!title,
        text: title,
        color: '#1e293b',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: {
          bottom: 20
        }
      },
    },
  };

  return (
    <div className="w-full h-full min-h-[300px] relative">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
