import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import React from "react";
import Button from "@mui/material/Button";
import Publication from "../Researcher_profile/publication";
import Pagination from '@mui/material/Pagination';
import Box from '@mui/material/Box';

export default function PublicationSearchResultsComponent(props) {
  const { publicationSearchResults } = props;

  let numberOfResearcherPerPage = 10;

  function ShowAllPublicationsResultsButton() {
    return (
      <Paper
        square={true}
        elevation={0}
        sx={{
          width: "100%",
          justifyContent: "center",
          marginTop: "1%",
          marginBottom: "1%",
        }}
        component={Stack}
        direction="row"
      >
        <Button
          onClick={() => {
            console.log("Clicked Button");
          }}
          sx={{
            m: 1,
            border: "2px solid Black",
            color: "black",
            backgroundColor: "white",
          }}
        >
          {"Show All " +
            props.publicationSearchResults.length +
            " Publication Results"}
        </Button>
      </Paper>
    );
  }

  function PublicationsHeader() {
    return (
      <Grid
        container
        gridAutoRows="1fr"
        style={{ marginLeft: "2%", marginRight: "2%" }}
      >
        <Grid item xs={8}>
          <Paper
            square={true}
            elevation={0}
            variant="outlined"
            sx={{ textAlign: "center" }}
          >
            <Typography align="center" variant="h6">
              Title
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={2}>
          <Paper
            square={true}
            elevation={0}
            variant="outlined"
            sx={{ textAlign: "center" }}
          >
            <Typography align="center" variant="h6">
              Cited By
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={2}>
          <Paper
            square={true}
            elevation={0}
            variant="outlined"
            sx={{ textAlign: "center" }}
          >
            <Typography align="center" variant="h6">
              Year Published
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  }

  function PaginationCallback(data, index) {
    if((props.publicationsSearchResultPage-1)*numberOfResearcherPerPage <= index && index < props.publicationsSearchResultPage*numberOfResearcherPerPage) {
      return data;
    }
  }

  const publications =
    publicationSearchResults &&
    publicationSearchResults
      .filter((data, index) => PaginationCallback(data, index))
      .map((publication) => {
        return (
          <Publication key={publication.id} publication_data={publication} />
        );
      });

  return (
    publicationSearchResults && (
      <Grid container>
        {publicationSearchResults.length === 0 && (
          <Paper elevation={0} square={true} sx={{ width: "100%" }}>
            <Typography variant="h4" sx={{ marginLeft: "2%", marginTop: "2%" }}>
              No Publication Search Results
            </Typography>
          </Paper>
        )}
        {publicationSearchResults.length !== 0 && (
          <Paper elevation={0} square={true} sx={{ width: "100%" }}>
            <Typography variant="h4" sx={{ marginLeft: "2%", marginTop: "2%" }}>
              Publication Search Results
            </Typography>
          </Paper>
        )}
        {publicationSearchResults.length !== 0 && <PublicationsHeader />}
        {publications}
        <Grid container>
        <Grid item xs={12} sx={{m: "5%"}}>
          <Box 
            display="flex" 
            alignItems="center"
            justifyContent="center"
          >
            {publicationSearchResults.length !== 0 && (<Pagination size="large" defaultPage={1} page={props.publicationsSearchResultPage} count={Math.ceil(publicationSearchResults.length/numberOfResearcherPerPage)} onChange={(event, value)=>{props.setPublicationsSearchResultPage(value)}} />)}
        </Box>
        </Grid>
      </Grid>
      </Grid>
    )
  );
}
