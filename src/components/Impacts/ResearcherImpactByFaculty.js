import * as React from "react";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import "./Impact.css";
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

const heightMatch = { height: "100%" };

const impactsTheme = createTheme();

impactsTheme.typography.body1 = {
  fontSize: "1.0rem",

  [impactsTheme.breakpoints.down("md")]: {
    fontSize: "0.75rem",
  },

  [impactsTheme.breakpoints.down("sm")]: {
    fontSize: "0.5rem",
  },
};

impactsTheme.typography.h3 = {
  fontWeight: "normal",
  fontSize: "3.0rem",

  [impactsTheme.breakpoints.down("md")]: {
    fontSize: "2.25rem",
  },

  [impactsTheme.breakpoints.down("sm")]: {
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

export default function ImpactByFaculty(props) {
  const [numberOfImpactsToShow, setNumberOfImpactsToShow] = useState(50);
  const [increaseImpactsListBy, setIncreaseImpactsListBy] = useState(100);

  const facultyDropDownItems = props.allFaculty.map((faculty) => (
    <option value={faculty} key={faculty}>
      {faculty}
    </option>
  ));
  console.log(props.researcherImpactsByFaculty.total_grant_amount)  
  const impacts_element = props.researcherImpactsByFaculty
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
        <Grid item xs={3}>
          <Paper
            style={heightMatch}
            square={true}
            elevation={0}
            variant="outlined"
            sx={{ textAlign: "center" }}
          >
            <Typography
              component={Link}
              to={"/Researchers/" + prof_data.researcher_id + "/"}
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
              {prof_data.total_grant_amount ? prof_data.total_grant_amount.toLocaleString() : 0}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    ));

  function showMoreImpacts() {
    setNumberOfImpactsToShow(numberOfImpactsToShow + increaseImpactsListBy);
  }

  function ShowMoreImpactsButton() {
    if (numberOfImpactsToShow < props.researcherImpactsByFaculty.length) {
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
    <ThemeProvider theme={impactsTheme}>
      <div>
        <Grid container justifyContent="flex-end">
          <Grid item xs={12}>
            <Paper square={true} elevation={0} variant="outlined">
              <Grid container id="full_box">
                <Grid item xs={6}>
                  <Typography
                    align="left"
                    variant="h4"
                    justifyContent={"center"}
                  >
                    Impact By Faculty (last 5 years)
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Stack direction="row" justifyContent="end">
                    <FormControl sx={{ m: 1, mr: 0 }} variant="standard">
                      <NativeSelect
                        id="demo-customized-select-native"
                        value={props.departmentToImpact}
                        onChange={props.changeFacultyToShowImpact}
                        input={<BootstrapInput />}
                      >
                        {facultyDropDownItems}
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
                    <Typography align="center" variant="body1">
                      Impact
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
                  >
                    <Typography align="center" variant="body1">
                      Faculty
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
                      Department
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
                      H Index
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
                      Funding
                    </Typography>
                  </Paper>
                </Grid>
                {impacts_element}
              </Grid>
              <Box textAlign="center">
                <ShowMoreImpactsButton />
                <br />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </div>
    </ThemeProvider>
  );
}
