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
    setPublicationSearchResults,
    setResearcherSearchResults,
    departmentPath,
    facultyPath,
  } = props;

  let { searchValue } = useParams();
  if (!searchValue) {
    searchValue = "";
  }
  const [path, setPath] = useState("/");
  const [searchBarValue, setSearchBarValue] = useState(searchValue);
  let navigate = useNavigate();

  useEffect(() => {
    if (whatToSearch === "Publications") {
      setPath("/Search/Publications/");
    } else if (whatToSearch === "Researchers") {
      setPath("/Search/Researchers/");
    }
  }, [whatToSearch]);

  //if on the Researchers or Publications tab, update path to the end of /Search/Researchers or /Search/Publications
  useEffect(() => {
    let newPath;
    if (whatToSearch === "Researchers") {
      newPath = "/Search/Researchers/".concat(departmentPath, "/", facultyPath);
    } else {
      newPath = "/".concat(departmentPath, "/", facultyPath);
    }
    //add in conditional for if whatToSearch === Publications
    setPath(newPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentPath, facultyPath]);

  useEffect(() => {
    search();
    if (path && path !== "/") {
      navigate(path);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

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
    const searchPublicationsResult = await API.graphql({
      query: searchPublications,
      variables: { search_value: searchValue, journalsToFilterBy: [] },
    });

    props.setPublicationSearchResults(
      searchPublicationsResult.data.searchPublications
    );
  };

  const routeChange = () => {
    if (path && path !== "/") {
      navigate(path.concat("/", searchBarValue));
    } else {
      navigate(path + searchBarValue);
    }
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
