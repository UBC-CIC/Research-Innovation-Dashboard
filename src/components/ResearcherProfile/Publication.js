import * as React from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import 'katex/dist/katex.min.css'
import Latex from 'react-latex-next'
import {useState, useEffect} from 'react'
import { API } from "aws-amplify";
import {changeScopusId, getResearcher} from "../../graphql/queries";

const gridStyling = {
  height: "100%",
};

export default function PUBLICATION({ publication_data }) {
  let array = publication_data.author_names.split(",");
  let authorNamesString = "";

  // to match publication with the author
  // const [researcher, setResearcher] = useState([])
  // useEffect(() => {
  //   let researcherList = null;
  //   if (publication_data.author_ids) {
  //     researcherList = Promise.all(publication_data.author_ids.map(scopusID => matchingResearcher(scopusID)));
  //   }
  //   setResearcher(researcherList)
  //   console.log(researcher)
  // } , [])

  // const matchingResearcher = async (scopusID) => {
    
  //   const result = await API.graphql({
  //     query: getResearcher,
  //     variables: {id: scopusID}
  //   });

  //   if (result.data.getResearcherQuery.scopus_id === scopusID) {
  //     return {
  //       preferred_name : result.data.getResearcherQuery.preferred_name, 
  //       researcher_id : result.data.getResearcherQuery.researcher_id
  //     }
  //   }
  // }

  for (let i = 0; i < array.length && i < 5; i++) {
    if (i == 4) {
      authorNamesString = authorNamesString + array[i] + "...";
    } else {
      authorNamesString = authorNamesString + array[i] + ", ";
    }
  }

  publication_data.title = publication_data.title.replaceAll("<inf>", "<sub>");
  publication_data.title = publication_data.title.replaceAll("</inf>", "</sub>");
  // console.log(publication_data)
  return (
    <Grid
      key={publication_data.id}
      container
      gridAutoRows="1fr"
      style={{ marginLeft: "2%", marginRight: "2%", marginBottom: "2%" }}
    >
      <Grid item xs={10}>
        <Paper
          style={gridStyling}
          square={true}
          elevation={0}
          sx={{ textAlign: "left" }}
        >
          <Typography variant="h5">
            <a href={publication_data.link} target="_blank" rel="noopener noreferrer">   <Latex>{publication_data.title}</Latex> </a>
          </Typography>
          <Typography>{authorNamesString}</Typography>
          <Typography>Journal Of {publication_data.journal}</Typography>
          <Typography>Number of citation(s): {publication_data.cited_by}</Typography>
          <Typography>Keywords: {publication_data.keywords ? publication_data.keywords : 'n/a'}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={2}>
        <Paper
          style={gridStyling}
          square={true}
          elevation={0}
          component={Stack}
          direction="column"
          justifyContent="center"
        >
          <Typography align="center" variant="h6">
            {publication_data.year_published}
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}
