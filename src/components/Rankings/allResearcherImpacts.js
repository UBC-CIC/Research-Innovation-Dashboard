import * as React from "react";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import "./Impact.css";
import { useState } from "react";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Link } from "react-router-dom";
import { createTheme } from "@mui/material/styles";

const heightMatch = { height: "100%" };

const impactsTheme = createTheme();

impactsTheme.typography.h6 = {
  fontSize: "1.0rem",

  [impactsTheme.breakpoints.up("md")]: {
    fontSize: "1.25rem",
  },
};

const OverallResearcherImpacts = (props) => {
  const [numberOfImpactsToShow, setnumberOfImpactsToShow] = useState(50);
  const [increaseImpactsListBy, setIncreaseImpactsListBy] = useState(100);

  const Impacts_element = props.allResearcherImpacts
    .filter((data, index) => index < numberOfImpactsToShow)
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
            <Typography align="center" variant="body1">
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
              component={Link}
              to={"/Researchers/" + prof_data.scopus_id + "/"}
              align="center"
              variant="body1"
            >
              {prof_data.preferred_name}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper
            style={heightMatch}
            square={true}
            elevation={0}
            variant="outlined"
            sx={{ textAlign: "center" }}
          >
            <Typography align="center" variant="body1">
              {prof_data.prime_faculty}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper
            style={heightMatch}
            square={true}
            elevation={0}
            variant="outlined"
            sx={{ textAlign: "center" }}
          >
            <Typography align="center" variant="body1">
              {prof_data.prime_department}
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
            <Typography align="center" variant="body1">
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
            <Typography align="center" variant="body1">
              {}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    ));

  function showMoreImpacts() {
    setnumberOfImpactsToShow(numberOfImpactsToShow + increaseImpactsListBy);
  }

  function ShowMoreImpactsButton() {
    if (numberOfImpactsToShow < props.allResearcherImpacts.length) {
      return (
        <Button
          onClick={showMoreImpacts}
          sx={{
            m: 1,
            border: "2px solid Black",
            color: "black",
            backgroundColor: "white",
          }}
        >
          Show More Researchers
        </Button>
      );
    }
    return;
  }

  return (
    <div>
      <Grid container justifyContent="flex-end">
        <Grid item xs={12}>
          <Paper square={true} elevation={0} variant="outlined">
            <Grid container id="full_box">
              <Grid item xs={12}>
                <Typography variant="h3">Overall Impacts</Typography>
              </Grid>

              <Grid item xs={1}>
                <Paper
                  style={heightMatch}
                  square={true}
                  elevation={0}
                  variant="outlined"
                  sx={{ textAlign: "center" }}
                  component={Stack}
                  direction="column"
                  justifyContent="center"
                >
                  <Typography align="center" variant="body1">
                    Impact
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
                  component={Stack}
                  direction="column"
                  justifyContent="center"
                >
                  <Typography align="center" variant="body1">
                    Name
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={3}>
                <Paper
                  style={heightMatch}
                  square={true}
                  elevation={0}
                  variant="outlined"
                  sx={{ textAlign: "center" }}
                  component={Stack}
                  direction="column"
                  justifyContent="center"
                >
                  <Typography align="center" variant="body1">
                    Department
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={3}>
                <Paper
                  style={heightMatch}
                  square={true}
                  elevation={0}
                  variant="outlined"
                  sx={{ textAlign: "center" }}
                  component={Stack}
                  direction="column"
                  justifyContent="center"
                >
                  <Typography align="center" variant="body1">
                    Faculty
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
                  component={Stack}
                  direction="column"
                  justifyContent="center"
                >
                  <Typography align="center" variant="body1">
                    H Index <br /> (5 Years)
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
                  component={Stack}
                  direction="column"
                  justifyContent="center"
                >
                  <Typography align="center" variant="body1">
                    Funding
                  </Typography>
                </Paper>
              </Grid>
              {Impacts_element}
            </Grid>
            <Box textAlign="center">
              <ShowMoreImpactsButton />
              <br />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default OverallResearcherImpacts;
