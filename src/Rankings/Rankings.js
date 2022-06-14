import * as React from 'react';
import Rankings_Navigation from "./Rankings_Navigation"
import './Rankings.css'
import { useState, useEffect } from 'react';
import InputBase from '@mui/material/InputBase';
import { styled } from '@mui/material/styles';

import Amplify from '@aws-amplify/core'
import { Auth } from '@aws-amplify/auth'
import awsmobile from '../aws-exports'

import { API } from 'aws-amplify';
import {
    getResearcherRankingsByDepartment,
    getAllDepartments,
    getAllResearchersRankings,
    getAllFaculty,
    getResearcherRankingsByFaculty,
} from '../graphql/queries';

import RankingsByDepartment from './RankResearcherByDepartment'
import AllResearcherRankings from './allResearcherRankings'
import RankByFaculty from './RankByFaculty'
import useMediaQuery from '@mui/material/useMediaQuery';

Amplify.configure(awsmobile)
Auth.configure(awsmobile)

const BootstrapInput = styled(InputBase)(({ theme }) => ({
    'label + &': {
      marginTop: theme.spacing(3),
    },
    '& .MuiInputBase-input': {
      borderRadius: 4,
      position: 'relative',
      backgroundColor: theme.palette.background.paper,
      border: '1px solid #ced4da',
      fontSize: 16,
      padding: '10px 26px 10px 12px',
      transition: theme.transitions.create(['border-color', 'box-shadow']),
      // Use the system font instead of the default Roboto font.
      '&:focus': {
        borderRadius: 4,
        borderColor: '#80bdff',
        boxShadow: '0 0 0 0.2rem rgba(0,123,255,.25)',
      },
    },
  }));

export default function Rankings(props) {
    const [researcherRankingsByDepartment, setResearcherRankingsByDepartment] = useState([]);
    const [departmentToRank, setDepartmentToRank] = useState("");
    const [allDepartments, setAllDepartments] = useState([]);
    const [allResearcherRankings, setAllResearcherRankings] = useState([]);

    const [researcherRankingsByFaculty, setResearcherRankingsByFaculty] = useState([]);
    const [facultyToRank, setFacultyToRank] = useState("");
    const [allFaculty, setAllFaculty] = useState([]);

    const [showByDepartment, setShowByDepartment] = useState(true);
    const [showByFaculty, setShowByFaculty] = useState(false);
    const [showOverallRankings, setShowOverallRankings] = useState(false);

    const getDeparmentArray = async () => {
        const department = await API.graphql({
            query: getAllDepartments
        });
        let allDepartmentsArray = department.data.getAllDepartments;
        setAllDepartments(allDepartmentsArray);
        setDepartmentToRank(allDepartmentsArray[0].prime_department)
    }

    const getResearcherRankingByDepartment = async () => {
        const rankings = await API.graphql({
            query: getResearcherRankingsByDepartment,
            variables: {prime_department: departmentToRank}, 
        });
        let researcher_rankings_by_department = rankings.data.getResearcherRankingsByDepartment;
        setResearcherRankingsByDepartment(researcher_rankings_by_department);
    }

    const getFacultyArray = async () => {
        const department = await API.graphql({
            query: getAllFaculty
        });
        let allFacultyArray = department.data.getAllFaculty;
        setAllFaculty(allFacultyArray);
        setFacultyToRank(allFacultyArray[0].prime_faculty)
    }

    const getResearcherRankingByFaculty = async () => {
        const rankings = await API.graphql({
            query: getResearcherRankingsByFaculty,
            variables: {prime_faculty: facultyToRank}, 
        });
        let researcher_rankings_by_Faculty = rankings.data.getResearcherRankingsByFaculty;
        setResearcherRankingsByFaculty(researcher_rankings_by_Faculty);
    }

    const getOverallResearcherRankings = async () => {
        const rankings = await API.graphql({
            query: getAllResearchersRankings
        });

        let allResearchRankingArray = rankings.data.getAllResearchersRankings;
        setAllResearcherRankings(allResearchRankingArray);
    }

    function changeDepartmentToRank(event) {
        setDepartmentToRank(event.target.value);
    }

    function changeFacultyToRank(event) {
        setFacultyToRank(event.target.value);
    }

    useEffect(() => {
        getDeparmentArray();
        getFacultyArray();
        getOverallResearcherRankings();
    }, []);

    useEffect(() => {
        getResearcherRankingByDepartment();
    }, [departmentToRank]);

    useEffect(() => {
        getResearcherRankingByFaculty();
    }, [facultyToRank]);

    function byDepartmentButton(){
        setShowByDepartment(true);
        setShowByFaculty(false);
        setShowOverallRankings(false);
    }
    function byFacultyButton(){
        setShowByDepartment(false);
        setShowByFaculty(true);
        setShowOverallRankings(false);
    }
    function overallRankingsButton(){
        setShowByDepartment(false);
        setShowByFaculty(false);
        setShowOverallRankings(true);
    }


    return(
        <div>
            <Rankings_Navigation onClickFunctions={{byDepartmentButton, byFacultyButton, overallRankingsButton}} />
            {showByDepartment && <RankingsByDepartment allDepartments={allDepartments} 
            researcherRankingsByDepartment={researcherRankingsByDepartment}
            changeDepartmentToRank={changeDepartmentToRank}
            departmentToRank={departmentToRank} />}
            {showByFaculty && <RankByFaculty allFaculty={allFaculty}
            researcherRankingsByFaculty={researcherRankingsByFaculty}
            changeFacultyToRank={changeFacultyToRank}/>}
            {showOverallRankings && <AllResearcherRankings allResearcherRankings={allResearcherRankings} />}
        </div>
    )
}