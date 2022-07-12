import * as React from 'react';
import { useState} from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Grid from '@mui/material/Grid';
import PUBLICATION from './publication'
import Amplify from '@aws-amplify/core'
import TableSortLabel from '@mui/material/TableSortLabel';

import { Auth } from '@aws-amplify/auth'
import awsmobile from '../aws-exports'

Amplify.configure(awsmobile)
Auth.configure(awsmobile)

export default function PUBLICATIONS(props){
    const [sortByTitle, setSortByTitle] = useState(false);
    const [sortByTitleDirection, setSortByTitleDirection] = useState('desc');

    const [sortByNumberCitations, setSortyByNumberCitations] = useState(true);
    const [sortByNumberCitationsDirection, setSortyByNumberCitationsDirection] = useState('desc');

    const [sortByYear, setSortByYear] = useState(false);
    const [sortByYearDirection, setSortByYearDirection] = useState('desc');

    const DescendingSortByCitationsPublications = props.stateVariables.descendingPublicationListByCitation.filter((data,index) => index < props.stateVariables.numberOfPublicationsToShow)
    .map((filteredData) => <PUBLICATION key={filteredData.id} publication_data = {filteredData}/>);

    const AscendingSortByCitationsPublications = props.stateVariables.ascendingPublicationListByCitation.filter((data,index) => index < props.stateVariables.numberOfPublicationsToShow)
    .map((filteredData) => <PUBLICATION key={filteredData.id} publication_data = {filteredData}/>);

    const DescendingSortByTitlePublications = props.stateVariables.descendingPublicationListByTitle.filter((data,index) => index < props.stateVariables.numberOfPublicationsToShow)
    .map((filteredData) => <PUBLICATION key={filteredData.id} publication_data = {filteredData}/>);
    
    const AscendingsSortByTitlePublications = props.stateVariables.ascendingPublicationListByTitle.filter((data,index) => index < props.stateVariables.numberOfPublicationsToShow)
    .map((filteredData) => <PUBLICATION key={filteredData.id} publication_data = {filteredData}/>);

    const DescendingSortByYearPublications = props.stateVariables.descendingPublicationListByYear.filter((data,index) => index < props.stateVariables.numberOfPublicationsToShow)
    .map((filteredData) => <PUBLICATION key={filteredData.id} publication_data = {filteredData}/>);
    
    const AscendingsSortByYearPublications = props.stateVariables.ascendingPublicationListByYear.filter((data,index) => index < props.stateVariables.numberOfPublicationsToShow)
    .map((filteredData) => <PUBLICATION key={filteredData.id} publication_data = {filteredData}/>);

    function showMorePublications() {
        props.stateFunctions.setNumberOfPublicationsToShow(props.stateVariables.numberOfPublicationsToShow+props.stateVariables.increasePublicationListBy);
    }

    function ShowMorePublicationsButton() {
        if(props.stateVariables.numberOfPublicationsToShow<props.stateVariables.numberOfPublications && props.inPublicationPage){
            return(<Button onClick={showMorePublications}
                sx={{m: 1, border: "2px solid Black", color: "black", backgroundColor: 'white'}}>
                    Show More Publications
                </Button>);
        }
        return;
    }

    const sortHandler = header_name => () => 
    { 
        if(header_name  === 'title'){
            if(sortByTitle){setSortByTitleDirection((sortByTitleDirection === 'desc') ? 'asc': 'desc');}
            setSortByTitle(true);
            setSortyByNumberCitations(false);
            setSortByYear(false);
        }
        else if(header_name === 'citations'){
            if(sortByNumberCitations){
                setSortyByNumberCitationsDirection((sortByNumberCitationsDirection === 'desc') ? 'asc': 'desc');
            }
            setSortByTitle(false); 
            setSortyByNumberCitations(true);
            setSortByYear(false);
        }
        else if(header_name === 'year'){
            if(sortByYear){setSortByYearDirection((sortByYearDirection === 'desc') ? 'asc': 'desc');}
            setSortByTitle(false);
            setSortyByNumberCitations(false);
            setSortByYear(true);
        }
    }

    return(    
        <Box>
            <Box sx={{ml: "2%", mr: "2%"}} id='header_text'>Publications</Box>
            <Box  sx={{ml: "2%", mr: "2%"}}>
            <Grid container >
                    <Grid item xs={8}>
                        <Paper square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}}>
                            <TableSortLabel onClick={sortHandler('title')} active={sortByTitle} direction={sortByTitleDirection} >
                                <Typography align='center' variant='h6'>
                                    Title
                                </Typography>
                            </TableSortLabel>
                        </Paper>
                    </Grid>
                    <Grid item xs={2}>
                        <Paper square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}}>
                        <TableSortLabel onClick={sortHandler('citations')} active={sortByNumberCitations} direction={sortByNumberCitationsDirection} >
                            <Typography align='center' variant='h6'>
                                Cited By
                            </Typography>
                        </TableSortLabel>
                        </Paper>
                    </Grid>
                    <Grid item xs={2}>
                        <Paper square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}}>
                            <TableSortLabel onClick={sortHandler('year')} active={sortByYear} direction={sortByYearDirection} >
                                <Typography align='center' variant='h6'>
                                    Year Published
                                </Typography>
                            </TableSortLabel>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
            <Box sx={{m: "0%"}}> 
                <Grid container>
                    {(sortByNumberCitations && sortByNumberCitationsDirection === 'desc') && DescendingSortByCitationsPublications}
                    {(sortByNumberCitations && sortByNumberCitationsDirection === 'asc') && AscendingSortByCitationsPublications}
                    {(sortByTitle &&  sortByTitleDirection === 'desc') && DescendingSortByTitlePublications}
                    {(sortByTitle &&  sortByTitleDirection === 'asc') && AscendingsSortByTitlePublications}
                    {(sortByYear &&  sortByYearDirection === 'desc') && DescendingSortByYearPublications}
                    {(sortByYear &&  sortByYearDirection === 'asc') && AscendingsSortByYearPublications}
                </Grid>
                <Box textAlign='center'>
                    <ShowMorePublicationsButton/>
                </Box>
            </Box>
        </Box> 
    );
}