import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from "@mui/material/Typography";
import Stack from '@mui/material/Stack';
import React  from 'react';
import SearchBar from '../search_bar'
import { useState, useEffect } from 'react';
import ResearcherSearchResultsComponent from './ResearcherSearchResultsComponent'
import PublicationSearchResultsComponent from './PublicationSearchResultsComponent'
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { Box } from "@mui/material";
import AutoCompleteStyled from './AutoCompleteStyled'
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import SearchFiltersBar from './SearchFiltersBar';

import { API } from 'aws-amplify';

import {
    getAllDepartments,
  } from '../graphql/queries';


export default function SearchComponent(props){
    const [researchSearchResults, setResearcherSearchResults] = useState([]);
    const [publicationSearchResults, setPublicationSearchResults] = useState([]);
    const [allDepartments, setAllDepartments] = useState([]);

    const getAllDepartmentsFunction = async () => {
        const result = await API.graphql({
            query: getAllDepartments,
        });
        result.data.getAllDepartments.unshift("All Departments");
        setAllDepartments(result.data.getAllDepartments);
    }

    useEffect(() => {
        getAllDepartmentsFunction();
    }, []);
      

    let path = '/';

    if(props.whatToSearch === "Publications"){
        path='/Search/Publications/';
    }
    else if(props.whatToSearch === "Researchers"){
        path='/Search/Researchers/';
    }

    function TheButtonGroup() {
        const smallScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));
        const mediumScreen = useMediaQuery((theme) => theme.breakpoints.down("md"));
        let buttonFontSize = "1.0rem";
        if (smallScreen) {
        buttonFontSize = "0.625rem";
        } else if (mediumScreen) {
        buttonFontSize = "0.75rem";
        }

        return (
        <ButtonGroup size="large" variant="text" aria-label="text button group">
            <Button
            sx={{ fontSize: buttonFontSize, paddingLeft: "0%" }}
            onClick={props.onClickFunctions.byDepartmentButton}
            >
            Rank By Department
            </Button>
            <Button
            sx={{ fontSize: buttonFontSize }}
            onClick={props.onClickFunctions.byFacultyButton}
            >
            Rank By Faculty
            </Button>
            <Button
            sx={{ fontSize: buttonFontSize }}
            onClick={props.onClickFunctions.overallRankingsButton}
            >
            Overall Rankings
            </Button>
        </ButtonGroup>
        );
    }


    return(
        <div>
            <Grid container>
                <Grid item xs={12}>
                    <Paper square={true} variant='outlined' elevation={0}>
                        <Grid container>
                            <Grid item xs={12}>
                                <Typography align='center' variant='h5' sx ={{margin: "8px"}}>
                                    {"Search "+props.whatToSearch}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} align='center'>
                                <SearchBar setResearcherSearchResults={setResearcherSearchResults}
                                setPublicationSearchResults={setPublicationSearchResults}
                                whatToSearch={props.whatToSearch}
                                path={path}/>
                                <Paper square={true} elevation={0} sx={{width: "60%", marginTop: "8px", marginBottom: "8px", flexDirection: "row-reverse"}} component={Stack} direction="row">
                                    <a href={'/AdvancedSearch/'+props.whatToSearch+'/ / / / /All Departments/All Faculties/2017-07/2022-07/All Journals/'}>Advanced Search</a>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
                <SearchFiltersBar />
            </Grid>
            <Grid container>
                <Grid item xs={2}>
                    <Box sx={{marginLeft: "10%", marginTop: "10%"}}>
                        <Typography variant='h6'>
                            Researcher Filters
                        </Typography>
                        <FormGroup>
                            <FormControlLabel control={<Checkbox onChange={() => {console.log("changed")}} />} label="Researcher with work in the last 5 years" />
                            <FormControlLabel control={<Checkbox onChange={() => {console.log("changed")}} />} label="Researcher with work in the last 10 years" />
                        </FormGroup>
                        {/* <AutoCompleteStyled value={allDepartments} setValue={setAllDepartments} DropDownArray={allDepartments} /> */}
                    </Box>
                </Grid>
                <Grid item xs={10}>
                    {(props.whatToSearch === "Everything" || props.whatToSearch === "Researchers") && <ResearcherSearchResultsComponent researchSearchResults={researchSearchResults}/>}
                    {(props.whatToSearch === "Everything" || props.whatToSearch === "Publications") && <PublicationSearchResultsComponent publicationSearchResults={publicationSearchResults}/>}
                </Grid>
            </Grid>
        </div>
    );
}