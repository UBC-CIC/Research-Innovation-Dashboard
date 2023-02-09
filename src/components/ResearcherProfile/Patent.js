import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from "@mui/material/Typography";
import Stack from '@mui/material/Stack';
import { Grid } from '@mui/material';
import './ResearcherProfile.css'
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import 'katex/dist/katex.min.css'
import Latex from 'react-latex-next'

export default function Patent(props){

    

    // const mappedPatentNumbers = props.patentNumber.map(patentNumber) => {
    //     <a>{patentNumber}</a>
    // }

    return(
    <Grid
      container
      gridAutoRows="1fr"
      style={{ marginLeft: "2%", marginRight: "2%", marginBottom: "2%" }}
    >
        <Grid item xs={8}>
            <Paper
                square={true}
                elevation={0}
                sx={{ textAlign: "left" }}
            >
                <Typography variant="h5">
                <a href={"https://worldwide.espacenet.com/patent/search/family/0"+props.familyNumber+"/publication/"+props.patentNumber+"?q="+props.patentNumber} target="_blank" rel="noopener noreferrer">   <Latex>{props.title}</Latex> <OpenInNewIcon fontSize="small" /></a>
                </Typography>
                <Typography>Inventor Names: {props.inventors}</Typography>
                <Typography>Sponsors: {props.sponsors}</Typography>
                <Typography>Patent Number: {props.patentNumber}</Typography>
                <Typography>Classifications: {props.patentClassification}</Typography>
            </Paper>
        </Grid>
        <Grid item xs={2}>
            <Paper
                square={true}
                elevation={0}
                component={Stack}
                direction="column"
                justifyContent="center"
            >
                <Typography align="center" variant="h6">
                    {props.familyNumber}
                </Typography>
            </Paper>
        </Grid>
        <Grid item xs={2}>
            <Paper
                square={true}
                elevation={0}
                component={Stack}
                direction="column"
                justifyContent="center"
            >
                <Typography align="center" variant="h6">
                    {props.publicationDate}
                </Typography>
            </Paper>
        </Grid>
    </Grid>
    );}