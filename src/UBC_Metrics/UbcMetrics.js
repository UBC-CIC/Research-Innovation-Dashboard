import React, { useState, useEffect } from "react";
import DoughnutChart from "./DoughnutChart";
import { Grid, Box } from "@mui/material";
import { API } from "aws-amplify";
import { allPublicationsPerFacultyQuery } from "../graphql/queries";
import PublicationGraph from "./PublicationGraph";
import WordCloud from "./WordCloud";

export default function UbcMetrics() {
  const [facultyList, setFacultyList] = useState([]);
  const [facultyPublicationsOverall, setFacultyPublicationsOverall] = useState(
    []
  );

  const allPublicationsPerFacultyFunction = async () => {
    const queryResult = await API.graphql({
      query: allPublicationsPerFacultyQuery,
    });

    const queryResultData = queryResult.data.allPublicationsPerFacultyQuery;
    const facList = queryResultData.map(
      (facultyResult) => facultyResult.faculty
    );
    const facOverallPubs = queryResultData.map(
      (facultyResult) => facultyResult.sum
    );
    setFacultyList(facList);
    setFacultyPublicationsOverall(facOverallPubs);
  };

  useEffect(() => {
    allPublicationsPerFacultyFunction();
  }, []);

  return (
    <Grid container sx={{ px: "1em" }} columnSpacing={4}>
      <Grid item xs={12} sx={{ py: "4em" }}>
        <WordCloud />
      </Grid>
      {/* <Grid item xs={5}>
        <DoughnutChart
          labels={facultyList}
          data={facultyPublicationsOverall}
          title={"Pubs Graph"}
        />
      </Grid>
      <Grid item xs={7}>
        <Box sx={{ width: "100%", height: "369px" }}>
          <PublicationGraph />
        </Box>
      </Grid> */}
    </Grid>
  );
}
