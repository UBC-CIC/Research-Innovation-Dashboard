import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Typography from "@mui/material/Typography";
import './Researcher_profile.css'
import PublicationBarGraph from './PUBLICATION_BAR_GRAPH';
import Stack from '@mui/material/Stack';

const rightGrid = {
    height: "100%",
    paddingRight: 24,
    backgroundColor: "#fff"
  };

const boxStyling = {
    width: "25%"
}

export default function Researcher_Highlights(props) {
    return(
        <Grid item xs={8}>
            <Paper style={rightGrid} square={true} elevation={0} variant="outlined">
                <div id='research_highlights_text'>
                    Research Highlights
                </div>
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        marginLeft: '0.5rem',
                        marginTop: '0.5rem',
                    }}>
                        <Paper style={boxStyling} square={true} elevation={0} sx={{border: 1}} component={Stack} direction="column" justifyContent="center">
                            <Typography align='center' variant='h4'>
                                {props.researcher_information.num_publications}
                            </Typography>
                            <Typography align='center'>
                                 Publications
                            </Typography>
                        </Paper>
                        <Paper style={boxStyling} square={true} elevation={0} sx={{border: 1}} component={Stack} direction="column" justifyContent="center">
                             <Typography align='center' variant='h4'>
                                {props.researcher_information.h_index}
                            </Typography>
                              <Typography align='center'>
                                H-Index (5 Years)
                             </Typography>
                         </Paper>
                         <Paper style={boxStyling} square={true} elevation={0} sx={{border: 1}} component={Stack} direction="column" justifyContent="center">
                             <Typography align='center' variant='h4'>
                                {props.researcher_information.funding}
                            </Typography>
                              <Typography align='center'>
                                Funding (5 Years)
                            </Typography>
                        </Paper>
                        <PublicationBarGraph style={boxStyling} preferred_name={props.preferred_name} barGraphData={props.barGraphData}></PublicationBarGraph>
               </Box>
            </Paper>
        </Grid>
    )
}