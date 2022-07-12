import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from "@mui/material/Typography";
import Stack from '@mui/material/Stack';
import Button from "@mui/material/Button";
import Grid from '@mui/material/Grid';
import './Researcher_profile.css'
import {useState} from 'react';

export default function SMALLER_AREAS_OF_INTEREST(props){
    /* This is a 2D array. Each slot of the 2D array contains an Array of 5 elemnts which are areas of interest */

    const [numberOfRows, setNumberOfRows] = useState(4);
    const [increasePublicationListBy, setincreasePublicationListBy] = useState(4);

    function ShowMoreAreasOfInterest(){
        setNumberOfRows(numberOfRows+increasePublicationListBy);
        setincreasePublicationListBy(increasePublicationListBy*2);
    }

    function ShowMoreAreasOfInterestButton() {
        if(numberOfRows<props.areasOfInterest.length){
            return(<Button onClick={ShowMoreAreasOfInterest}
                sx={{m: 1, border: "2px solid Black", color: "black", backgroundColor: 'white'}}>
                    Show More Areas Of Interest
                </Button>);
        }
        return;
    }

    const test_areas = props.areasOfInterest.filter((data,index) => index < numberOfRows).map((area) => {
        return(
            <Paper key={area} square={true} elevation={0} sx={{width: "23.79%", mr: "1%", border: 1, mt: "2%"}} component={Stack} direction="column" justifyContent="center" ml={0}>
                <Typography align='center' variant='h6'>
                    {area}
                </Typography>
            </Paper>
        );
    });


    const areas_of_interest_element = props.areasOfInterest.filter((data,index) => index < numberOfRows).map((area) => {
        return(
        <Grid key={area} item xs={3}>
            <Paper key={area} square={true} elevation={0} sx={{mr: "4%", mt: "4%", mb: "4%", border: 1}} component={Stack} direction="column" justifyContent="center" ml={0}>
                <Typography align='center' variant='h6'>
                    {area}
                </Typography>
            </Paper>
        </Grid>);
    });

    return(
        <Grid item xs={12}>
            <Paper square={true} elevation={0} variant="outlined">

        <Box sx={{flexGrow: 1, paddingLeft: "2%"}}>
            <div id ='Areas_Of_Interest_Text'>Areas Of Interest</div>
        </Box>
        <Grid container sx={{paddingLeft: "2%", paddingRight: "2%"}}>
            {test_areas}
        </Grid>

        <Box textAlign='center'>
            <ShowMoreAreasOfInterestButton />
        </Box>
        </Paper>
        </Grid>
    );
}