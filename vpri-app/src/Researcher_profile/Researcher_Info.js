import * as React from 'react';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import professor_photo from './professor_photo.png';
import './Researcher_profile.css'

const leftGrid = {
    height: "100%",
    paddingLeft: 24,
    backgroundColor: "#fff"
  };

export default function Researcher_Info(props) {
    return(
        <Grid item xs={4} sx={{}}>
            <Paper style={leftGrid} square={true} elevation={0} variant="outlined">
                <div id='header_text'>
                    {props.researcher_information.preferred_name}
                </div>
                <div>
                    <img alt="" src={professor_photo} id='prof_image'></img>
                    <p id='content'>
                        Department of {props.researcher_information.prime_department} <br />
                        {props.researcher_information.prime_faculty}<br />
                        Email: {props.researcher_information.email}<br />
                        Phone: {props.researcher_information.phone_number}<br />
                        Office: {props.researcher_information.office}<br />
                    </p>
                </div>
            </Paper>
        </Grid>
    )
}