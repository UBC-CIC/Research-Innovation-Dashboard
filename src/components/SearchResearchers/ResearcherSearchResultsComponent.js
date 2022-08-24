import { Link } from "react-router-dom";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import React from "react";
import placeholderResearchPhoto from "../../assets/images/researcherPlaceholderImage.png";
import Pagination from "@mui/material/Pagination";
import Box from "@mui/material/Box";

export default function ResearcherSearchResultsComponent(props) {
  const { researchSearchResults } = props;

  let numberOfResearcherPerPage = 6;

  function researcherPaginationCallback(data, index) {
    if (
      (props.researcherSearchResultPage - 1) * numberOfResearcherPerPage <=
        index &&
      index < props.researcherSearchResultPage * numberOfResearcherPerPage
    ) {
      return data;
    }
  }

  const ResearchResultsElement =
    researchSearchResults &&
    researchSearchResults
      .filter((data, index) => researcherPaginationCallback(data, index))
      .map((researcher) => {
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
              <Link
                style={{ fontSize: "24px" }}
                to={"/Researchers/" + researcher.scopus_id + "/"}
              >
                {researcher.preferred_name} <br />
              </Link>
              <Typography> {researcher.prime_faculty}</Typography>
              <Typography>
                {"Department: " + researcher.prime_department}
              </Typography>
              <Typography>{"Email: " + researcher.email}</Typography>
            </Paper>
          </Paper>
        );
      });

  return researchSearchResults ? (
    <Grid container>
      {researchSearchResults.length === 0 && (
        <Paper elevation={0} square={true} sx={{ width: "100%", ml: "2%" }}>
          <Typography variant="h4">No Researcher Search Results</Typography>
        </Paper>
      )}
      {researchSearchResults.length !== 0 && (
        <Paper elevation={0} square={true} sx={{ width: "100%" }}>
          <Typography variant="h4">Research Search Results</Typography>
        </Paper>
      )}
      {ResearchResultsElement}
      <Grid container>
        <Grid item xs={12} sx={{ m: "5%" }}>
          <Box display="flex" alignItems="center" justifyContent="center">
            {researchSearchResults.length !== 0 && (
              <Pagination
                size="large"
                defaultPage={1}
                page={props.researcherSearchResultPage}
                count={Math.ceil(
                  researchSearchResults.length / numberOfResearcherPerPage
                )}
                onChange={(event, value) => {
                  props.setResearcherSearchResultPage(value);
                }}
              />
            )}
          </Box>
        </Grid>
      </Grid>
    </Grid>
  ) : (
    <Typography>No Researcher Results Available</Typography>
  );
}
