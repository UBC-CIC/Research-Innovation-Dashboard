import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Typography from "@mui/material/Typography";
import './Researcher_profile.css'
import PublicationBarGraph from './PUBLICATION_BAR_GRAPH';
import Stack from '@mui/material/Stack';
import { useState } from 'react';

import IconButton from '@mui/material/IconButton';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';

export default function Researcher_Highlights(props) {
    //const [showFullGraph, setShowFullGraph] = useState(false); 

    return(
        <Grid item xs={8}>
            <Paper style={{borderTop: "0px", paddingRight: "2%", paddingLeft: "2%", paddingBottom: "2%", borderBottom: "0px"}} square={true} elevation={0} variant="outlined">
                <Grid container>
                    <Paper square={true} elevation={0} sx={{width: "90%"}} component={Stack} direction="row">
                        <Typography sx={{fontSize: "32px"}}>
                            Research Highlights
                        </Typography>
                    </Paper>
                    <Paper square={true} elevation={0} sx={{width: "10%", flexDirection: "row-reverse"}} component={Stack} direction="row">
                    <IconButton disableRipple={true} onClick={() => {props.setShowFullGraph(!props.showFullGraph)}}>
                        {!props.showFullGraph && <OpenInFullIcon />}
                        {props.showFullGraph && <CloseFullscreenIcon />}
                    </IconButton>
                    </Paper>
                    <Paper square={true} elevation={0} sx={{border: 1, width: "20%", p: "2%", mr: "2%"}} component={Stack} direction="column" justifyContent="center">
                        <Typography align='center' variant='h4'>
                            {props.researcher_information.num_publications}
                        </Typography>
                        <Typography align='center'>
                            Publications
                        </Typography>
                    </Paper>
                    <Paper square={true} elevation={0} sx={{border: 1, width: "20%", p: "2%", mr: "2%"}} component={Stack} direction="column" justifyContent="center">
                        <Typography align='center' variant='h4'>
                            {props.researcher_information.h_index}
                        </Typography>
                        <Typography align='center'>
                            H-Index (5 Years)
                        </Typography>
                    </Paper>
                    <Paper square={true} elevation={0} sx={{border: 1, width: "20%", p: "2%", mr: "2%"}} component={Stack} direction="column" justifyContent="center">
                        <Typography align='center' variant='h4'>
                            {props.researcher_information.funding}
                        </Typography>
                        <Typography align='center'>
                            Funding (5 Years)
                        </Typography>
                    </Paper>
                    <PublicationBarGraph width={"20%"} preferred_name={props.preferred_name} barGraphData={props.barGraphData}></PublicationBarGraph>
                </Grid>
            </Paper>
        </Grid>
    )
}

{/* <Paper style={rightGrid} square={true} elevation={0} variant="outlined">
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
            </Paper> */}