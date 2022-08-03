import * as React from "react";
import SearchIcon from "@mui/icons-material/Search";
import InputBase from "@mui/material/InputBase";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";

import { API } from "aws-amplify";

import { searchResearcher, searchPublications } from "../graphql/queries";

export default function Search_Bar(props) {
  const {
    whatToSearch,
    selectedDepartments,
    selectedFaculties,
    selectedJournals,
    setPublicationSearchResults,
    setResearcherSearchResults,
    departmentPath,
    facultyPath,
    journalPath,
  } = props;

  let { searchValue } = useParams();
  if (!searchValue || searchValue === " ") {
    searchValue = ""; // space
  }
  const [searchBarValue, setSearchBarValue] = useState(searchValue);
  let navigate = useNavigate();

  useEffect(() => {
    search();
  }, []);

  useEffect(() => {
    console.log("here");
    routeChange();
  }, [departmentPath, facultyPath, journalPath]);
  

  function search() {
    if (whatToSearch === "Everything") {
      searchResearchersQuery();
      searchPublicationsQuery();
    } else if (whatToSearch === "Researchers") {
      searchResearchersQuery();
      setPublicationSearchResults([]);
    } else if (whatToSearch === "Publications") {
      setResearcherSearchResults([]);
      searchPublicationsQuery();
    }
  }

  const searchResearchersQuery = async () => {
    const researcherSearchResult = await API.graphql({
      query: searchResearcher,
      variables: {
        search_value: searchBarValue,
        departmentsToFilterBy: selectedDepartments,
        facultiesToFilterBy: selectedFaculties,
      },
    });
    props.setResearcherSearchResults(
      researcherSearchResult.data.searchResearcher
    );
  };

  const searchPublicationsQuery = async () => {
    console.log(searchValue);
    console.log(selectedJournals);
    const searchPublicationsResult = await API.graphql({
      query: searchPublications,
      variables: { search_value: searchValue, journalsToFilterBy: selectedJournals },
    });

    props.setPublicationSearchResults(
      searchPublicationsResult.data.searchPublications
    );
  };

  const routeChange = () => {
    let path = "";
    let searchPath = " ";
    if(searchBarValue !== ""){
      searchPath = searchBarValue;
    }

    console.log("What TO Search: "+whatToSearch);
    if (whatToSearch === "Researchers") {
      path = "/Search/Researchers/" + departmentPath + "/" + facultyPath + "/" + searchPath + "/";
    }
    else if(whatToSearch === "Publications"){
      path = "/Search/Publications/".concat(journalPath, "/", searchPath, "/");
    }
    else {
      path = "/" + departmentPath + "/" + facultyPath + "/" + journalPath + "/" + searchPath + "/";
    }

    navigate(path);
    props.setResearcherSearchResultPage(1);
    props.setPublicationsSearchResultPage(1);
    search();
  };

  return (
    <Paper
      elevation={0}
      sx={{ border: 1, width: "60%", marginTop: "8px", marginBottom: "8px" }}
      component={Stack}
      direction="row"
    >
      <InputBase
        value={searchBarValue}
        onChange={(e) => {
          setSearchBarValue(e.target.value);
        }}
        fullWidth={true}
        inputProps={{ style: { padding: 0 } }}
        sx={{ padding: "8px", fontSize: "1.0rem" }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            routeChange();
          }
        }}
      ></InputBase>
      <IconButton
        onClick={() => {
          routeChange();
        }}
      >
        <SearchIcon sx={{ padding: "8px" }} />
      </IconButton>
    </Paper>
  );
}
