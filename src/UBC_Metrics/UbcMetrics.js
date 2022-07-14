import * as React from "react";
import SearchIcon from "@mui/icons-material/Search";
import InputBase from "@mui/material/InputBase";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import ReactWordcloud from "react-wordcloud";
import DoughnutChart from "./DoughnutChart";
import { select } from "d3-selection";
import { Grid, Box, Typography } from "@mui/material";
import { API } from "aws-amplify";
import {
  wordCloud,
  facultyMetrics,
  allPublicationsPerFacultyQuery,
} from "../graphql/queries";
import PublicationGraph from "./PublicationGraph";

import "tippy.js/dist/tippy.css";
import "tippy.js/animations/scale.css";

function getCallback(callback) {
    
    return function (word, event) {
      const isActive = callback !== "onWordMouseOut";
      const element = event.target;
      const text = select(element);
      text
        .on("click", () => {
          if (isActive) {
            window.open(`${window.location.origin}/${word.text}`);
          }
        })
        // .transition()
        // .attr("background", "white")
        // .attr("font-size", isActive ? "300%" : "100%")
        // .attr("text-decoration", isActive ? "underline" : "none");
    };
}

const options = {
    colors: ["#23D2DC", "#2376DC", "#23DC89"],
    enableTooltip: true,
    deterministic: true,
    fontFamily: "Arial",
    fontSizes: [5, 60],
    fontStyle: "normal",
    fontWeight: "normal",
    padding: 1,
    rotations: 3,
    rotationAngles: [0, 0],
    scale: "sqrt",
    spiral: "archimedean"
};
const callbacks = {
    getWordTooltip: (word) => `The word "${word.text}" appears ${word.value} times. Click to search for the keyword "${word.text}"`,
    onWordClick: getCallback("onWordClick"),
    onWordMouseOut: getCallback("onWordMouseOut"),
    onWordMouseOver: getCallback("onWordMouseOver")
};

export default function UbcMetrics(props) {
  const [words, setWords] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [facultyPublicationsOverall, setFacultyPublicationsOverall] = useState([]);

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
  };

  const allPublicationsPerFacultyFunction = async () => {
    const queryResult = await API.graphql({
        query: allPublicationsPerFacultyQuery
    });

    let facList = [];
    let facOverallPubs = [];

    let result = queryResult.data.allPublicationsPerFacultyQuery;

    for(let i = 0; i<result.length; i++){
        facList.push(result[i].faculty);
        facOverallPubs.push(result[i].sum);
    }
    setFacultyList(facList);
    setFacultyPublicationsOverall(facOverallPubs);
  }

  

  useEffect(() => {
    wordCloudQuery();
    facultyMetricsQuery();
    allPublicationsPerFacultyFunction();
  }, []);


  return (
    <Grid container>
      <Grid
        item
        xs={12}
        sx={{mt: "1%"}}
      >
        <Typography variant="h4" align='center'>Top 100 Keywords In UBC Research</Typography>
      </Grid>
      <Grid
        item
        xs={12}
        sx={{
          height: "70vh",
          display: "flex",
          alignItems: "center",
          flexDirection: "row"
        }}
      >
        <ReactWordcloud callbacks={callbacks} options={options} words={words} />
      </Grid>
        <Grid item xs={4}>
          <DoughnutChart
            labels={facultyList}
            data={facultyPublicationsOverall}
            title={"Pubs Graph"}
          />
        </Grid>
        <Grid item xs={8}>
          <Box sx={{ width: "100%", height: "369px" }}>
            <PublicationGraph />
          </Box>
        </Grid>
    </Grid>
  );
}
