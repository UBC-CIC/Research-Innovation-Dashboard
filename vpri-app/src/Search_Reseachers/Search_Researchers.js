import { Link } from 'react-router-dom'
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from "@mui/material/Typography";
import Stack from '@mui/material/Stack';
import Filter_Researchers_Bar from './Filter_Researchers_Bar'
import React, { Component }  from 'react';
import Search_Bar from '../search_bar'

export default function Search_Reseachers(props){
    return(
        <Box>
            <Grid container>
                <Grid item xs={12}>
                    <Paper square={true} variant='outlined' elevation={0}>
                        <Grid container>
                            <Grid item xs={12}>
                                <Typography align='center' variant='h5'>
                                    Search Researchers
                                </Typography>
                            </Grid>
                            <Grid item xs={12} align='center'>
                                <Search_Bar />
                            </Grid>
                            <Filter_Researchers_Bar />
                        </Grid>
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    
                </Grid>
            </Grid>
            <Link to="55765887300/">Michael Hayden</Link>
        </Box>
    );
}