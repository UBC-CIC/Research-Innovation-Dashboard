import * as React from 'react';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Typography from "@mui/material/Typography";
import './Rankings.css'
import { useState, useEffect } from 'react';
import Button from "@mui/material/Button";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { Link } from 'react-router-dom'
import { createTheme, ThemeProvider } from '@mui/material/styles';

const heightMatch = {height: "100%"};

const rankingsTheme = createTheme();

rankingsTheme.typography.h6 = {
    fontSize: '1.0rem',
  
    [rankingsTheme.breakpoints.up('md')]: {
      fontSize: '1.25rem',
    },
  };

export default function overallResearcherRankings(props) {
    const [numberOfRankingsToShow, setNumberOfRankingsToShow] = useState(2);
    const [increaseRankingsListBy, setIncreaseRankingsListBy] = useState(5);

    const rankings_element = props.allResearcherRankings.filter((data,index) =>index < numberOfRankingsToShow)
    .map((prof_data, index) =>
    <Grid container key={prof_data.preferred_name}>
                <Grid item xs={1}>
                    <Paper style={heightMatch} square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}}>
                        <Typography align='center' variant='h6'>
                            {index+1}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={2}>
                    <Paper style={heightMatch} square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}}>
                        <Typography component={Link} to={"/Researchers/"+prof_data.scopus_id+"/"} align='center' variant='h6'>
                            {prof_data.preferred_name}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={3}>
                    <Paper style={heightMatch} square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}}>
                        <Typography align='center' variant='h6'>
                            {prof_data.prime_faculty}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={3}>
                    <Paper style={heightMatch} square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}}>
                        <Typography align='center' variant='h6'>
                            {prof_data.prime_department}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={1}>
                    <Paper style={heightMatch} square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}}>
                        <Typography align='center' variant='h6'>
                            {prof_data.num_citations}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={1}>
                    <Paper style={heightMatch} square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}}>
                        <Typography align='center' variant='h6'>
                            {prof_data.h_index}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={1}>
                    <Paper style={heightMatch} square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}}>
                        <Typography align='center' variant='h6'>
                            {}
                        </Typography>
                    </Paper>
                </Grid>
    </Grid>)

    function showMoreRankings() {
        setNumberOfRankingsToShow(numberOfRankingsToShow+increaseRankingsListBy);
        setIncreaseRankingsListBy(increaseRankingsListBy*2);
    }

    function ShowMoreRankingsButton() {
        if(numberOfRankingsToShow<props.allResearcherRankings.length){
            return(<Button onClick={showMoreRankings}
                sx={{m: 1, border: "2px solid Black", color: "black", backgroundColor: 'white'}}>
                    Show More Publications
                </Button>);
        }
        return;
    }

    return(
        <div>
            <Grid container justifyContent="flex-end">
            <Grid item xs={12}>
            <Paper square={true} elevation={0} variant="outlined">
            <Grid container id='full_box'>
                <Grid item xs={12}>
                    <Typography align='center' variant='h3' justifyContent={'center'}>
                        Researcher Rankings
                    </Typography>
                </Grid>
                
                <Grid item xs={1}>
                    <Paper style={heightMatch} square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}} component={Stack} direction="column" justifyContent="center">
                        <Typography align='center' variant='h6'>
                            Rank
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={2}>
                    <Paper style={heightMatch} square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}} component={Stack} direction="column" justifyContent="center">
                        
                        <Typography align='center' variant='h6'>
                            Name
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={3}>
                    <Paper style={heightMatch} square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}} component={Stack} direction="column" justifyContent="center">
                        <Typography align='center' variant='h6'>
                            Department
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={3}>
                    <Paper style={heightMatch} square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}} component={Stack} direction="column" justifyContent="center">
                        <Typography align='center' variant='h6'>
                            Faculty
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={1}>
                    <Paper style={heightMatch} square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}} component={Stack} direction="column" justifyContent="center">
                        <Typography align='center' variant='h6'>
                            Citations
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={1}>
                    <Paper style={heightMatch} square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}} component={Stack} direction="column" justifyContent="center">
                        <Typography align='center' variant='h6'>
                            H Index <br /> (5 Years)
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={1}>
                    <Paper style={heightMatch} square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}} component={Stack} direction="column" justifyContent="center">
                        <Typography align='center' variant='h6'>
                            Funding
                        </Typography>
                    </Paper>
                </Grid>
                {rankings_element}
            </Grid>
                <Box textAlign='center'>
                    <ShowMoreRankingsButton />
                    <br />
                </Box>
            </Paper>
            </Grid>
            </Grid>          
        </div>
    )
}