// https://devexpress.github.io/devextreme-reactive/react/chart/demos/bar/simple-bar/

import React from 'react';
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

export default function BarGraph(props){
    const labels = props.labels;

    console.log(props.dataset);

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      margin: 1,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'HELLO',
        },
      },
  };

    const data = {
      labels,
      datasets: props.dataset,
    };

    return(
        <div style={{height:'500px', width: "50%" }}>
            <Bar height={5} options={options} data={data} />
        </div>
    );
}
