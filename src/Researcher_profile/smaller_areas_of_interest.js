import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from "@mui/material/Typography";
import Stack from '@mui/material/Stack';
import Button from "@mui/material/Button";
import Grid from '@mui/material/Grid';
import './Researcher_profile.css'
import { useState, useEffect } from 'react';

export default function SMALLER_AREAS_OF_INTEREST(props){
    /* This is a 2D array. Each slot of the 2D array contains an Array of 5 elemnts which are areas of interest */

    const [numberOfRows, setNumberOfRows] = useState(5);
    const [increasePublicationListBy, setincreasePublicationListBy] = useState(5);

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

    const areas_of_interest_element = props.areasOfInterest.filter((data,index) => index < numberOfRows).map((array) => {
        const areas = array.map((area) => 
        <Paper key={area} square={true} elevation={0} sx={{flexGrow: 1, ml: 0, mt: 1, mr: 1, mb: 1, border: 1}} component={Stack} direction="column" justifyContent="center" ml={0}>
            <Typography align='center' variant='h7'>
                {area}
            </Typography>
        </Paper>);
        return(
        <Box id='full_box'
            sx={{
            display: 'flex',
            flexWrap: 'wrap',
            '& > :not(style)': {
            width: 50,
            height: 50,},}}>
            {areas}
        </Box>);
    });

    return(
        <Grid item xs={12}>
            <Paper square={true} elevation={0} variant="outlined">

        <Box id='full_box' sx={{flexGrow: 1}}>
            <div id ='Areas_Of_Interest_Text'>Areas Of Interest</div>
        </Box>
        
        {areas_of_interest_element}

        <Box textAlign='center'>
            <ShowMoreAreasOfInterestButton />
        </Box>
        </Paper>
        </Grid>
    );
}