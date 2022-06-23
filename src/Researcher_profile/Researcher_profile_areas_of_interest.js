import * as React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import './Researcher_profile.css'
import SmallerAreasOfInterest from './smaller_areas_of_interest';
import ResearcherInfo from './Researcher_Info'
import ResearcherHighlights from './Research_highlights';
import ResearchProfileNavigation from './Researcher_profile_navigation'
import { useState, useEffect } from 'react';
import {useParams} from "react-router-dom";

import Amplify from '@aws-amplify/core'
import { Auth } from '@aws-amplify/auth'
import awsmobile from '../aws-exports'

import { API } from 'aws-amplify';
import {
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
    const [h_index, set_h_index] = useState(0);
    const [funding, set_funding] = useState("");

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
        set_h_index(researcher_data.h_index)
        set_funding("")
    }

    useEffect(() => {
        TestPublication();
      }, []);

    return(
        <Box>
            <Grid container>
                <ResearcherInfo 
                researcher_information={{preferred_name, prime_department,
                prime_faculty,email, phone_number, office}} 
                />
                <ResearcherHighlights researcher_information={{num_publications, h_index, funding}}/>
                <ResearchProfileNavigation researcher_information={{first_name, last_name}} />
                <SmallerAreasOfInterest />
            </Grid>
        </Box>
    );
}