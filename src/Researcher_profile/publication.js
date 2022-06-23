import * as React from 'react';
import Paper from '@mui/material/Paper';
import Typography from "@mui/material/Typography";
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';

const gridStyling = {
    height: "100%",
}

export default function PUBLICATION({publication_data}){
    return(
        <Grid container gridAutoRows='1fr' style={{marginLeft: "2%", marginRight: "2%"}}>
                    <Grid item xs={8}>
                        <Paper style={gridStyling} square={true} elevation={0} sx={{textAlign: 'left'}}>
                            <Typography variant='h5'>
                                <a href="A">
                                    {publication_data.title}
                                </a>
                            </Typography>
                            <Typography>{publication_data.authors}</Typography>
                            <Typography>Journal Of {publication_data.journal}</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={2}>
                        <Paper style={gridStyling} square={true} elevation={0} component={Stack} direction="column" justifyContent="center">
                            <Typography align='center' variant='h6'>
                                {publication_data.cited_by}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={2}>
                        <Paper style={gridStyling} square={true} elevation={0} component={Stack} direction="column" justifyContent="center">
                            <Typography align='center' variant='h6'>
                                {publication_data.year_published}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
    );}