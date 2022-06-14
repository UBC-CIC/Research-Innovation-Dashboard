import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import './Researcher_profile.css'
import Button from "@mui/material/Button";
import AREAS_OF_INTEREST from './areas_of_interest';
import PUBLICATIONS from './publications'
import INTELLECTUAL_PROPERTY from './Intellectual_Property_Activity';
import Researcher_Info from './Researcher_Info'
import Researcher_Highlights from './Research_highlights';
import Research_Profile_Navigation from './Researcher_profile_navigation'
import { useState, useEffect } from 'react';
import {useParams} from "react-router-dom";
import SMALLER_AREAS_OF_INTEREST from './smaller_areas_of_interest';
import Similar_Researchers from "./Similar_Researchers"
import CircularProgress from '@mui/material/CircularProgress';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import Amplify from '@aws-amplify/core'
import { Auth } from '@aws-amplify/auth'
import awsmobile from '../aws-exports'

import { API } from 'aws-amplify';
import {
    getPub,
    getResearcher,
    getResearcherFull,
    getResearcherPubsByCitations,
    getResearcherPubsByYear,
    getResearcherPubsByTitle,
    getNumberOfResearcherPubsLastFiveYears,
  } from '../graphql/queries';

Amplify.configure(awsmobile)
Auth.configure(awsmobile)

