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
import useMediaQuery from "@mui/material/useMediaQuery";

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

export default function ResearcherImpactByDepartment(props) {
  const [numberOfImpactsToShow, setnumberOfImpactsToShow] = useState(50);
  const [IncreaseImpactsListBy, setIncreaseImpactsListBy] = useState(100);

  const departmentDropDownItems = props.allDepartments.map((department) => (
    <option value={department} key={department}>
      {department}
    </option>
  ));

  const ALIGN_TEXT = "left"
  const ALIGN_TEXT_BY = "2%" // pl of typography

  //console.log(props.researcherImpactsByDepartment.total_grant_amount)
  const impacts_element = props.researcherImpactsByDepartment
    .filter((data, index) => index < numberOfImpactsToShow)
    .map((prof_data, index) => (
      <Grid container key={prof_data.preferred_name}>
        {/* <Grid item xs={1}>
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
        </Grid> */}
        <Grid item xs={4}>
          <Paper
            style={heightMatch}
            square={true}
            elevation={0}
            variant="outlined"
            sx={{ textAlign: ALIGN_TEXT }}
          >
            <Typography
              variant="body1"
              component={Link}
              to={"/Researchers/" + prof_data.researcher_id + "/"}
              align={ALIGN_TEXT}
              sx={{pl: ALIGN_TEXT_BY}}
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
            sx={{ textAlign: ALIGN_TEXT }}
          >
            <Typography variant="body1" align={ALIGN_TEXT} sx={{pl: ALIGN_TEXT_BY}}>
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
              {prof_data.h_index}
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
              {prof_data.total_grant_amount ? prof_data.total_grant_amount.toLocaleString() : 0}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    ));

  function showMoreImpacts() {
    setnumberOfImpactsToShow(numberOfImpactsToShow + IncreaseImpactsListBy);
    setIncreaseImpactsListBy(IncreaseImpactsListBy * 2);
  }

  function ShowMoreImpactsButton() {
    const smallScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));
    const mediumScreen = useMediaQuery((theme) => theme.breakpoints.down("md"));
    if (numberOfImpactsToShow < props.researcherImpactsByDepartment.length) {
      let buttonFontSize = "0.75rem";
      if (smallScreen) {
        buttonFontSize = "0.375rem";
      } else if (mediumScreen) {
        buttonFontSize = "0.5rem";
      }
      return (
        <Button
          onClick={showMoreImpacts}
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
                    Impact By Department (last 5 years)
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Stack direction="row" justifyContent="end">
                    <FormControl sx={{ m: 1, mr: 0 }} variant="standard">
                      <NativeSelect
                        id="demo-customized-select-native"
                        value={props.departmentToShowImpact}
                        onChange={props.changeDepartmentToShowImpact}
                        input={<BootstrapInput />}
                      >
                        {departmentDropDownItems}
                      </NativeSelect>
                    </FormControl>
                  </Stack>
                </Grid>
                {/* <Grid item xs={1}>
                  <Paper
                    style={heightMatch}
                    square={true}
                    elevation={0}
                    variant="outlined"
                    sx={{ textAlign: "center" }}
                  >
                    <Typography variant="body1" align="center">
                      Impact
                    </Typography>
                  </Paper>
                </Grid> */}
                <Grid item xs={4}>
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
                      H Index
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
