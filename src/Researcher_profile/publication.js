import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from "@mui/material/Typography";
import Stack from '@mui/material/Stack';
import Button from "@mui/material/Button";
import Grid from '@mui/material/Grid';

const gridStyling = {
    height: "100%",
}

export default function PUBLICATION({publication_data}){
    return(
        <Grid container gridAutoRows='1fr'>
                    <Grid item xs={8}>
                        <Paper style={gridStyling} square={true} elevation={0} sx={{textAlign: 'left'}}>
                            <Typography variant='h5'>
                                <a href={publication_data.Article_Link}>
                                    {publication_data.Title}
                                </a>
                            </Typography>
                            <Typography>{publication_data.Authors}</Typography>
                            <Typography>Journal Of {publication_data.Journal}</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={2}>
                        <Paper style={gridStyling} square={true} elevation={0} component={Stack} direction="column" justifyContent="center">
                            <Typography align='center' variant='h6'>
                                {publication_data.Citations}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={2}>
                        <Paper style={gridStyling} square={true} elevation={0} component={Stack} direction="column" justifyContent="center">
                            <Typography align='center' variant='h6'>
                                {publication_data.Year_Published}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
    );}