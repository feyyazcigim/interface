import {
  BarController,
  BarElement,
  CategoryScale,
  ChartData,
  Chart as ChartJS,
  ChartOptions,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import React from "react";
import { ReactChart } from "../ReactChart";

ChartJS.register(BarController, BarElement);

const defaultBarChartConfig = {};

const backgroundColors = [
  "rgba(255, 99, 132, 0.2)",
  "rgba(255, 159, 64, 0.2)",
  "rgba(255, 205, 86, 0.2)",
  "rgba(75, 192, 192, 0.2)",
  "rgba(54, 162, 235, 0.2)",
  "rgba(153, 102, 255, 0.2)",
  "rgba(201, 203, 207, 0.2)",
];

const borderColors = [
  "rgb(255, 99, 132)",
  "rgb(255, 159, 64)",
  "rgb(255, 205, 86)",
  "rgb(75, 192, 192)",
  "rgb(54, 162, 235)",
  "rgb(153, 102, 255)",
  "rgb(201, 203, 207)",
];

const data = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May"],
  datasets: [
    {
      label: "Revenue",
      data: [12000, 19000, 3000, 5000, 22000],
      backgroundColor: "rgba(54, 162, 235, 0.6)",
      borderColor: "rgba(54, 162, 235, 1)",
      borderWidth: 1,
    },
  ],
};

const options: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
    },
    x: {
      stacked: false,
    },
  },
};

type BarChartProps = {
  data: ChartData<"bar">;
  // options: ChartOptions<"bar">
};

const BarChart = React.memo(({ data }: BarChartProps) => {
  return (
    <div>
      <div className="h-[16rem]">
        <ReactChart type="bar" data={data} options={options} />
      </div>
    </div>
  );
});

export default BarChart;
