import * as React from "react";
import { useState, useEffect } from "react";
import ReactWordcloud from "react-wordcloud";
import DoughnutChart from "./DoughnutChart";
import { Grid, Box, Typography } from "@mui/material";
import { API } from "aws-amplify";
import {
  wordCloud,
  facultyMetrics,
  allPublicationsPerFacultyQuery,
} from "../graphql/queries";
import PublicationGraph from "./PublicationGraph";

const options = {
  colors: ["#23D2DC", "#2376DC", "#23DC89"],
  enableTooltip: false,
  deterministic: true,
  fontFamily: "Arial",
  fontSizes: [5, 60],
  fontStyle: "normal",
  fontWeight: "normal",
  padding: 1,
  rotations: 3,
  rotationAngles: [0, 0],
  scale: "sqrt",
  spiral: "archimedean",
};

export default function UbcMetrics(props) {
  const [words, setWords] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [facultyPublicationsOverall, setFacultyPublicationsOverall] = useState(
    []
  );
  const [facultyPubsLastFiveYears, setFacultyPubsLastFiveYears] = useState([]);
  const [facultyPubsLastTenYears, setFacultyPubsLastTenYears] = useState([]);

  const wordCloudQuery = async () => {
    const wordCloudResult = await API.graphql({
      query: wordCloud,
    });
    setWords(wordCloudResult.data.wordCloud);
  };
  const facultyMetricsQuery = async () => {
    const facultyMetricsResult = await API.graphql({
      query: facultyMetrics,
    });

    let facList = [];
    let facOverallPubs = [];
    let fac5year = [];
    let fac10year = [];

    let result = facultyMetricsResult.data.facultyMetrics;

    for (let i = 0; i < result.length; i++) {
      facList.push(result[i].faculty);
      facOverallPubs.push(result[i].num_publications);
      fac5year.push(result[i].num_pubs_last_five_years);
      fac10year.push(result[i].num_pubs_last_ten_years);
    }
    setFacultyList(facList);
    setFacultyPublicationsOverall(facOverallPubs);
    setFacultyPubsLastFiveYears(fac5year);
    setFacultyPubsLastTenYears(fac10year);
  };

  const allPublicationsPerFacultyFunction = async () => {
    const queryResult = await API.graphql({
      query: allPublicationsPerFacultyQuery,
    });
    let facList = [];
    let facOverallPubs = [];
    let result = queryResult.data.allPublicationsPerFacultyQuery;
    for (let i = 0; i < result.length; i++) {
      facList.push(result[i].faculty);
      facOverallPubs.push(result[i].sum);
    }
    setFacultyList(facList);
    setFacultyPublicationsOverall(facOverallPubs);
  };

  useEffect(() => {
    wordCloudQuery();
    facultyMetricsQuery();
    allPublicationsPerFacultyFunction();
  }, []);

  let dataset = [
    {
      label: "5 Years",
      data: facultyPubsLastFiveYears,
      backgroundColor: "rgba(255, 99, 132, 0.5)",
    },
    {
      label: "10 Years",
      data: facultyPubsLastTenYears,
      backgroundColor: "rgba(255, 99, 132, 0.5)",
    },
  ];

  return (
    <Grid container>
      <Grid
        item
        xs={12}
        sx={{
          height: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          mt: "100px",
        }}
      >
        <Typography variant="h5">Top 100 Research Keywords</Typography>
        <ReactWordcloud options={options} words={words} />
      </Grid>
      <Grid
        item
        container
        spacing={6}
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "70vh",
        }}
      >
        <Grid item xs={4}>
          <DoughnutChart
            labels={facultyList}
            data={facultyPublicationsOverall}
            title={"Pubs Graph"}
          />
        </Grid>
        <Grid item xs={8}>
          <Box sx={{ width: "100%" }}>
            <PublicationGraph />
          </Box>
        </Grid>
      </Grid>
    </Grid>
  );
}
