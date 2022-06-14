import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import { styled } from '@mui/material/styles';
import ubcLogo from './ubc-logo.png'; // Tell webpack this JS file uses this image
import './stylesheet.css'
import ButtonGroup from '@mui/material/ButtonGroup';
import Search_Bar from './search_bar'
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import { Typography } from "@mui/material";
import { Link } from 'react-router-dom'
import { fontSize } from "@mui/system";
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

const Filler = styled('div')({
    flexGrow: 1,
});

export default function NAV_BAR() {
  
  function NavBarButtons() {
        const smallScreen = useMediaQuery(theme => theme.breakpoints.down("sm"));
        const mediumScreen = useMediaQuery(theme => theme.breakpoints.down("md"));
        console.log(smallScreen);
        console.log(mediumScreen);
        let buttonFontSize = "1.0rem";
        if(smallScreen){
            buttonFontSize = "0.625rem";
        }
        else if(mediumScreen){
            buttonFontSize = "0.75rem";
        }
        return(
              <ButtonGroup  color='primary' size='large' variant="text" aria-label="text button group">
                <Button sx={{fontSize: buttonFontSize}} href='/'>Home</Button>
                <Button sx={{fontSize: buttonFontSize}} href='/Researchers'>Researchers</Button>
                <Button sx={{fontSize: buttonFontSize}} href='/Rankings/'>Rankings</Button>
              </ButtonGroup>
              );
  }

  return (
    <div>
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{backgroundColor: 'white'}} elevation={0} variant='outlined'>
          <Toolbar sx={{height: 10}}>
              <img src={ubcLogo} alt=""></img>
              <ThemeProvider theme={headerTheme}>
                <Typography style={{textDecoration: "none"}} component={Link} to="/" variant="h3" color="#002145">UBC Research</Typography>
              </ThemeProvider>
            <Search_Bar />
          </Toolbar>
      </AppBar>
    </Box>
    <Box sx={{ flexGrow: 1 }}>
      <Paper square={true} elevation={0}>
            <Box backgroundColor='#002145' borderLeft={1} borderRight={1} id='testBorder' sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', '& > *': { m: 1,},}}>
              <ThemeProvider theme={navigationBarTheme}>
                <NavBarButtons />
              </ThemeProvider>
          </Box>
        </Paper>
    </Box>
    </div>
  );
}