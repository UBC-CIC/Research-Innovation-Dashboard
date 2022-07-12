import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import './Researcher_profile.css'
import Button from "@mui/material/Button";
import ButtonGroup from '@mui/material/ButtonGroup';

import { createTheme, ThemeProvider } from '@mui/material/styles';

const navigationBarTheme = createTheme({
    palette: {
      primary: {
        main: '#002145'
      },
    },
  });

export default function Research_Profile_Navigation(props) {

    /* There is a bug if you click a link too fast where you get sent to the wrong place */
    return(
        <Grid item xs={12}>
            <Paper square={true} elevation={0}>
            <Box backgroundColor='#e6e6e6' sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', '& > *': { m: 1,},}}>
                    <ThemeProvider theme={navigationBarTheme}>
                    <ButtonGroup  color='primary' size='large' variant="text" aria-label="text button group">
                        <Button onClick={props.onClickFunctions.showOverviewFunc}>Overview</Button>
                        <Button onClick={props.onClickFunctions.showAreasOfInterestFunc}>Areas Of Interest</Button>
                        <Button onClick={props.onClickFunctions.showPublicationsFunc}>Publications</Button>
                    </ButtonGroup>
                    </ThemeProvider>
            </Box>
            </Paper>
        </Grid>
    );
}