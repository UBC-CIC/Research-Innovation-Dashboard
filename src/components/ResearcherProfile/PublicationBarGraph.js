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

export default function PublicationBarGraph(props){
    const labels = props.barGraphData.barGraphLastFiveYears;
    const publication_data = props.barGraphData.publicationsPerYear;

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
          text: props.preferred_name+' Publications Each Year',
        },
      },
  };

    const data = {
      labels,
      datasets: [
        {
          label: 'Publications',
          data: publication_data,
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
      ],
  };

    return(
        <div style={{height:'10rem', width: props.width }}>
            <Bar height={5} options={options} data={data} />
        </div>
    );
}
