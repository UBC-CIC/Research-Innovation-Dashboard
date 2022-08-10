import React, { useState, useEffect } from "react";
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from "@mui/material/Typography";
import Stack from '@mui/material/Stack';
import InputBase from "@mui/material/InputBase";
import Button from "@mui/material/Button";

export default function AdminDashboardInputRow(props) {

    // for this you are going to want them to input the new scopus ID then we gather information on the person
    // display new information and ask if this is the person they want to change it to.
    // then trigger a lambda that will run and update the person information.
    
    const handleClickOpen = () => {
        props.setOpen(true);
    };

  return (
    <Grid container>
        <Paper
            square={true}
            elevation={0}
            sx={{ width: "100%", m: "2%" }}
            component={Stack}
            direction="row"
        >
            <Paper
                elevation={0}
                sx={{ width: "20%", paddingRight: "2%" }}
                component={Stack}
                direction="column"
                justifyContent="center"
            >
                <Typography variant="h7">{props.inputDescription}</Typography>
            </Paper>
            <Paper square={true} elevation={0} sx={{ width: "50%", border: 1 }}>
                <InputBase
                    value={props.inputValue}
                    onChange={(e) => {
                        props.setValue(e.target.value);
                    }}
                    fullWidth={true}
                    sx={{ padding: "8px", fontSize: "1.0rem" }}
                />
            </Paper>
            <Paper
                elevation={0}
                sx={{ width: "30%", paddingLeft: "2%" }}
                component={Stack}
                direction="column"
                justifyContent="center"
            >
                <Button onClick={() => {handleClickOpen()}}
                    sx={{borderRadius: 0, height: "100%", border: "2px solid Black", color: "black", backgroundColor: 'white'}}>
                    {props.buttonText}
                </Button>
            </Paper>
        </Paper>
    </Grid>
  );
}
