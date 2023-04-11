import { Link } from "react-router-dom";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import React from "react";
import placeholderResearchPhoto from "../../assets/images/researcherPlaceholderImage.png";
import Pagination from "@mui/material/Pagination";
import Box from "@mui/material/Box";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

export default function ResearcherSearchResultsComponent(props) {
  const { researchSearchResults, searchYet } = props;

  let numberOfResearcherPerPage = 10;

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
    // currently ordered by descending h_index
    // researchSearchResults.sort((researcher1, researcher2) => researcher1.h_index > researcher2.h_index ? -1 : 1) &&
    // researchSearchResults&&//.sort((researcher1, researcher2) => researcher1.preferred_name > researcher2.preferred_name ? 1 : -1) &&
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
            {/* <img
              alt="professor"
              style={{ width: "20%", height: "fit-content", margin: "4%" }}
              src={placeholderResearchPhoto}
            /> */}
            <Paper elevation={0} sx={{ width: "72%", marginTop: "4%", marginLeft: "17%",}}>
              <Link
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: "24px" }}
                to={"/Researchers/" + researcher.researcher_id + "/"}
              >
                {researcher.preferred_name} {(researcher.rank === "Adjunct Professor") && "*"} <br />
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

  return searchYet && researchSearchResults ? (
    <Grid container>
      {researchSearchResults.length === 0 && (
        <Paper elevation={0} square={true} sx={{ width: "100%" }}>
          <Typography variant="h4" sx={{ marginLeft: "2%", marginTop: "2%" }}>{props.errorTitle}</Typography>
        </Paper>
      )}
      {researchSearchResults.length !== 0 && (
        <Paper elevation={0} square={true} sx={{ width: "100%" , }}>
          <Typography variant="h4" sx={{ marginLeft: "7%", marginTop: "1%", marginBottom: "2%" }}
            > {"Researchers (" + researchSearchResults.length + " results)"}
          </Typography>
        </Paper>
      )}
      {ResearchResultsElement}
      <Grid container>
        <Grid item xs={12} sx={{ m: "2%" }}>
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
    //<Typography>No Researcher Results Available</Typography>
    <div></div>
  );
}
