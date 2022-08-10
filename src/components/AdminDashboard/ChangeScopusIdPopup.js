import React, { useState, useEffect } from "react";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import Typography from "@mui/material/Typography";
import Stack from '@mui/material/Stack';
import InputBase from "@mui/material/InputBase";
import Grid from '@mui/material/Grid';
import placeholderResearchPhoto from '../../assets/images/researcherPlaceholderImage.png';
import Amplify from "@aws-amplify/core";
import { Auth } from "@aws-amplify/auth";
import awsmobile from "../../aws-exports";

import { API } from "aws-amplify";
import {
  getResearcherFull,
} from "../../graphql/queries";

Amplify.configure(awsmobile);
Auth.configure(awsmobile);

export default function ChangeScopusIdPopup(props) {
  const [newScopusId, setNewScopusId] = useState("");
  const [preferred_name, set_preferred_name] = useState("");
  const [prime_department, set_prime_department] = useState("");
  const [prime_faculty, set_prime_faculty] = useState("");
  const [email, set_email] = useState("");
  const [phone_number, set_phone_number] = useState("");
  const [office, set_office] = useState("");
  const [sortedAreasOfInterest, setSortedAreasOfInterest] = useState([]);
  const [scopusIdFound, setScopusIdFound] = useState(false);

  const handleClose = () => {
    props.setOpen(false);
  };
  const handleChangeScopusId = () => {
    
  }

  const getResearcherGeneralInformation = async () => {
    console.log(props.oldScopusId)
    const researcher_data_response = await API.graphql({
      query: getResearcherFull,
      variables: { id: props.oldScopusId },
    });
    let researcher_data = researcher_data_response.data.getResearcherFull;
    set_preferred_name(researcher_data.preferred_name);
    set_prime_department(researcher_data.prime_department);
    set_prime_faculty(researcher_data.prime_faculty);
    set_email(researcher_data.email);
    set_phone_number("");
    set_office("");

    // create weighted list of keywords
    let keywordHashmap = new Map();
    let keyWords = researcher_data.keywords.split(", ");

    for (let i = 0; i < keyWords.length; i++) {
      if (keywordHashmap.get(keyWords[i])) {
        keywordHashmap.set(keyWords[i], keywordHashmap.get(keyWords[i]) + 1);
      } else {
        keywordHashmap.set(keyWords[i], 1);
      }
    }

    let sortedKeywordHashmap = [...keywordHashmap].sort((a, b) => b[1] - a[1]);

    let sortedAreas = [];

    for (let i = 0; i < sortedKeywordHashmap.length; i++) {
      sortedAreas.push(sortedKeywordHashmap[i][0]);
    }
    // save weighted list of keywords to state variable
    setSortedAreasOfInterest(sortedAreas);
    setScopusIdFound(true);
  };

  useEffect(() => {
    if(props.open === true){
        getResearcherGeneralInformation().catch(()=>{setScopusIdFound(false)});
    }
  }, [props.open]);

  const newScopusIDInput = () => {
    return(
    <Grid container sx={{marginTop: "5%"}}>
        <Paper
            square={true}
            elevation={0}
            sx={{ width: "100%"}}
            component={Stack}
            direction="row"
        >
            <Paper
                elevation={0}
                sx={{ width: "30%"}}
                component={Stack}
                direction="column"
                justifyContent="center"
            >
                <Typography variant="h7">Input New Scopus ID:</Typography>
            </Paper>
            <Paper square={true} elevation={0} sx={{ width: "70%", border: 1}}>
                <InputBase
                    value={newScopusId}
                    onChange={(e) => {
                        setNewScopusId(e.target.value);
                    }}
                    fullWidth={true}
                    sx={{ padding: "8px", fontSize: "1.0rem" }}
                />
            </Paper>
        </Paper>
    </Grid>
    );
  }

  const researcherInfo = () => {
    return(
        <Paper square={true} elevation={0} component={Stack} direction="row">
            <img alt='professor' style={{width: "15%", height: "fit-content", marginRight: "4%"}} src={placeholderResearchPhoto} />
            <Paper elevation={0} sx={{width: "72%"}}>
                <Typography>{"Name: "+preferred_name} <br /></Typography>
                <Typography>{"Faculty: "+prime_faculty}</Typography>
                <Typography>{"Department: "+prime_department}</Typography>
                <Typography>{"Email: "+email}</Typography>
                <Typography>{"Phone: "+phone_number}</Typography>
                <Typography>{`Top Five Keywords: ${sortedAreasOfInterest[0]}, ${sortedAreasOfInterest[1]}, ${sortedAreasOfInterest[2]}, ${sortedAreasOfInterest[3]}, and ${sortedAreasOfInterest[4]}`}</Typography>
            </Paper>
        </Paper>
    );
  }

  return (
    <div>
      <Dialog open={props.open} onClose={handleClose}
      PaperProps={{ sx: { minWidth: "70%", maxHeight: "70%" } }}>
        <DialogTitle>Changed Scopus ID: {props.oldScopusId}</DialogTitle>
        <DialogContent sx={{fontFamily: "Arial"}}>
            {!scopusIdFound && <Typography>No researcher found with scopus ID: {props.oldScopusId}</Typography>}
            {scopusIdFound && researcherInfo()}
            {newScopusIDInput()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          {scopusIdFound && <Button onClick={handleClose}>Change Scopus ID</Button>}
        </DialogActions>
      </Dialog>
    </div>
  );
}
