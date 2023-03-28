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

import { searchResearcher, searchPublications, searchGrants, searchPatents, getResearcherFull } from "../../../graphql/queries";

export default function Search_Bar(props) {
  const {
    whatToSearch,
    selectedDepartments,
    selectedFaculties,
    selectedJournals,
    selectedGrants,
    setPublicationSearchResults,
    setResearcherSearchResults,
    departmentPath,
    facultyPath,
    journalPath,
    grantPath,
    patentClassificationPath,
    selectedPatentClassification,
    searchYet,
    setSearchYet
  } = props;

  let { searchValue } = useParams();
  if (!searchValue || searchValue === " ") {
    searchValue = "";
  }
  const [searchBarValue, setSearchBarValue] = useState(searchValue);
  let navigate = useNavigate();

  useEffect(() => {
    search();
  }, []);

  function search() {
    if (searchBarValue !== "") {
      setSearchYet(true)
    }
    if (whatToSearch === "Everything") {
      searchResearchersQuery();
      searchPublicationsQuery();
      searchGrantsQuery();
      searchPatentsQuery();
    } else if (whatToSearch === "Researchers") {
      searchResearchersQuery();
      setPublicationSearchResults([]);
    } else if (whatToSearch === "Publications") {
      setResearcherSearchResults([]);
      searchPublicationsQuery();
    } else if (whatToSearch === "Grants") {
      searchGrantsQuery();
    } else if (whatToSearch === "Patents") {
      searchPatentsQuery();
    }
  }

  const searchResearchersQuery = async () => {
    // this query is from ResearcherOpenSearch
    let researcherSearchResult = await API.graphql({
      query: searchResearcher,
      variables: {
        search_value: searchBarValue,
        departmentsToFilterBy: selectedDepartments,
        facultiesToFilterBy: selectedFaculties,
      },
    });
    
    // await Promise.all(researcherSearchResult.data.searchResearcher.map(async (researcher) => {
    //   let h_index = await API.graphql({
    //     query: getResearcherFull,
    //     variables: { id: researcher.researcher_id },
    //   })
    //   researcher.h_index = h_index.data.getResearcherFull.h_index
    // }));

    props.setResearcherSearchResults(
      //researcherSearchResult.data.searchResearcher
      researcherSearchResult.data.searchResearcher
    );
    console.log(researcherSearchResult.data.searchResearcher.length)
    console.log(researcherSearchResult.data.searchResearcher)
  };

  const searchPublicationsQuery = async () => {
    const searchPublicationsResult = await API.graphql({
      query: searchPublications,
      variables: {
        search_value: searchValue,
        journalsToFilterBy: selectedJournals,
      },
    });

    props.setPublicationSearchResults(
      searchPublicationsResult.data.searchPublications
    );
  };

  const searchGrantsQuery = async () => {
    const searchGrantsResults = await API.graphql({
      query: searchGrants,
      variables: {
        search_value: searchValue,
        grantAgenciesToFilterBy: selectedGrants,
      },
    });
    
    props.setGrantsSearchResults(searchGrantsResults.data.searchGrants)
  }

  const searchPatentsQuery = async () => {
    const searchPatentsResult = await API.graphql({
      query: searchPatents,
      variables: {
        search_value: searchValue,
        patentClassificationFilter: selectedPatentClassification,
      },
    });
    
    props.setPatentSearchResults(searchPatentsResult.data.searchPatents)
  }



  const routeChange = () => {
    console.log("Triggered!")
    let path = "";
    let searchPath = " ";
    if (searchBarValue !== "") {
      searchPath = searchBarValue;
    }

    if (whatToSearch === "Researchers") {
      path =
        "/Search/Researchers/" +
        departmentPath +
        "/" +
        facultyPath +
        "/" +
        searchPath +
        "/";
    } else if (whatToSearch === "Publications") {
      path = "/Search/Publications/".concat(journalPath, "/", searchPath, "/");
    } 
    else if (whatToSearch === "Grants") {
      path = "/Search/Grants/"+grantPath +"/"+searchPath+"/";
    }
    else if (whatToSearch === "Patents"){
      path = "/Search/Patents/"+patentClassificationPath+"/"+searchPath+"/";
    }
    else {
      path =
        "/" +
        departmentPath +
        "/" +
        facultyPath +
        "/" +
        journalPath +
        "/" +
        grantPath +
        "/" +
        patentClassificationPath +
        "/" +
        searchPath +
        "/";
    }

    navigate(path);
    window.location.reload();
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
