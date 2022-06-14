import * as React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import './Researcher_profile.css'
import SMALLER_AREAS_OF_INTEREST from './smaller_areas_of_interest';
import Researcher_Info from './Researcher_Info'
import Researcher_Highlights from './Research_highlights';
import Research_Profile_Navigation from './Researcher_profile_navigation'
import { useState, useEffect } from 'react';
import {useParams} from "react-router-dom";

import Amplify from '@aws-amplify/core'
import { Auth } from '@aws-amplify/auth'
import awsmobile from '../aws-exports'

import { API } from 'aws-amplify';
import {
    getPub,
    getResearcher,
    getResearcherFull
  } from '../graphql/queries';

Amplify.configure(awsmobile)
Auth.configure(awsmobile)



export default function Researcher_profile_areas_of_interest() {
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

    const TestPublication = async () => {
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

    useEffect(() => {
        TestPublication();
      }, []);

    return(
        <Box>
            <Grid container>
                <Researcher_Info 
                researcher_information={{preferred_name, prime_department,
                prime_faculty,email, phone_number, office}} 
                />
                <Researcher_Highlights researcher_information={{num_publications, h_index, funding}}/>
                <Research_Profile_Navigation researcher_information={{first_name, last_name}} />
                <SMALLER_AREAS_OF_INTEREST />
            </Grid>
        </Box>
    );
}