import * as React from 'react';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import './ResearcherProfile.css'
import Typography from "@mui/material/Typography";
import placeholderResearchPhoto from '../../assets/images/researcherPlaceholderImage.png'
import Stack from '@mui/material/Stack';

export default function Researcher_Info(props) {
    var date = new Date(props.researcher_information.lastUpdatedAt * 1000);
    var formattedDate = date.toLocaleString();

    return(
        <Grid item xs={4} sx={{}}>
            <Paper variant='outlined' sx={{height: "100%", borderTop: "0px", borderRight: "0px", borderBottom: "0px"}} square={true} elevation={0} component={Stack} direction="row">
                    <img alt='professor' style={{width: "20%", height: "fit-content", margin: "4%"}} src={placeholderResearchPhoto} />
                    <Paper elevation={0} sx={{width: "72%", marginTop: "4%"}}>
                        <Typography>{props.researcher_information.preferred_name} <br /></Typography>
                        <Typography> {props.researcher_information.prime_faculty}</Typography>
                        <Typography>{"Department: "+props.researcher_information.prime_department}</Typography>
                        <Typography>{"Email: "+props.researcher_information.email}</Typography>
                        <Typography>{"Rank: "+props.researcher_information.rank}</Typography>
                        <Typography>{"Scopus ID: "+props.researcher_information.scopusId}</Typography>
                        <Typography>{formattedDate}</Typography>
                    </Paper>
            </Paper>
        </Grid>
    )
}