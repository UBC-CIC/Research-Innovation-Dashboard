import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from "@mui/material/Typography";
import Stack from '@mui/material/Stack';
import './Researcher_profile.css'

export default function INTELLECTUAL_PROPERTY(props){
    return(
        <div id='full_box'>
            <Box sx={{flexGrow: 1, textAlign: 'center'}}>
                <div id='header_text'>Intellectual Property Activity</div>
            </Box>
            <Box
            sx={{
            display: 'flex',
            flexWrap: 'wrap',
            '& > :not(style)': {
            width: 150,
            height: 150,},}}>
                <Paper square={true} elevation={0} sx={{flexGrow: 1, ml: 0, mt: 1, mr: 1, mb: 1, border: 1}} component={Stack} direction="column" justifyContent="center" ml={0}>
                    <Typography align='center' variant='h4'>
                        {props.researcher_information.num_patents_filed}
                    </Typography>
                    <Typography align='center'>
                        Filed Patent
                    </Typography>
                </Paper>
                <Paper square={true} elevation={0} sx={{flexGrow: 1, m: 1, border: 1}} component={Stack} direction="column" justifyContent="center">
                    <Typography align='center' variant='h4'>
                        {props.researcher_information.num_licensed_patents}
                    </Typography>
                    <Typography align='center'>
                        Licensed Patent
                    </Typography>
                </Paper>
            </Box>
        </div>
    );}