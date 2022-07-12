import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from "@mui/material/Typography";
import Stack from '@mui/material/Stack';
import React  from 'react';
import SearchBar from '../search_bar'
import { useState,} from 'react';
import ResearcherSearchResultsComponent from './ResearcherSearchResultsComponent'
import PublicationSearchResultsComponent from './PublicationSearchResultsComponent'



export default function SearchComponent(props){
    const [researchSearchResults, setResearcherSearchResults] = useState([]);
    const [publicationSearchResults, setPublicationSearchResults] = useState([]);

    let path = '/';

    if(props.whatToSearch === "Publications"){
        path='/Search/Publications/';
    }
    else if(props.whatToSearch === "Researchers"){
        path='/Search/Researchers/';
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
                                    <a href='/AdvancedSearch/Everything/'>Advanced Search</a>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
        </Grid>
        {(props.whatToSearch === "Everything" || props.whatToSearch === "Researchers") && <ResearcherSearchResultsComponent researchSearchResults={researchSearchResults}/>}
        {(props.whatToSearch === "Everything" || props.whatToSearch === "Publications") && <PublicationSearchResultsComponent publicationSearchResults={publicationSearchResults}/>}
        </div>
    );
}