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

    console.log(props.patentNumber.split(', '))

    console.log(props.patentNumber.split(' '))

    const mappedPatentNumbers = props.patentNumber.split(' ').map((patentNumber) => {
        let hasComma = patentNumber.includes(",");
        let removedCommaPatentNumber = patentNumber.replace(",", "");
        return (
            <Box component="span" sx={{ display: 'inline' }}>
                <a href={"https://worldwide.espacenet.com/patent/search/family/0"+props.familyNumber+"/publication/"+removedCommaPatentNumber+"?q="+removedCommaPatentNumber} target="_blank" rel="noopener noreferrer">{removedCommaPatentNumber}</a>
                {hasComma && ", "}
            </Box>
        );
    })

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
                    <Latex>{props.title}</Latex>
                </Typography>
                <Typography>Inventor Names: {props.inventors}</Typography>
                <Typography>Sponsors: {props.sponsors}</Typography>
                <Typography>Patent Number: {mappedPatentNumbers}</Typography>
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