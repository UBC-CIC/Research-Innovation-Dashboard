import React, { useState, useEffect } from "react";
import { CircularProgress } from '@mui/material';
import { Button } from "@mui/material";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';

export default function LoadingButton(props) {

    const [color, setColor] = useState("primary")

    //
    useEffect(() => {
        if(props.state == "Ready"){
            setColor("primary");
        }
        else if(props.state == "Loading"){
            setColor("primary");
        }
        else {
            setColor("secondary");
        }

    }, [props.state]);

    const theme = createTheme({
        palette: {
          primary: {
            main: "#1976D2"
        },
          secondary: {
            main: "#1EA672",
            light: '#1EA672',
            dark: '#1EA672'
          } 
        },
    });

    return (
        <ThemeProvider theme={theme}>
            <Button onClick={() => {props.onClickFunction()}} fullWidth={true} disableElevation={true} variant="contained" 
            color={color}
            sx={{borderRadius: 0, mt: props.mt, mb: props.mb, ml: props.ml, mr: props.mr}}
            disableRipple={true}>
                {props.state == "Ready" && props.buttonText}
                {props.state == "Loading" && <CircularProgress size="24px" sx={{color: "white"}} />}
                {props.state == "Success" && <CheckCircleOutlineIcon />}
            </Button>
        </ThemeProvider>
    );
}