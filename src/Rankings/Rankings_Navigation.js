import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Button from "@mui/material/Button";
import ButtonGroup from '@mui/material/ButtonGroup';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const navigationBarTheme = createTheme({
    palette: {
      primary: {
        main: '#002145'
      },
    },
  });

export default function Rankings_Navigation(props) {
    function TheButtonGroup() {
        const smallScreen = useMediaQuery(theme => theme.breakpoints.down("sm"));
        const mediumScreen = useMediaQuery(theme => theme.breakpoints.down("md"));
        let buttonFontSize = "1.0rem";
        if(smallScreen){
            buttonFontSize = "0.625rem";
        }
        else if(mediumScreen){
            buttonFontSize = "0.75rem";
        }

        return(
                <ButtonGroup size='large' variant="text" aria-label="text button group" >
                    <Button sx={{fontSize: buttonFontSize, paddingLeft: "0%"}} onClick={props.onClickFunctions.byDepartmentButton}>Rank By Department</Button>
                    <Button sx={{fontSize: buttonFontSize}} onClick={props.onClickFunctions.byFacultyButton}>Rank By Faculty</Button>
                    <Button sx={{fontSize: buttonFontSize}} onClick={props.onClickFunctions.overallRankingsButton}>Overall Rankings</Button>
                </ButtonGroup>
        );
    }

    return(
        <Grid item xs={12}>
            <Paper sx={{width: "100%"}} square={true} elevation={0}>
                <Box backgroundColor='#e6e6e6' sx={{display: 'flex', flexDirection: 'column','& > *': { m: 1, ml: "2%"},}}>
                    <ThemeProvider theme={navigationBarTheme}>
                        <TheButtonGroup />
                    </ThemeProvider>
                </Box>
            </Paper>
        </Grid>
    );
}