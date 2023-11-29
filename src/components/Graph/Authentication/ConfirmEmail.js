import * as React from 'react';
import { useEffect, useState } from 'react'
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid'
import { Stack } from '@mui/system';
import { Typography, Link, breadcrumbsClasses } from '@mui/material';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

import { Amplify } from "aws-amplify";
import awsmobile from "../../aws-exports";
import { Auth } from 'aws-amplify';

Amplify.configure(awsmobile);

export default function ConfirmEmail(props) {
    const [loginCode, setLoginCode] = useState("");
    const [verificationCodeError, setVerificationCodeError] = useState(false);
    const [verificationCodeErrorMessage, setVerificationCodeErrorMessage] = useState("");

    async function confirmSignUp() {
        try {
          await Auth.confirmSignUp(props.userEmail, loginCode);
          props.setContentToShow("login");

        } catch (e) {
            console.log(e.message);
            switch (e.message) {
                case 'Confirmation code cannot be empty':
                    setVerificationCodeError(true);
                    setVerificationCodeErrorMessage("Confirmation code cannot be empty.");
                    break;
                case 'Invalid verification code provided, please try again.':
                    setVerificationCodeError(true);
                    setVerificationCodeErrorMessage("Invalid verification code provided, please try again.");
                    break;
            }
        }
    }

    async function resendConfirmationCode() {
        try {
            await Auth.resendSignUp(props.userEmail);
            console.log('code resent successfully');
        } catch (e) {
            console.log(e.message);
            switch (e.message) {
                case 'Incorrect username or password.':
            }
        }
    }
  
    return (
        <Paper sx={{width: props.componentWidth, pl:"3%", pr:"3%"}}>
            <Typography variant='h5' sx={{pt: "16px"}} align='left'>Confirm Your Email</Typography>
            <Typography align="left" sx={{pt: "16px"}}>Login Code</Typography>
            <TextField
                 onChange={(e)=>{
                    setLoginCode(e.target.value);
                    setVerificationCodeError(false);
                    setVerificationCodeErrorMessage("");
                }}
                 sx={{width: "100%"}}
                 error={verificationCodeError}
                 helperText={verificationCodeErrorMessage}
            />
            <Typography align="left"><Link sx={{cursor: 'pointer'}} onClick={() => {resendConfirmationCode()}} >Resend Confirmation Link</Link></Typography>
            <Paper elevation={0}>
                <Button sx={{width: "100%", mt: "32px"}} onClick={() => {confirmSignUp()}} variant="contained" disableElevation>
                    Verify Account
                </Button>
            </Paper>
            <Typography align='left' sx={{pt: "16px", pb: "16px"}}><Link sx={{cursor: 'pointer'}} onClick={()=>{props.setContentToShow("login")}}>Go Back</Link></Typography>
        </ Paper>
    );
}