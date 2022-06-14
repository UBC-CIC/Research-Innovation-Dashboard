import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from "@mui/material/Typography";
import Stack from '@mui/material/Stack';
import Button from "@mui/material/Button";
import Link from '@mui/material/Link';

export default function AREAS_OF_INTEREST(props){
    return(
        <div id='full_box'>
        <Box sx={{flexGrow: 1}}>
            <div id ='Areas_Of_Interest_Text'>Areas Of Interest</div>
            <Link style={{cursor: 'pointer'}} onClick={props.onClickFunctions.showSimilarResearchersFunc} id='similar_researchers'>6 Similar Researchers</Link>
        </Box>  
        <Box
            sx={{
            display: 'flex',
            flexWrap: 'wrap',
            '& > :not(style)': {
            width: 150,
            height: 150,},}}>
                <Paper square={true} elevation={0} sx={{flexGrow: 1, ml: 0, mt: 1, mr: 1, mb: 1, border: 1}} component={Stack} direction="column" justifyContent="center" ml={0}>
                    <Typography align='center' variant='h5'>
                        {props.areasOfInterest[0][0]}
                    </Typography>
                </Paper>
                <Paper square={true} elevation={0} sx={{flexGrow: 1, m: 1, border: 1}} component={Stack} direction="column" justifyContent="center">
                    <Typography align='center' variant='h5'>
                        {props.areasOfInterest[0][1]}
                    </Typography>
                </Paper>
                <Paper square={true} elevation={0} sx={{flexGrow: 1, m: 1, border: 1}} component={Stack} direction="column" justifyContent="center">
                    <Typography align='center' variant='h5'>
                        {props.areasOfInterest[0][2]}
                    </Typography>
                </Paper>
                <Paper square={true} elevation={0} sx={{flexGrow: 1, m: 1, border: 1}} component={Stack} direction="column" justifyContent="center">
                    <Typography align='center' variant='h5'>
                        {props.areasOfInterest[0][3]}
                    </Typography>
                </Paper>
                <Paper square={true} elevation={0} sx={{flexGrow: 1 , ml: 1, mt: 1, mr: 0, mb: 1, border: 1}} component={Stack} direction="column" justifyContent="center">
                    <Typography align='center' variant='h5'>
                        {props.areasOfInterest[0][4]}
                    </Typography>
                </Paper>
        </Box>
        <Box textAlign='center'>
            <Button onClick={props.onClickFunctions.showAreasOfInterestFunc} sx={{m: 1, border: "2px solid Black", color: "black", backgroundColor: 'white'}}>
                View All Areas Of Interest
            </Button>
        </Box>
        </div>
    );
}