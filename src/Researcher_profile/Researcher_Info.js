import * as React from 'react';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import './Researcher_profile.css'
import Typography from "@mui/material/Typography";
import placeholderResearchPhoto from '../placeholder.png'
import Stack from '@mui/material/Stack';

export default function Researcher_Info(props) {
    return(
        <Grid item xs={4} sx={{}}>
            <Paper square={true} elevation={0} component={Stack} direction="row">
                    <img alt='professor' style={{width: "20%", height: "fit-content", margin: "4%"}} src={placeholderResearchPhoto} />
                    <Paper elevation={0} sx={{width: "72%", marginTop: "4%"}}>
                        <Typography>{props.researcher_information.preferred_name} <br /></Typography>
                        <Typography> {props.researcher_information.prime_faculty}</Typography>
                        <Typography>{"Department: "+props.researcher_information.prime_department}</Typography>
                        <Typography>{"Email: "+props.researcher_information.email}</Typography>
                        <Typography>{"Phone: "+props.researcher_information.phone_number}</Typography>
                        <Typography>{"Office: "+props.researcher_information.office}</Typography>
                    </Paper>
            </Paper>
        </Grid>
    )
}