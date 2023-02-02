import React, { useState, useEffect } from "react";
import DoughnutChart from "./DoughnutChart";
import { Grid, Box } from "@mui/material";
import { API } from "aws-amplify";
import { allPublicationsPerFacultyQuery } from "../../graphql/queries";
import PublicationGraph from "./PublicationGraph";
import WordCloud from "./WordCloud";
import Stack from "@mui/material/Stack";
import FormControl from "@mui/material/FormControl";
import NativeSelect from "@mui/material/NativeSelect";
import InputBase from "@mui/material/InputBase";
import { styled } from "@mui/material/styles";

export default function Metrics() {
  const [facultyList, setFacultyList] = useState([]);
  const [facultyPublicationsOverall, setFacultyPublicationsOverall] = useState(
    []
  );
  const [metricToShow, setMetricToShow] = useState("");

  const metricsList = ["Top 100 Keywords for all Research", "Grant Money By Faculty"]

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

  const BootstrapInput = styled(InputBase)(({ theme }) => ({
    "label + &": {
      marginTop: theme.spacing(3),
    },
    "& .MuiInputBase-input": {
      borderRadius: 4,
      position: "relative",
      backgroundColor: theme.palette.background.paper,
      border: "1px solid #ced4da",
      fontSize: 16,
      padding: "10px 26px 10px 12px",
      transition: theme.transitions.create(["border-color", "box-shadow"]),
      // Use the system font instead of the default Roboto font.
      "&:focus": {
        borderRadius: 4,
        borderColor: "#80bdff",
        boxShadow: "0 0 0 0.2rem rgba(0,123,255,.25)",
      },
    },
  }));

  const departmentDropDownItems = metricsList.map((metric) => (
    <option value={metric} key={metric}>
      {metric}
    </option>
  ));

  return (
    <Grid container sx={{ px: "1em" }} columnSpacing={4}>
      {/* <Grid item xs={11} sx={{mt: "2%"}}>
        <Stack direction="row" justifyContent="end">
          <FormControl sx={{ m: 1, mr: 0 }} variant="standard">
            <NativeSelect
              id="demo-customized-select-native"
              value={metricToShow}
              onChange={setMetricToShow}
              input={<BootstrapInput />}
            >
              {departmentDropDownItems}
            </NativeSelect>
          </FormControl>
        </Stack>
      </Grid> */}
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
