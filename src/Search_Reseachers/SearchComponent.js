import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import React from "react";
import SearchBar from "../components/SearchBar";
import { useState, useEffect } from "react";
import ResearcherSearchResultsComponent from "./ResearcherSearchResultsComponent";
import PublicationSearchResultsComponent from "./PublicationSearchResultsComponent";
import ResearcherFilters from "./ResearcherFilters";
import PublicationFilters from "./PublicationFilters";

export default function SearchComponent(props) {
  const [researchSearchResults, setResearcherSearchResults] = useState([]);
  const [publicationSearchResults, setPublicationSearchResults] = useState([]);

  //for researcher filters
  const [selectedDepartments, setSelectedDeparments] = useState([]);
  const [selectedFaculties, setSelectedFaculties] = useState([]);
  const [departmentPath, setDepartmentPath] = useState("%20");
  const [facultyPath, setFacultyPath] = useState("%20");
  //for publication filters
  const [selectedJournals, setSelectedJournals] = useState([]);

  useEffect(() => {
    //if there are selected departments, join items in array to create 1 string (different departments separated by &&), replace all spaces with %20
    if (selectedDepartments.length > 0) {
      const selectedDepartmentString = selectedDepartments.join("&&");
      const selectedDepartmentStringNoSpaces =
        selectedDepartmentString.replaceAll(" ", "%20");
      setDepartmentPath(selectedDepartmentStringNoSpaces);
    } else {
      setDepartmentPath("%20");
    }
  }, [selectedDepartments]);

  useEffect(() => {
    //if there are selected faculties, join items in array to create 1 string (different faculties separated by &&), replace all spaces with %20
    if (selectedFaculties.length > 0) {
      const selectedFacultyString = selectedFaculties.join("&&");
      const selectedFacultyStringNoSpaces = selectedFacultyString.replaceAll(
        " ",
        "%20"
      );
      setFacultyPath(selectedFacultyStringNoSpaces);
    } else {
      setFacultyPath("%20");
    }
  }, [selectedFaculties]);

  return (
    <div>
      <Grid container>
        <Grid item xs={12}>
          <Paper square={true} variant="outlined" elevation={0}>
            <Grid container>
              <Grid item xs={12}>
                <Typography align="center" variant="h5" sx={{ margin: "8px" }}>
                  {"Search " + props.whatToSearch}
                </Typography>
              </Grid>
              <Grid item xs={12} align="center">
                <SearchBar
                  setResearcherSearchResults={setResearcherSearchResults}
                  setPublicationSearchResults={setPublicationSearchResults}
                  whatToSearch={props.whatToSearch}
                  selectedDepartments={selectedDepartments}
                  selectedFaculties={selectedFaculties}
                  departmentPath={departmentPath}
                  facultyPath={facultyPath}
                />
                <Paper
                  square={true}
                  elevation={0}
                  sx={{
                    width: "60%",
                    marginTop: "8px",
                    marginBottom: "8px",
                    flexDirection: "row-reverse",
                  }}
                  component={Stack}
                  direction="row"
                >
                  <a
                    href={
                      "/AdvancedSearch/" +
                      props.whatToSearch +
                      "/ / / / /All Departments/All Faculties/2017-07/2022-07/All Journals/"
                    }
                  >
                    Advanced Search
                  </a>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
      <Grid container>
        {(props.whatToSearch === "Everything" ||
          props.whatToSearch === "Researchers") && (
          <Grid container item xs={12} sx={{ p: "1.5em" }}>
            <Grid item xs={3}>
              <ResearcherFilters
                selectedDepartments={selectedDepartments}
                setSelectedDeparments={setSelectedDeparments}
                selectedFaculties={selectedFaculties}
                setSelectedFaculties={setSelectedFaculties}
              />
            </Grid>
            <Grid item xs={9}>
              <ResearcherSearchResultsComponent
                researchSearchResults={researchSearchResults}
              />
            </Grid>
          </Grid>
        )}
        {(props.whatToSearch === "Everything" ||
          props.whatToSearch === "Publications") && (
          <Grid container item xs={12} sx={{ p: "1.5em" }}>
            <Grid item xs={3}>
              <PublicationFilters
                selectedJournals={selectedJournals}
                setSelectedJournals={setSelectedJournals}
              />
            </Grid>
            <Grid item xs={9}>
              <PublicationSearchResultsComponent
                publicationSearchResults={publicationSearchResults}
              />
            </Grid>
          </Grid>
          // <Grid
          //   container
          //   item
          //   xs={12}
          //   sx={{ p: "1.5em", borderTop: "#D3D3D3 1px solid" }}
          // >
          //   <Grid item xs={12}>
          //     <PublicationFilters
          //       selectedJournals={selectedJournals}
          //       setSelectedJournals={setSelectedJournals}
          //     />
          //   </Grid>
          //   <Grid item xs={12} sx={{ mt: "3em" }}>
          //     <PublicationSearchResultsComponent
          //       publicationSearchResults={publicationSearchResults}
          //     />
          //   </Grid>
          // </Grid>
        )}
      </Grid>
    </div>
  );
}