export default function Researcher_profile_overview() {
    const {scopusId} = useParams();

    const [first_name, set_first_name] = useState("");
    const [last_name, set_last_name] = useState("");
    const [preferred_name, set_preferred_name] = useState("");
    const [prime_department, set_prime_department] = useState("");
    const [prime_faculty, set_prime_faculty] = useState("");
    const [email, set_email] = useState("");
    const [phone_number, set_phone_number] = useState("");
    const [office, set_office] = useState("");
    const [num_publications, set_num_publications] = useState(0);
    const [num_citations, set_num_citations] = useState(0);
    const [h_index, set_h_index] = useState(0);
    const [funding, set_funding] = useState("");
    const [num_patents_filed, set_num_patents_filed] = useState(0);
    const [num_licensed_patents, set_num_licensed_patents] = useState(0);
    const [showOverview, setShowOverview] = useState(true);
    const [showAreasOfInterest, setShowAreasOfInterest] = useState(false);
    const [showPublications, setShowPublications] = useState(false);
    const [showSimilarResearchers, setShowSimilarResearchers] = useState(false);

    const [numberOfPublicationsToShow, setNumberOfPublicationsToShow] = useState(2);
    const [increasePublicationListBy, setincreasePublicationListBy] = useState(5);
    
    const [descendingPublicationListByCitation, setDescendingPublicationListByCitation] = useState([]);
    const [ascendingPublicationListByCitation, setAscendingPublicationListByCitation] = useState([]);

    const [descendingPublicationListByYear, setDescendingPublicationListByYear] = useState([]);
    const [ascendingPublicationListByYear, setAscendingPublicationListByYear] = useState([]);

    const [descendingPublicationListByTitle, setDescendingPublicationListByTitle] = useState([]);
    const [ascendingPublicationListByTitle, setAscendingPublicationListByTitle] = useState([]);
    
    const [numberOfPublications, setNumberOfPublications] = useState(0);

    const [sortedAreasOfInterest, setSortedAreasOfInterest] = useState([['']]);

    const [barGraphLastFiveYears, setBarGraphLastFiveYears] = useState(["0","0","0","0","0"]);
    const [publicationsPerYear, setPublicationsPerYear] = useState(["0","0","0","0","0"]);

    const [pageLoaded, setPageLoaded] = useState(false);

    const getAllPublications = async () => {
        const dataSortedByCitation = await API.graphql({
            query: getResearcherPubsByCitations,
            variables: {id: scopusId}, 
        });
        const dataSortedByYear = await API.graphql({
            query: getResearcherPubsByYear,
            variables: {id: scopusId}, 
        });
        const dataSortedByTitle = await API.graphql({
            query: getResearcherPubsByTitle,
            variables: {id: scopusId}, 
        });
        let publication_data_sorted_by_ciation = dataSortedByCitation.data.getResearcherPubsByCitations;
        let publication_data_sorted_by_year = dataSortedByYear.data.getResearcherPubsByYear;
        let publication_data_sorted_by_title = dataSortedByTitle.data.getResearcherPubsByTitle;
        let descendingPublicationsCitation = [];
        let ascendingPublicationsCitation = [];

        let descendingPublicationsYear = [];
        let ascendingPublicationsYear = [];

        let descendingPublicationsTitle = [];
        let ascendingPublicationsTitle = [];

        let areas_of_interest_hash_map = new Map();
    
        for(let i = 0; i<publication_data_sorted_by_ciation.length; i++){
            let authors = "";
            for(let j = 0; (j<publication_data_sorted_by_ciation[i].author_names.length && j<10); j++) {
                authors = authors+publication_data_sorted_by_ciation[i].author_names[j]+", ";
            }
            //Sorted By Citation Publication
            let publicationCitation = {
            Title: publication_data_sorted_by_ciation[i].title,
            Authors: authors,
            Citations: publication_data_sorted_by_ciation[i].cited_by,
            Year_Published: publication_data_sorted_by_ciation[i].year_published,
            Journal: publication_data_sorted_by_ciation[i].journal,
            Article_Link: 'Article_Link'}
            descendingPublicationsCitation.push(publicationCitation);
            ascendingPublicationsCitation.unshift(publicationCitation);

            //Sorted By Yaer Publication
            let publicationYear = {
            Title: publication_data_sorted_by_year[i].title,
            Authors: authors,
            Citations: publication_data_sorted_by_year[i].cited_by,
            Year_Published: publication_data_sorted_by_year[i].year_published,
            Journal: publication_data_sorted_by_year[i].journal,
            Article_Link: 'Article_Link'}
            descendingPublicationsYear.push(publicationYear);
            ascendingPublicationsYear.unshift(publicationYear);

            //Sorted By Title Publication
            let publicationTitle = {
            Title: publication_data_sorted_by_title[i].title,
            Authors: authors,
            Citations: publication_data_sorted_by_title[i].cited_by,
            Year_Published: publication_data_sorted_by_title[i].year_published,
            Journal: publication_data_sorted_by_title[i].journal,
            Article_Link: 'Article_Link'}
            descendingPublicationsTitle.push(publicationTitle);
            ascendingPublicationsTitle.unshift(publicationTitle);

            //areas of interest mapping
            for(var j = 0; j<publication_data_sorted_by_ciation[i].keywords.length; j++){
                if(areas_of_interest_hash_map.get(publication_data_sorted_by_ciation[i].keywords[j])){
                    areas_of_interest_hash_map.set(publication_data_sorted_by_ciation[i].keywords[j], areas_of_interest_hash_map.get(publication_data_sorted_by_ciation[i].keywords[j])+1);
                }
                else {
                    areas_of_interest_hash_map.set(publication_data_sorted_by_ciation[i].keywords[j], 1);
                }
            }
        }
        const sortedNumDesc = new Map([...areas_of_interest_hash_map].sort((a, b) => b[1] - a[1]));
        let sorted_areas_of_interest_array = [];
        let small_array = [];
        let i = 0;
        sortedNumDesc.forEach((value, key)=>{
            small_array.push(key);
            i++;
            if(i == 5){
                sorted_areas_of_interest_array.push(small_array);
                small_array = [];
                i = 0;
            }
        })
        if(i != 0){
            sorted_areas_of_interest_array.push(small_array);
        }

        setNumberOfPublications(descendingPublicationsCitation.length);
        
        setDescendingPublicationListByCitation(descendingPublicationsCitation);
        setAscendingPublicationListByCitation(ascendingPublicationsCitation);

        setDescendingPublicationListByYear(descendingPublicationsYear);
        setAscendingPublicationListByYear(ascendingPublicationsYear);

        setDescendingPublicationListByTitle(descendingPublicationsTitle);
        setAscendingPublicationListByTitle(ascendingPublicationsTitle);

        if(sorted_areas_of_interest_array.length != 0){
            setSortedAreasOfInterest(sorted_areas_of_interest_array);
        }
        setPageLoaded(true);
    }

    const getResearcherGeneralInformation = async () => {
        const researcher_data_response = await API.graphql({
            query: getResearcherFull,
            variables: {id: scopusId}, 
        });
        let researcher_data = researcher_data_response.data.getResearcherFull
        set_first_name(researcher_data.first_name);
        set_last_name(researcher_data.last_name);
        set_preferred_name(researcher_data.preferred_name)
        set_prime_department(researcher_data.prime_department)
        set_prime_faculty(researcher_data.prime_faculty)
        set_email(researcher_data.email)
        set_phone_number("")
        set_office("")
        set_num_publications(researcher_data.num_documents)
        set_num_citations(researcher_data.num_citations)
        set_h_index(researcher_data.h_index)
        set_funding("")
        set_num_patents_filed(researcher_data.num_patents_filed)
    }
    const getResearcherBarGraphData = async () => {
        const bar_graph_data_response = await API.graphql({
            query: getNumberOfResearcherPubsLastFiveYears,
            variables: {id: scopusId}, 
        });
        let bar_graph_data = bar_graph_data_response.data.getNumberOfResearcherPubsLastFiveYears;
        setBarGraphLastFiveYears(bar_graph_data.lastFiveYears);
        setPublicationsPerYear(bar_graph_data.publicationsPerYear);
    }

    useEffect(() => {
        getResearcherGeneralInformation().catch(()=>{console.log("ERROR")});
        getAllPublications().catch(()=>{console.log("ERROR")});
        getResearcherBarGraphData().catch(()=>{console.log("ERROR")});
    }, []);

    function showOverviewFunc(){
      setShowOverview(true);
      setShowAreasOfInterest(false);
      setShowPublications(false);
      setNumberOfPublicationsToShow(2);
      setincreasePublicationListBy(5);
      setShowSimilarResearchers(false);
    }

    function showAreasOfInterestFunc(){
      setShowOverview(false);
      setShowAreasOfInterest(true);
      setShowPublications(false);
      setNumberOfPublicationsToShow(2);
      setincreasePublicationListBy(5);
      setShowSimilarResearchers(false);
    }

    function showPublicationsFunc(){
      setShowOverview(false);
      setShowAreasOfInterest(false);
      setShowPublications(true);
      setShowSimilarResearchers(false);
    }

    function showSimilarResearchersFunc(){
        setShowOverview(false);
        setShowAreasOfInterest(false);
        setShowPublications(false);
        setShowSimilarResearchers(true);
        setNumberOfPublicationsToShow(2);
        setincreasePublicationListBy(5);
    }

    const ubcBlueColor = createTheme({
        palette: {
          primary: {
            main: '#002145'
          },
        },
      });

    return(
        <Box>
            {!pageLoaded && <Box
            sx={{flexGrow: 1}}
            display="flex"
            alignItems="center"
            justifyContent="center"
            height={"50vh"}
            maxHeight={"100%"}
            width={"95vw"}>
                    <ThemeProvider theme={ubcBlueColor}>
                        <CircularProgress size={60} /> 
                    </ThemeProvider>
            </Box>}
            {pageLoaded &&<Grid container>
                <Researcher_Info 
                researcher_information={{preferred_name, prime_department,
                prime_faculty,email, phone_number, office}} 
                />
                <Researcher_Highlights preferred_name={preferred_name} barGraphData={{barGraphLastFiveYears: barGraphLastFiveYears, publicationsPerYear: publicationsPerYear}}
                 researcher_information={{num_publications, h_index, funding}}/>
                <Research_Profile_Navigation researcher_information={{first_name, last_name}} onClickFunctions={{showOverviewFunc,showAreasOfInterestFunc,showPublicationsFunc}} />
                {showOverview && <Grid container>
                <Grid item xs={12}>
                    <Paper square={true} elevation={0} variant="outlined">
                        <AREAS_OF_INTEREST areasOfInterest={sortedAreasOfInterest} onClickFunctions={{showAreasOfInterestFunc, showSimilarResearchersFunc}} />
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    <Paper square={true} elevation={0} variant="outlined">
                        <PUBLICATIONS inPublicationPage={false} 
                        stateVariables={{numberOfPublicationsToShow,numberOfPublications, increasePublicationListBy,
                            descendingPublicationListByCitation, ascendingPublicationListByCitation,
                            descendingPublicationListByYear, ascendingPublicationListByYear,
                            descendingPublicationListByTitle, ascendingPublicationListByTitle}}
                        stateFunctions={{setNumberOfPublicationsToShow, setincreasePublicationListBy}}/>
                        <Box textAlign='center'>
                            <Button onClick={showPublicationsFunc} sx={{m: 1, border: "2px solid Black", color: "black", backgroundColor: 'white'}}>
                                View All Publications
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    <Paper square={true} elevation={0} variant="outlined">
                        <INTELLECTUAL_PROPERTY  researcher_information={{num_patents_filed, num_licensed_patents}}/>
                    </Paper>
                </Grid>
                </Grid>}
                {showAreasOfInterest && <SMALLER_AREAS_OF_INTEREST areasOfInterest={sortedAreasOfInterest} />}
                {showPublications && 
                <Grid item xs={12}>
                    <Paper square={true} elevation={0} variant="outlined">
                        <PUBLICATIONS inPublicationPage={true}
                        stateVariables={{numberOfPublicationsToShow,numberOfPublications, increasePublicationListBy,
                            descendingPublicationListByCitation, ascendingPublicationListByCitation,
                            descendingPublicationListByYear, ascendingPublicationListByYear,
                            descendingPublicationListByTitle, ascendingPublicationListByTitle}}
                        stateFunctions={{setNumberOfPublicationsToShow, setincreasePublicationListBy}}/>
                    </Paper>
                </Grid>}
                {showSimilarResearchers && <Similar_Researchers />}
            </Grid>}
        </Box>
    );
}