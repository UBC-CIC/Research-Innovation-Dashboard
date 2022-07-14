import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import ubcLogo from './ubc-logo.png'; // Tell webpack this JS file uses this image
import './stylesheet.css'
import ButtonGroup from '@mui/material/ButtonGroup';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import { Typography } from "@mui/material";
import { Link } from 'react-router-dom'
import useMediaQuery from '@mui/material/useMediaQuery';

const headerTheme = createTheme({
  palette: {
    primary: {
      main: '#002145'
    },
  },
});

headerTheme.typography.h3 = {
  fontSize: '1.0rem',

  [headerTheme.breakpoints.up('sm')]: {
    fontSize: '1.7rem',
  },

  [headerTheme.breakpoints.up('md')]: {
    fontSize: '2.4rem',
  },
};

const navigationBarTheme = createTheme({
  palette: {
    primary: {
      main: '#FFFFFF',
    },
  },
});

export default function NAV_BAR() {
  
  function NavBarButtons() {
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
              <ButtonGroup color='primary' size='large' variant="text" aria-label="text button group">
                <Button sx={{fontSize: buttonFontSize, paddingLeft: "0%"}} href='/'>Home</Button>
                <Button sx={{fontSize: buttonFontSize}} href='/Search/Researchers'>Researchers</Button>
                <Button sx={{fontSize: buttonFontSize}} href='/Search/Publications'>Publications</Button>
                <Button sx={{fontSize: buttonFontSize}} href='/Rankings/'>Rankings</Button>
                <Button sx={{fontSize: buttonFontSize}} href='/UBC/Metrics/'>UBC Metrics</Button>
              </ButtonGroup>
              );
  }

  return (
    <div>
    <Box sx={{ flexGrow: 1}}>
      <AppBar position="static" sx={{backgroundColor: 'white'}} elevation={0} variant='outlined'>
          <Toolbar style={{paddingLeft: "2%"}} sx={{height: 10}}>
              <img style={{height: "80%", paddingRight: "1%", justifyContent: "center", marginTop: "5px"}} src={ubcLogo} alt=""></img>
              <ThemeProvider theme={headerTheme}>
                <Typography style={{textDecoration: "none"}} component={Link} to="/" onClick={() => {window.location.href="/"}} variant="h3" color="#002145">UBC Research</Typography>
              </ThemeProvider>
          </Toolbar>
      </AppBar>
    </Box>
    <Box sx={{ flexGrow: 1 }}>
      <Paper sx={{width: "100%"}} square={true} elevation={0}>
          <Box backgroundColor='#002145'
             sx={{display: 'flex', flexDirection: 'column','& > *': { m: 1, ml: "2%"},}}>
              <ThemeProvider theme={navigationBarTheme}>
                <NavBarButtons />
              </ThemeProvider>
          </Box>
      </Paper>
    </Box>
    </div>
  );
}