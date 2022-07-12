import * as React from "react";
import SearchIcon from '@mui/icons-material/Search';
import InputBase from '@mui/material/InputBase';
import './stylesheet.css'
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import {useParams} from "react-router-dom";

import { API } from 'aws-amplify';

import {
  searchResearcher,
  searchPublications,
} from './graphql/queries';


export default function Search_Bar(props){
  let {searchValue} = useParams();
  if(!searchValue) {
    searchValue = "";
  }
  const [searchBarValue, setSearchBarValue] = useState(searchValue); 

  function search() {
    if(props.whatToSearch === "Everything") {
      searchResearchersQuery();
      searchPublicationsQuery();
    }
    else if(props.whatToSearch === "Researchers") {
      searchResearchersQuery();
      props.setPublicationSearchResults([]);
    }
    else if(props.whatToSearch === "Publications") {
      props.setResearcherSearchResults([]);
      searchPublicationsQuery();
    }
  }

  const searchResearchersQuery = async () => {
      const researcherSearchResult = await API.graphql({
        query: searchResearcher,
        variables: {search_value: searchValue}, 
      });
      props.setResearcherSearchResults(researcherSearchResult.data.searchResearcher);
  }

  const searchPublicationsQuery = async () => {
      console.log(searchValue);
      const searchPublicationsResult = await API.graphql({
        query: searchPublications,
        variables: {search_value: searchValue}, 
      });

      props.setPublicationSearchResults(searchPublicationsResult.data.searchPublications);
  }

  let navigate = useNavigate(); 
  const routeChange = () =>{ 
    navigate(props.path+searchBarValue);
  }

  useEffect(() => {
    console.log("Use Effect Called");
    search();
  }, [searchValue]);


  return(
    <Paper elevation={0} sx={{border: 1, width: "60%", marginTop: "8px", marginBottom: "8px"}} component={Stack} direction="row">
        <InputBase value={searchBarValue} onChange={(e) => {setSearchBarValue(e.target.value)}} 
        fullWidth={true} inputProps={{style: {padding: 0}}} 
        sx={{padding: "8px", fontSize: "1.0rem"}}
        onKeyDown={(e) => {
          if(e.key === 'Enter'){
            routeChange();
          }
          }}></InputBase>
        <IconButton onClick={() => {routeChange()}}>
          <SearchIcon sx={{padding: "8px"}} /> 
        </IconButton>
    </Paper>
  );
}