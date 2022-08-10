import React, { useState, useEffect } from "react";
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from "@mui/material/Typography";
import Stack from '@mui/material/Stack';
import InputBase from "@mui/material/InputBase";
import Button from "@mui/material/Button";
import AdminDashboardInputRow from "./AdminDashboardInputRow";
import ChangeScopusIdPopup from "./ChangeScopusIdPopup";

export default function AdminDashboard() {

    const [oldScopusId, setOldScopusId] = useState("");
    const [dialogOpen, setDialogOpen] = React.useState(false);

    // for this you are going to want them to input the new scopus ID then we gather information on the person
    // display new information and ask if this is the person they want to change it to.
    // then trigger a lambda that will run and update the person information.
    
  return (
    <Grid container>
        <Paper square={true} elevation={0} sx={{width: "100%", pl: "2%", pr: "2%", borderBottom: 1, borderColor: "rgba(0, 0, 0, 0.12)"}} component={Stack} direction="row">
            <Typography variant='h4' sx={{m: "2%", ml: "0%"}}>
                Admin Dashboard
            </Typography>
        </Paper>
        <AdminDashboardInputRow 
        inputDescription={"Researcher Scopus ID you would like to change"}
        inputValue={oldScopusId}
        setValue={setOldScopusId}
        setOpen={setDialogOpen}
        buttonText={"Look Up Scopus ID"}
        />
        <ChangeScopusIdPopup open={dialogOpen} setOpen={setDialogOpen} oldScopusId={oldScopusId}/>
    </Grid>
  );
}
