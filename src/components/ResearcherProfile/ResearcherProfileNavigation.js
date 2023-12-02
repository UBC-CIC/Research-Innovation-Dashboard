import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import './ResearcherProfile.css'
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

const activeButtonStyle = {
  backgroundColor: "#C0C0C0"
}  

export default function Research_Profile_Navigation(props) {

    /* There is a bug if you click a link too fast where you get sent to the wrong place */
    return(
        <Grid item xs={12}>
            <Paper square={true} elevation={0}>
            <Box backgroundColor='#e6e6e6' sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', '& > *': { m: 1,},}}>
                    <ThemeProvider theme={navigationBarTheme}>
                    <ButtonGroup  color='primary' size='large' variant="text" aria-label="text button group">
                        <Button onClick={props.onClickFunctions.showOverviewFunc} sx={props.navButtonSelected === "Overview" ? activeButtonStyle : {}}>Overview</Button>
                        <Button onClick={props.onClickFunctions.showAreasOfInterestFunc} sx={props.navButtonSelected === "Areas of Interest" ? activeButtonStyle : {}}>Areas Of Interest</Button>
                        <Button onClick={props.onClickFunctions.showPublicationsFunc} sx={props.navButtonSelected === "Publications" ? activeButtonStyle : {}}>Publications</Button>
                        {(props.dataLength.grants > 0) && 
                          <Button onClick={props.onClickFunctions.showGrantsFunction} sx={props.navButtonSelected === "Grants" ? activeButtonStyle : {}}>Grants</Button>}
                        {(props.dataLength.patents > 0) && 
                          <Button onClick={props.onClickFunctions.showPatentsFunction} sx={props.navButtonSelected === "Patents" ? activeButtonStyle : {}}>Patents</Button>}
                          <Button onClick={props.onClickFunctions.showGraphFunc} sx={props.navButtonSelected === "Graph" ? activeButtonStyle : {}}>Graph</Button>
                    </ButtonGroup>
                    </ThemeProvider>
            </Box>
            </Paper>
        </Grid>
    );
}