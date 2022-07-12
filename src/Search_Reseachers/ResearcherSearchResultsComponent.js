import { Link } from 'react-router-dom'
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from "@mui/material/Typography";
import Stack from '@mui/material/Stack';
import React  from 'react';
import placeholderResearchPhoto from '../placeholder.png'
import Button from "@mui/material/Button";

export default function ResearcherSearchResultsComponent(props){

    function ShowAllResearcherResultsButton() {
        return(
            <Paper square={true} elevation={0} sx={{width: "100%", justifyContent: "center", marginTop: "1%", marginBottom: "1%"}} component={Stack} direction="row">
            <Button onClick={() => {console.log("Clicked Button")}}
            sx={{m: 1, border: "2px solid Black", color: "black", backgroundColor: 'white'}}>
                {"Show All "+props.researchSearchResults.length+" Researcher Results"}
            </Button>
            </Paper>
        );
    }

    const ResearchResultsElement =  props.researchSearchResults.filter((data,index) =>index < 6).map((researcher)=> {
        return (
            <Paper key={researcher.scopus_id} square={true} elevation={0} sx={{borderTop: "0px", width: "50%", marginRight: "0%"}} component={Stack} direction="row">
                    <img alt='professor' style={{width: "20%", height: "fit-content", margin: "4%"}} src={placeholderResearchPhoto} />
                    <Paper elevation={0} sx={{width: "72%", marginTop: "4%"}}>
                        <Link style={{fontSize: "24px"}} to={"/Researchers/"+researcher.scopus_id+"/"}>{researcher.preferred_name} <br /></Link>
                        <Typography> {researcher.prime_faculty}</Typography>
                        <Typography>{"Department: "+researcher.prime_department}</Typography>
                        <Typography>{"Email: "+researcher.email}</Typography>
                    </Paper>
            </Paper>
        );
    });

    return(
        <Grid container>
            {(props.researchSearchResults.length === 0) && 
                <Paper elevation={0} square={true} sx={{width: "100%"}}>
                    <Typography variant='h4' sx={{marginLeft: "2%", marginTop: "2%"}}>No Researcher Search Results</Typography>
                </Paper>
            }
            {(props.researchSearchResults.length !== 0) && 
                <Paper elevation={0} square={true} sx={{width: "100%"}}>
                    <Typography variant='h4' sx={{marginLeft: "2%", marginTop: "2%"}}>Research Search Results</Typography>
                </Paper>
            }
            {ResearchResultsElement}
            {(props.researchSearchResults.length !== 0) && <ShowAllResearcherResultsButton />}
        </Grid>
    );
}