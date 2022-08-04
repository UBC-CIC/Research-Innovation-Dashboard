import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import React from "react";
import placeholderResearchPhoto from "../pages/researcherPlaceholderImage.png";

export default function Similar_Researchers(props) {
  const ResearchResultsElement = props.researchSearchResults.map(
    (researcher) => {
      return (
        <Paper
          key={researcher.scopus_id}
          square={true}
          elevation={0}
          sx={{ borderTop: "0px", width: "50%", marginRight: "0%" }}
          component={Stack}
          direction="row"
        >
          <img
            alt="professor"
            style={{ width: "20%", height: "fit-content", margin: "4%" }}
            src={placeholderResearchPhoto}
          />
          <Paper elevation={0} sx={{ width: "72%", marginTop: "4%" }}>
            <a
              style={{ fontSize: "24px" }}
              href={"/Researchers/" + researcher.scopus_id + "/"}
            >
              {researcher.preferred_name} <br />
            </a>
            <Typography> {researcher.prime_faculty}</Typography>
            <Typography>
              {"Department: " + researcher.prime_department}
            </Typography>
            <Typography>{"Email: " + researcher.email}</Typography>
          </Paper>
        </Paper>
      );
    }
  );

  return (
    <Grid container>
      {props.researchSearchResults.length !== 0 && (
        <Paper elevation={0} square={true} sx={{ width: "100%" }}>
          <Typography variant="h4" sx={{ marginLeft: "2%", marginTop: "2%" }}>
            Similar Researchers
          </Typography>
        </Paper>
      )}
      {ResearchResultsElement}
    </Grid>
  );
}
