import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from "@mui/material/Typography";
import React from 'react';

export default function Advanced_Search(props){
    return(
        <Box>
            <Grid container>
                <Grid item xs={12}>
                    <Paper square={true} variant='outlined' elevation={0}>
                        <Grid container>
                            <Grid item xs={12}>
                                <Typography align='center' variant='h5' sx ={{margin: "8px"}}>
                                    Advanced Search
                                </Typography>
                            </Grid>
                            <Grid item xs={3}>
                                <Typography variant='h5' sx ={{border: 1}}>
                                    Advanced Search
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant='h5' sx ={{border: 1}}>
                                    Advanced Search
                                </Typography>
                            </Grid>
                            <Grid item xs={3}>
                                <Typography variant='h5' sx ={{border: 1}}>
                                    Advanced Search
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}