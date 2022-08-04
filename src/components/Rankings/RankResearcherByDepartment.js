import * as React from "react";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import "./Rankings.css";
import { useState } from "react";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import FormControl from "@mui/material/FormControl";
import NativeSelect from "@mui/material/NativeSelect";
import InputBase from "@mui/material/InputBase";
import { styled } from "@mui/material/styles";
import { Link } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

const heightMatch = { height: "100%" };

const rankingsTheme = createTheme();

rankingsTheme.typography.body1 = {
  fontSize: "1.0rem",

  [rankingsTheme.breakpoints.down("md")]: {
    fontSize: "0.75rem",
  },

  [rankingsTheme.breakpoints.down("sm")]: {
    fontSize: "0.5rem",
  },
};

rankingsTheme.typography.h3 = {
  fontWeight: "normal",
  fontSize: "3.0rem",

  [rankingsTheme.breakpoints.down("md")]: {
    fontSize: "2.25rem",
  },

  [rankingsTheme.breakpoints.down("sm")]: {
    fontSize: "1.5rem",
  },
};

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

export default function RankingsByDepartment(props) {
  const [numberOfRankingsToShow, setNumberOfRankingsToShow] = useState(50);
  const [increaseRankingsListBy, setIncreaseRankingsListBy] = useState(100);

  console.log(props.allDepartments);

  const departmentDropDownItems = props.allDepartments.map((department) => (
    <option value={department} key={department}>
      {department}
    </option>
  ));

  const rankings_element = props.researcherRankingsByDepartment
    .filter((data, index) => index < numberOfRankingsToShow)
    .map((prof_data, index) => (
      <Grid container key={prof_data.preferred_name}>
        <Grid item xs={1}>
          <Paper
            style={heightMatch}
            square={true}
            elevation={0}
            variant="outlined"
            sx={{ textAlign: "center" }}
          >
            <Typography variant="body1" align="center">
              {index + 1}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={2}>
          <Paper
            style={heightMatch}
            square={true}
            elevation={0}
            variant="outlined"
            sx={{ textAlign: "center" }}
          >
            <Typography
              variant="body1"
              component={Link}
              to={"/Researchers/" + prof_data.scopus_id + "/"}
              align="center"
            >
              {prof_data.preferred_name}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={4}>
          <Paper
            style={heightMatch}
            square={true}
            elevation={0}
            variant="outlined"
            sx={{ textAlign: "center" }}
          >
            <Typography variant="body1" align="center">
              {prof_data.prime_department}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={2}>
          <Paper
            style={heightMatch}
            square={true}
            elevation={0}
            variant="outlined"
            sx={{ textAlign: "center" }}
          >
            <Typography variant="body1" align="center">
              {prof_data.num_citations}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={2}>
          <Paper
            style={heightMatch}
            square={true}
            elevation={0}
            variant="outlined"
            sx={{ textAlign: "center" }}
          >
            <Typography variant="body1" align="center">
              {prof_data.h_index}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={1}>
          <Paper
            style={heightMatch}
            square={true}
            elevation={0}
            variant="outlined"
            sx={{ textAlign: "center" }}
          >
            <Typography variant="body1" align="center">
              {}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    ));

  function showMoreRankings() {
    setNumberOfRankingsToShow(numberOfRankingsToShow + increaseRankingsListBy);
    setIncreaseRankingsListBy(increaseRankingsListBy * 2);
  }

  function ShowMoreRankingsButton() {
    const smallScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));
    const mediumScreen = useMediaQuery((theme) => theme.breakpoints.down("md"));
    if (numberOfRankingsToShow < props.researcherRankingsByDepartment.length) {
      let buttonFontSize = "0.75rem";
      if (smallScreen) {
        buttonFontSize = "0.375rem";
      } else if (mediumScreen) {
        buttonFontSize = "0.5rem";
      }
      return (
        <Button
          onClick={showMoreRankings}
          sx={{
            m: 1,
            border: "2px solid Black",
            color: "black",
            backgroundColor: "white",
            fontSize: buttonFontSize,
          }}
        >
          Show More Researchers
        </Button>
      );
    }
    return;
  }

  return (
    <ThemeProvider theme={rankingsTheme}>
      <div>
        <Grid container justifyContent="flex-end">
          <Grid item xs={12}>
            <Paper square={true} elevation={0} variant="outlined">
              <Grid container id="full_box">
                <Grid item xs={6}>
                  <Typography
                    align="left"
                    variant="h3"
                    justifyContent={"center"}
                  >
                    Rankings By Department
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Stack direction="row" justifyContent="end">
                    <FormControl sx={{ m: 1, mr: 0 }} variant="standard">
                      <NativeSelect
                        id="demo-customized-select-native"
                        value={props.departmentToRank}
                        onChange={props.changeDepartmentToRank}
                        input={<BootstrapInput />}
                      >
                        {departmentDropDownItems}
                      </NativeSelect>
                    </FormControl>
                  </Stack>
                </Grid>
                <Grid item xs={1}>
                  <Paper
                    style={heightMatch}
                    square={true}
                    elevation={0}
                    variant="outlined"
                    sx={{ textAlign: "center" }}
                  >
                    <Typography variant="body1" align="center">
                      Rank
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={2}>
                  <Paper
                    style={heightMatch}
                    square={true}
                    elevation={0}
                    variant="outlined"
                    sx={{ textAlign: "center" }}
                  >
                    <Typography variant="body1" align="center">
                      Name
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper
                    style={heightMatch}
                    square={true}
                    elevation={0}
                    variant="outlined"
                    sx={{ textAlign: "center" }}
                  >
                    <Typography variant="body1" align="center">
                      Department
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={2}>
                  <Paper
                    style={heightMatch}
                    square={true}
                    elevation={0}
                    variant="outlined"
                    sx={{ textAlign: "center" }}
                  >
                    <Typography variant="body1" align="center">
                      Citations
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={2}>
                  <Paper
                    style={heightMatch}
                    square={true}
                    elevation={0}
                    variant="outlined"
                    sx={{ textAlign: "center" }}
                  >
                    <Typography variant="body1" align="center">
                      H Index (5 Years)
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={1}>
                  <Paper
                    style={heightMatch}
                    square={true}
                    elevation={0}
                    variant="outlined"
                    sx={{ textAlign: "center" }}
                  >
                    <Typography variant="body1" align="center">
                      Funding
                    </Typography>
                  </Paper>
                </Grid>
                {rankings_element}
              </Grid>
              <Box textAlign="center">
                <ShowMoreRankingsButton />
                <br />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </div>
    </ThemeProvider>
  );
}
