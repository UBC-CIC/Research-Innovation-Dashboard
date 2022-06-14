import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import './Researcher_profile.css'
import PUBLICATIONS from './publications'
import Researcher_Info from './Researcher_Info'
import Researcher_Highlights from './Research_highlights';
import Research_Profile_Navigation from './Researcher_profile_navigation' 
import Generic_Researcher_Info from './Generic_Researcher_Info'  
import { textAlign } from '@mui/system';

import professor_photo from './professor_photo.png';

import prof_photo_1 from './prof_photo_1.jpg'
import prof_photo_2 from './prof_photo_2.jpg'
import prof_photo_3 from './prof_photo_3.jpg'
import prof_photo_4 from './prof_photo_4.png'

import { useState, useEffect } from 'react';

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

let prof1 = {
first_name: "Sharon", // these will be imported
last_name:  "Couper", // these will be imported
professor_name:  "Sharon Couper",
department:  "Medical Genetics",
faculty:  "Medicine",
email:  "sharonC@gmail.com",
phone:  "604-777-3245",
office:  "MED 202",
professor_photo: prof_photo_1,
works_published_together: 170,
areas_of_interest_shared: 15,}

let prof2 = {
first_name: "John", // these will be imported
last_name:  "Doe", // these will be imported
professor_name:  "John Doe",
department:  "Biomedical Engineering",
faculty:  "Applied Science",
email:  "JD@gmail.com",
phone:  "604-420-5543",
office:  "CEME 2004",
professor_photo: prof_photo_2,
works_published_together: 48,
areas_of_interest_shared: 7,}

let prof3 = {
first_name: "Matthew", // these will be imported
last_name:  "Cooke", // these will be imported
professor_name:  "Matthew Cooke",
department:  "English",
faculty:  "Arts",
email:  "MatthewC@gmail.com",
phone:  "604-404-5352",
office:  "Buchanan 13",
professor_photo: prof_photo_3,
works_published_together: 34,
areas_of_interest_shared: 6,}

let prof4 = {
first_name: "Guy", // these will be imported
last_name:  "Lemieux", // these will be imported
professor_name:  "Guy Lemieux",
department:  "Electrical and Computer Engineering",
faculty:  "Applied Science",
email:  "guyL@gmail.com",
phone:  "604-432-4444",
office:  "ECE 2004",
professor_photo: prof_photo_4,
works_published_together: 9,
areas_of_interest_shared: 5,}

let similar_researchers_array = [prof1, prof2, prof3, prof4];



export default function Similar_Researchers(props){
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

    const TestPublication = async () => {
        const researcher_data_response = await API.graphql({
            query: getResearcherFull,
            variables: {id: "55765887300"}, 
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


    let similar_researchers = similar_researchers_array.map((prof_data)=>
        <Generic_Researcher_Info prof={prof_data} />
    );

    return(
        <Box>
            <Grid container>
                <Grid item xs={12}>
                    <Box xs={12} sx={{flexGrow: 1, textAlign: 'center'}}>
                        <div id='header_text'>Similar Researchers</div>
                    </Box>
                </Grid>
                    <Grid container>
                        {similar_researchers}
                    </Grid>
            </Grid>
        </Box>
    );
}