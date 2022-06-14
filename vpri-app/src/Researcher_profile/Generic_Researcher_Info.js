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

export default function Generic_Researcher_Info(props) {
    console.log(props.prof);
    return(
        <Grid item xs={4}>
            <Paper style={leftGrid} square={true} elevation={0}>
                <div>
                    <img alt="" src={props.prof.professor_photo} id='prof_image'></img>
                    <p id='content'>
                        {props.prof.professor_name} <br />
                        Department of {props.prof.department} <br />
                        Faculty of {props.prof.faculty}<br />
                        Email: {props.prof.email}<br />
                        Phone: {props.prof.phone}<br />
                        Office: {props.prof.office}<br />
                        <a href="shared_page">{props.prof.works_published_together} Works Published Together</a><br />
                        <a href="shared_page">{props.prof.areas_of_interest_shared} shared Areas of Interest</a><br />
                    </p>
                </div>
            </Paper>
        </Grid>
    )
}