import * as React from 'react';
import { useEffect, useState } from 'react'
import Paper from '@mui/material/Paper';
import { Typography, Link } from '@mui/material';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { Auth } from 'aws-amplify';

export default function ForceChangePassword(props) {
    const [forgotEmail, setForgotEmail] = useState("");
    const [emailError, setEmailError] = useState(false);
    const [emailErrorMessage, setEmailErrorMessage] = useState("");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [confirmPasswordErrorText, setConfirmPasswordErrorText] = useState("");
    const [confirmPasswordError, setConfirmPasswordError] = useState(false);

    const [lowerCaseIcon, setLowerCaseIcon] = useState(<CancelIcon color="error" sx={{mr: "16px"}}/>);
    const [upperCaseIcon, setUpperCaseIcon] = useState(<CancelIcon color="error" sx={{mr: "16px"}}/>);
    const [oneDigitIcon, setOneDigitIcon] = useState(<CancelIcon color="error" sx={{mr: "16px"}}/>);
    const [oneSpecialIcon, setOneSpecialIcon] = useState(<CancelIcon color="error" sx={{mr: "16px"}}/>);
    const [moreThanEightIcon, setMoreThanEightIcon] = useState(<CancelIcon color="error" sx={{mr: "16px"}}/>);
    const [lessThan16Icon, setLessThan16Icon] = useState(<CancelIcon color="error" sx={{mr: "16px"}}/>);

    function hasLowerCase(str) {
        if(/[a-z]/.test(str)){
            setLowerCaseIcon(<CheckCircleIcon color="success" sx={{mr: "16px"}}/>);
            return true;
        }
        else{
            setLowerCaseIcon(<CancelIcon color="error" sx={{mr: "16px"}}/>);
            return false;
        }
    }

    function hasUpperCase(str) {
        if(/[A-Z]/.test(str)){
            setUpperCaseIcon(<CheckCircleIcon color="success" sx={{mr: "16px"}}/>);
            return true;
        }
        else{
            setUpperCaseIcon(<CancelIcon color="error" sx={{mr: "16px"}}/>);
            return false;
        }
    }

    function hasNumber(str) {
        if(/[0-9]/.test(str)){
            setOneDigitIcon(<CheckCircleIcon color="success" sx={{mr: "16px"}}/>);
            return true;
        }
        else{
            setOneDigitIcon(<CancelIcon color="error" sx={{mr: "16px"}}/>);
            return false;
        }
    }

    function hasSpecialCharacter(str) {
        if(/[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(str)){
            setOneSpecialIcon(<CheckCircleIcon color="success" sx={{mr: "16px"}}/>);
            return true;
        }
        else{
            setOneSpecialIcon(<CancelIcon color="error" sx={{mr: "16px"}}/>);
            return false;
        }
    }

    function moreThanEightCharacters(str) {
        str.length > 8 ? setMoreThanEightIcon(<CheckCircleIcon color="success" sx={{mr: "16px"}}/>)  : setMoreThanEightIcon(<CancelIcon color="error" sx={{mr: "16px"}}/>)
        return str.length > 8 ? true  : false
    }

    function moreThanSixteenCharacters(str) {
        str.length < 16 ? setLessThan16Icon(<CheckCircleIcon color="success" sx={{mr: "16px"}}/>)  : setLessThan16Icon(<CancelIcon color="error" sx={{mr: "16px"}}/>)
        return str.length < 16 ? true  : false
    }

    function checkRequirements(newPassword) {
        if(hasLowerCase(newPassword) &&
        hasUpperCase(newPassword) &&
        hasNumber(newPassword) &&
        hasSpecialCharacter(newPassword) &&
        moreThanEightCharacters(newPassword) &&
        moreThanSixteenCharacters(newPassword)){
            return true;
        }
        return false;
    }

    useEffect(() => {
        hasLowerCase(newPassword)
        hasUpperCase(newPassword)
        hasNumber(newPassword)
        hasSpecialCharacter(newPassword)
        moreThanEightCharacters(newPassword)
        moreThanSixteenCharacters(newPassword)
    }, [newPassword]);

    useEffect(() => {
        checkPasswordSame();
    }, [confirmPassword]);

    function checkPasswordSame() {
        if(newPassword != confirmPassword){
            setConfirmPasswordErrorText("Passwords do not match.");
            setConfirmPasswordError(true);
            return false
        }
        else {
            setConfirmPasswordErrorText("");
            setConfirmPasswordError(false);
            return true
        }
    }

    async function changePassword() {
        if(!checkRequirements(newPassword)){
            return;
        }

        try {
            Auth.completeNewPassword(props.user, newPassword);
        } catch (e) {
        }
    }

    return (
        <Paper sx={{width: props.componentWidth, pl:"3%", pr:"3%"}}>

            <Typography variant='h5' sx={{pt: "16px"}} align='left'>Change Inital Password to Login</Typography>

            <Typography align="left" sx={{pt: "16px"}}>Password</Typography>
            <TextField
                onChange={(e)=>{setNewPassword(e.target.value)}}
                sx={{width: "100%"}}
                type="password"
            />

            <Typography align="left" sx={{pb: "16px"}}>Your password must have the following:</Typography>
            
            <Typography align="left" sx={{verticalAlign: 'middle', display: 'inline-flex', width: "100%", mb: "16px"}}>
                {upperCaseIcon} At least one uppercase letter
            </Typography>
            <Typography align="left" sx={{verticalAlign: 'middle', display: 'inline-flex', width: "100%", mb: "16px"}}>
                {lowerCaseIcon} At least one lowercase letter
            </Typography>
            <Typography align="left" sx={{verticalAlign: 'middle', display: 'inline-flex', width: "100%", mb: "16px"}}>
                {oneDigitIcon} At least one digit
            </Typography>
            <Typography align="left" sx={{verticalAlign: 'middle', display: 'inline-flex', width: "100%", mb: "16px"}}>
                {oneSpecialIcon} At least one special character
            </Typography>
            <Typography align="left" sx={{verticalAlign: 'middle', display: 'inline-flex', width: "100%", mb: "16px"}}>
                {moreThanEightIcon} Should be more than 8 characters
            </Typography>
            <Typography align="left" sx={{verticalAlign: 'middle', display: 'inline-flex', width: "100%"}}>
                {lessThan16Icon} Should be less than 16 characters
            </Typography>

            <Typography align="left" sx={{pt: "16px"}}>Confirm Password</Typography>
            <TextField
                onChange={(e)=>{setConfirmPassword(e.target.value);}}
                sx={{width: "100%"}}
                type="password"
                helperText={confirmPasswordErrorText}
                error={confirmPasswordError}
            />

            <Paper elevation={0}>
                <Button sx={{width: "100%", mt: "32px"}} onClick={() => {changePassword()}} variant="contained" disableElevation>
                   Change Password
                 </Button>
            </Paper>
            <Typography align='left' sx={{pt: "16px", pb: "16px"}}><Link sx={{cursor: 'pointer'}} onClick={()=>{props.setContentToShow("login")}}>Go Back</Link></Typography>
        </ Paper>
    );
}