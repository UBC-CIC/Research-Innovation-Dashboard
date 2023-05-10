import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from "@mui/material/Typography";
import Stack from '@mui/material/Stack';
import { Grid } from '@mui/material';
import './ResearcherProfile.css'

export default function Grant(props){

    const PADDING = "3%"

    return(
                <Grid container>
                    <Grid item xs={2}>
                        <Paper
                        square={true}
                        elevation={0}
                        variant="outlined"
                        sx={{ pl: PADDING, textAlign: "left", height: "100%", justifyContent: "center", flexDirection: "column", display: "flex" }}
                        >
                            <a href={"/Researchers/" + props.assigned_id + "/"} target="_blank" rel="noopener noreferrer">{props.name}</a>
                        </Paper>
                    </Grid>
                    <Grid item xs={6}>
                        <Paper
                        square={true}
                        elevation={0}
                        variant="outlined"
                        sx={{ pl: "1%", textAlign: "left", height: "100%", justifyContent: "center", flexDirection: "column", display: "flex" }}
                        >
                            {props.projectTitle}
                        </Paper>
                    </Grid>
                    <Grid item xs={2}>
                        <Paper
                        square={true}
                        elevation={0}
                        variant="outlined"
                        sx={{ pl: PADDING, textAlign: "left", height: "100%", justifyContent: "center", flexDirection: "column", display: "flex" }}
                        >
                            {props.agency}
                        </Paper>
                    </Grid>
                    <Grid item xs={1}>
                        <Paper
                        square={true}
                        elevation={0}
                        variant="outlined"
                        sx={{ pl: PADDING, textAlign: "left", height: "100%", justifyContent: "center", flexDirection: "column", display: "flex" }}
                        >
                            {"$"+props.amount.toLocaleString()}
                        </Paper>
                    </Grid>
                    <Grid item xs={1}>
                        <Paper
                        square={true}
                        elevation={0}
                        variant="outlined"
                        sx={{ pl: PADDING, textAlign: "left", height: "100%", justifyContent: "center", flexDirection: "column", display: "flex" }}
                        >
                            {props.year}
                        </Paper>
                    </Grid>
                </Grid>
    );}