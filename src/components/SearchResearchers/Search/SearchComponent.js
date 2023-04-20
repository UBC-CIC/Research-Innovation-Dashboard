import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import React from "react";
import SearchBar from "./SearchBar";
import { useState, useEffect, useRef } from "react";
import ResearcherSearchResultsComponent from "../ResearcherSearchResultsComponent";
import PublicationSearchResultsComponent from "../PublicationSearchResultsComponent";
import ResearcherFilters from "./ResearcherFilters";
import PublicationFilters from "./PublicationFilters";
import { useNavigate, useParams } from "react-router-dom";
import GrantInformation from "../../ResearcherProfile/GrantInformation"
import GrantFilters from "../Search/GrantsFilters"
import PatentInformation from "../../ResearcherProfile/PatentInformation"
import PatentFilters from "../Search/PatentFilters"
import Link from '@mui/material/Link';
import { getAllDepartments, getAllFaculty, getCatagoriesCount } from "../../../graphql/queries";
import { API } from "aws-amplify";
import HomePageBar from "../../HomePage/HomePageBar";

export default function SearchComponent(props) {
  const [researchSearchResults, setResearcherSearchResults] = useState([]);
  const [publicationSearchResults, setPublicationSearchResults] = useState([]);
  const [grantsSearchResults, setGrantsSearchResults] = useState([]);
  const [patentsSearchResults, setPatentSearchResults] = useState([]);
  const [researcherSearchResultPage, setResearcherSearchResultPage] =
    useState(1);
  const [publicationsSearchResultPage, setPublicationsSearchResultPage] =
    useState(1);
  const [searchYet, setSearchYet] = useState(false) //indicate whether the user entered a search string and search
  const [openFacultyFiltersDialog, setOpenFacultyFiltersDialog] = useState(false)
  const [openDepartmentFiltersDialog, setOpenDepartmentFiltersDialog] = useState(false);
  const [catagoiresCount, setCatagoriesCount] = useState({researcherCount: 0, publicationCount: 0, grantCount: 0, patentCount: 0})

  let { anyDepartmentFilter, anyFacultyFilter, journalFilter, grantFilter, patentClassifications } = useParams();

  let selectedDepartmentsArray = [];
  let selectedFacultyArray = [];
  let selectedJournalFilter = [];
  let selectGrantingAgency = [];
  let selectedClassification = []

  if (!anyDepartmentFilter || anyDepartmentFilter === " ") {
    selectedDepartmentsArray = [];
    anyDepartmentFilter = " ";
  } else {
    selectedDepartmentsArray = anyDepartmentFilter.split("&&");
  }
  if (!anyFacultyFilter || anyFacultyFilter === " ") {
    selectedFacultyArray = [];
    anyFacultyFilter = " ";
  } else {
    selectedFacultyArray = anyFacultyFilter.split("&&");
  }
  if (!journalFilter || journalFilter === " ") {
    selectedJournalFilter = [];
    journalFilter = " ";
  } else {
    selectedJournalFilter = journalFilter.split("&&");
  }
  if (!grantFilter || grantFilter === " ") {
    selectGrantingAgency = [];
    grantFilter = " ";
  } else {
    selectGrantingAgency = grantFilter.split("&&");
  }
  if (!patentClassifications || patentClassifications === " ") {
    selectedClassification = [];
    patentClassifications = " ";
  } else {
    selectedClassification = patentClassifications.split("&&");
  }
  
  // console.log(props.whatToSearch)

  //for researcher filters
  const [selectedDepartments, setSelectedDeparments] = useState(
    selectedDepartmentsArray
  );
  const [selectedFaculties, setSelectedFaculties] =
    useState(selectedFacultyArray);
  const [departmentPath, setDepartmentPath] = useState(anyDepartmentFilter);
  const [facultyPath, setFacultyPath] = useState(anyFacultyFilter);
  //for publication filters
  const [selectedJournals, setSelectedJournals] = useState(
    selectedJournalFilter
  );
  const [journalPath, setJournalPath] = useState(journalFilter);

  const [selectedGrantAgency, setSelectedGrantAgency] = useState(selectGrantingAgency)
  const [selectedPatentClassification, setSelectedPatentClassification] = useState(selectedClassification)
  const [grantPath, setGrantPath] = useState("");
  const [patentClassificationPath, setPatentClassificationPath] = useState("")
  
  let navigate = useNavigate()
  const initialMount = useRef(true)
  const searchBarValueRef = useRef(" ")

  // refs to scroll to result when clicking the numbers
  const researcherResRef = useRef(null)
  const pubResRef = useRef(null)
  const grantResRef = useRef(null)
  const patentResRef = useRef(null)

  useEffect(() => {
    //if there are selected departments, join items in array to create 1 string (different departments separated by &&), replace all spaces with %20
    if (selectedDepartments.length > 0) {
      let selectedDepartmentString = selectedDepartments.join("&&");
      setDepartmentPath(selectedDepartmentString);
    } else {
      setDepartmentPath(" ");
    }
  }, [selectedDepartments]);

  useEffect(() => {
    //if there are selected faculties, join items in array to create 1 string (different faculties separated by &&), replace all spaces with %20
    if (selectedFaculties.length > 0) {
      let selectedFacultyString = selectedFaculties.join("&&");
      setFacultyPath(selectedFacultyString);
    } else {
      setFacultyPath(" ");
    }
  }, [selectedFaculties]);

  useEffect(() => {
    //Selected Journal
    if (selectedJournals.length > 0) {
      let JournalPath = selectedJournals[0];
      for (let i = 1; i < selectedJournals.length; i++) {
        JournalPath = JournalPath + "&&" + selectedJournals[i];
      }
      setJournalPath(JournalPath);
    } else {
      setJournalPath(" ");
    }
  }, [selectedJournals]);

  useEffect(() => {
    if (selectedGrantAgency.length > 0) {
      let GrantPath = selectedGrantAgency[0];
      for (let i = 1; i < selectedGrantAgency.length; i++) {
        GrantPath = GrantPath + "&&" + selectedGrantAgency[i];
      }
      setGrantPath(GrantPath);
    } else {
      setGrantPath(" ");
    }
  }, [selectedGrantAgency])

  useEffect(() => {
    if (selectedPatentClassification.length > 0) {
      let PatentPath = selectedPatentClassification[0];
      for (let i = 1; i < selectedPatentClassification.length; i++) {
        PatentPath = PatentPath + "&&" + selectedPatentClassification[i];
      }
      setPatentClassificationPath(PatentPath);
    } else {
      setPatentClassificationPath(" ");
    }
  }, [selectedPatentClassification])

  useEffect(() => {
    if (initialMount.current) {

      initialMount.current = false

    } else {

      let selectedFacultiesPath = " "
      let selectedDepartmentsPath = " "
      let selectedGrantAgenciesPath = " "
      let selectedPatentClfsPath = " "
      let selectedJournalsPath = " "
      let url = "/ / / / / / /"

      if (selectedFaculties.length !== 0) {
        selectedFacultiesPath = selectedFaculties.join("&&")
      }
      if (selectedDepartments.length !== 0) {
        selectedDepartmentsPath = selectedDepartments.join("&&")
      }
      if (selectedGrantAgency.length !== 0) {
        selectedGrantAgenciesPath = selectedGrantAgency.join("&&")
      }
      if (selectedPatentClassification.length !== 0) {
        selectedPatentClfsPath = selectedPatentClassification.join("&&")
      }
      if (selectedJournals.length !== 0) {
        selectedJournalsPath = selectedJournals.join("&&")
      }
      
      if (props.whatToSearch === "Researchers") {
        
        // if (searchBarValueRef === "") {
        //   searchBarValueRef.current = " "
        // }

        url = "/Search/Researchers/" +
        selectedDepartmentsPath +
        "/" +
        selectedFacultiesPath +
        "/" +
        searchBarValueRef.current +
        "/";

      } else if (props.whatToSearch === "Grants") {

        url = "/Search/Grants/" + selectedGrantAgenciesPath + "/" + searchBarValueRef.current + "/";
      
      } else if  (props.whatToSearch === "Patents") {

        url = "/Search/Patents/" + selectedPatentClfsPath + "/" + searchBarValueRef.current + "/";
      
      } else if (props.whatToSearch === "Publications") {

        url = "/Search/Publications/".concat(selectedJournalsPath, "/", searchBarValueRef.current, "/");

      } else if (props.whatToSearch === "Everything"){
        
        url =
        "/" +
        selectedDepartmentsPath +
        "/" +
        selectedFacultiesPath +
        "/" +
        selectedJournalsPath +
        "/" +
        selectedGrantAgenciesPath +
        "/" +
        selectedPatentClfsPath +
        "/" +
        searchBarValueRef.current +
        "/";
      }

      if ((openDepartmentFiltersDialog === false) && (openFacultyFiltersDialog === false) ) {
        // don't refresh until the department/faculty filter dialogs is closed
        navigate(url);
        window.location.reload();
        //console.log(selectedFaculties)
      }
    }

  }, [selectedFaculties, selectedDepartments, props.whatToSearch, selectedGrantAgency, selectedPatentClassification, selectedJournals, openDepartmentFiltersDialog, openFacultyFiltersDialog])

  const [currentFacultyOptions, setCurrentFacultyOptions] = useState([]);
  const [currentDepartmentOptions, setCurrentDepartmentOptions] = useState([]);

  useEffect(() => {
    const getFilterOptions = async () => {
      const [departmentRes, facultyRes] = await Promise.all([
        API.graphql({
          query: getAllDepartments,
        }),
        API.graphql({
          query: getAllFaculty,
        }),
      ]);

      // create an initial list of json objects that contains the departments and an integer
      // e.g. {'department': 'Department of Statistics', 'checked': 0} with 0 means unchecked and 1 means checked
      let allDepartments = departmentRes.data.getAllDepartments.map((item, index) => ({"department": item, "checked": 0}));
      selectedDepartments.forEach((department) => {
        const currentIndex = allDepartments.findIndex((obj) => obj["department"] === department);
        allDepartments[currentIndex]["checked"] = 1
      });
      setCurrentDepartmentOptions(allDepartments);
      // create an initial list of json objects that contains the faculty and an integer
      // e.g. {'faculty': 'Faculty of Science', 'checked': 0} with 0 means unchecked and 1 means checked
      let allFaculties = facultyRes.data.getAllFaculty.map((item, index) => ({"faculty": item, "checked": 0}));
      selectedFaculties.forEach((faculty) => {
        const currentIndex = allFaculties.findIndex((obj) => obj["faculty"] === faculty);
        allFaculties[currentIndex]["checked"] = 1
      });
      setCurrentFacultyOptions(allFaculties);
    };
    getFilterOptions();
  }, []);

  useEffect(() => {
    const getCatagoriesCountFunction = async () => {
      const catagoriesCount = await API.graphql({
        query: getCatagoriesCount,
      });

      //console.log("Hereee")

      console.log(catagoriesCount.data.getCatagoriesCount)
      setCatagoriesCount(catagoriesCount.data.getCatagoriesCount);
    };
    //console.log("HEREEE")
    getCatagoriesCountFunction();
  }, []);

  return (
    <div>
      <Grid container>
        <Grid item xs={12}>
          <Paper
            //variant="outlined"
            square={true} 
            elevation={0}
          >
            <Grid container sx={{ border: '0px' }}>
              <Grid item xs={12}>
                {
                  (props.whatToSearch === "Everything" && searchYet === false) ?
                    (<Typography align="center" variant="h4" sx={{ margin: "8px", pt: "1.5%", pb: "1.5%" }}>
                      {"Welcome to the Expertise Dashboard"}
                    </Typography>) : (props.whatToSearch === "Researchers") ? 
                      (<Typography align="center" variant="h4" sx={{ margin: "8px", pt: "1.5%", pb: "1.5%" }}>
                        {"Find Researchers"}
                      </Typography>) :
                      (<Typography align="center" variant="h4" sx={{ margin: "8px", pt: "1.5%", pb: "1.5%" }}>
                        {"Find " + props.whatToSearch}
                      </Typography>)
                }
              </Grid>
              <Grid item xs={12} sx={{paddingBottom: 3}} align="center">
                <SearchBar
                  setResearcherSearchResults={setResearcherSearchResults}
                  setPublicationSearchResults={setPublicationSearchResults}
                  whatToSearch={props.whatToSearch}
                  searchYet={props.searchYet}
                  selectedDepartments={selectedDepartments}
                  selectedFaculties={selectedFaculties}
                  selectedJournals={selectedJournals}
                  selectedGrants={selectedGrantAgency}
                  selectedPatentClassification={selectedPatentClassification}
                  departmentPath={departmentPath}
                  facultyPath={facultyPath}
                  journalPath={journalPath}
                  grantPath={grantPath}
                  patentClassificationPath={patentClassificationPath}
                  setResearcherSearchResultPage={setResearcherSearchResultPage}
                  setPublicationsSearchResultPage={setPublicationsSearchResultPage}
                  setGrantsSearchResults={setGrantsSearchResults}
                  setPatentSearchResults={setPatentSearchResults}
                  setSearchYet={setSearchYet}
                  searchBarValueRef={searchBarValueRef}
                />
                <Paper
                  variant="elevation"
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
      {searchYet === false && <HomePageBar 
        researchersCount={catagoiresCount.researcherCount} 
        publicationsCount={catagoiresCount.publicationCount} 
        grantsCount={catagoiresCount.grantCount} 
        patentsCount={catagoiresCount.patentCount} />}

      <Grid container>
        {(props.whatToSearch === "Everything" && searchYet === true) && (
          <Grid container 
            spacing={4} 
            sx={{justifyContent: "right", alignSelf: "center", marginTop: "2%", paddingRight: "2%"}}
          >
            <Grid item >
              <Typography
                variant="h5"
                sx={{color: "#666666"}}
              >
                {"Researchers: "}  
                <Link sx={{color: "blue", textDecorationColor: 'blue'}} 
                  onClick={() => {researcherResRef.current.scrollIntoView()}}
                >
                  {researchSearchResults.length}
                </Link>
              </Typography>
            </Grid>

            <Grid item >
              <Typography
                variant="h5"
                sx={{color: "#666666"}}
              >
                {"Publications: "}
                <Link sx={{color: "blue", textDecorationColor: 'blue'}} 
                  onClick={() => {pubResRef.current.scrollIntoView()}}
                >
                  {publicationSearchResults.length}
                </Link>
              </Typography>
            </Grid>

            <Grid item >
              <Typography
                variant="h5"
                sx={{color: "#666666"}}
              >
                {"Grants: "}
                <Link sx={{color: "blue", textDecorationColor: 'blue'}} 
                  onClick={() => {grantResRef.current.scrollIntoView()}}
                >
                  {grantsSearchResults.length}
                </Link>
              </Typography>
            </Grid>

            <Grid item >
              <Typography
                variant="h5"
                sx={{color: "#666666"}}
              >
                {"Patents: "}
                <Link sx={{color: "blue", textDecorationColor: 'blue'}} 
                  onClick={() => {patentResRef.current.scrollIntoView()}}
                >
                  {patentsSearchResults.length}
                </Link>
              </Typography>
            </Grid>
          </Grid>
        )}
        {(props.whatToSearch === "Everything" ||
          props.whatToSearch === "Researchers") && (
          <Grid container item xs={12} sx={{ p: "1.5em" }}>
            <Grid item xs={2}>
              <ResearcherFilters
                selectedDepartments={selectedDepartments}
                setSelectedDeparments={setSelectedDeparments}
                selectedFaculties={selectedFaculties}
                setSelectedFaculties={setSelectedFaculties}
                searchYet={searchYet}
                openFacultyFiltersDialog={openFacultyFiltersDialog}
                setOpenFacultyFiltersDialog={setOpenFacultyFiltersDialog}
                openDepartmentFiltersDialog={openDepartmentFiltersDialog}
                setOpenDepartmentFiltersDialog={setOpenDepartmentFiltersDialog}
                currentFacultyOptions={currentFacultyOptions}
                setCurrentFacultyOptions={setCurrentFacultyOptions}
                currentDepartmentOptions={currentDepartmentOptions}
                setCurrentDepartmentOptions={setCurrentDepartmentOptions}
              />
            </Grid>
            <Grid item xs={10} ref={researcherResRef}>
              <ResearcherSearchResultsComponent
                researchSearchResults={researchSearchResults}
                researcherSearchResultPage={researcherSearchResultPage}
                errorTitle={searchBarValueRef.current !== " " ? ('No Researcher Search Results for: "' + searchBarValueRef.current + '"') : (<div></div>)}
                setResearcherSearchResultPage={setResearcherSearchResultPage}
                searchYet={searchYet}
              />
            </Grid>
          </Grid>
        )}
        {(props.whatToSearch === "Everything" ||
          props.whatToSearch === "Publications") && (
          <Grid container item xs={12} sx={{ p: "1.5em" }}>
            {/* <Grid item xs={2}>
              <PublicationFilters
                selectedJournals={selectedJournals}
                setSelectedJournals={setSelectedJournals}
                searchYet={searchYet}
              />
            </Grid> */}
            <Grid item xs={12} ref={pubResRef}>
              <PublicationSearchResultsComponent
                publicationSearchResults={publicationSearchResults}
                publicationsSearchResultPage={publicationsSearchResultPage}
                setPublicationsSearchResultPage={
                  setPublicationsSearchResultPage
                }
                //errorTitle={'No Publication Search Results for: "' + (searchBarValueRef.current === " " ? "" : searchBarValueRef.current) + '"'}
                errorTitle={searchBarValueRef.current !== " " ? ('No Publication Search Results for: "' + searchBarValueRef.current + '"') : (<div></div>)}
                searchYet={searchYet}
              />
            </Grid>
          </Grid>
        )}
        {(props.whatToSearch === "Everything" ||
         props.whatToSearch === "Grants") && (
          <Grid container item xs={12} sx={{ p: "1.5em" }}>
            <Grid item xs={2}>
              <GrantFilters selectedGrants={selectedGrantAgency}
                setSelectedGrants={setSelectedGrantAgency}
                searchYet={searchYet} />
            </Grid>
            <Grid item xs={10} ref={grantResRef}>
              <GrantInformation 
                grantData={grantsSearchResults} 
                tabOpened={false} 
                initialNumberOfRows={50}
                searchYet={searchYet}
                //errorTitle={'No Grant Search Results for: "' + (searchBarValueRef.current === " " ? "" : searchBarValueRef.current) + '"'}
                errorTitle={searchBarValueRef.current !== " " ? ('No Grant Search Results for: "' + searchBarValueRef.current + '"') : (<div></div>)}
              />
            </Grid>
          </Grid>
        )}
        {(props.whatToSearch === "Everything" ||
         props.whatToSearch === "Patents") && (
          <Grid container item xs={12} sx={{ p: "1.5em" }}>
            <Grid item xs={2.4} sx={{}}>
              <PatentFilters selectedPatentClassification={selectedPatentClassification}
              setSelectedPatentClassification={setSelectedPatentClassification}
              searchYet={searchYet}/>
            </Grid>
            <Grid item xs={9.6} ref={patentResRef}>
              <PatentInformation 
                tabOpened={false} 
                researcherPatents={patentsSearchResults} 
                initialNumberOfRows={10}
                searchYet={searchYet}
                //errorTitle={'No Patent Search Results for: "' + (searchBarValueRef.current === " " ? "" : searchBarValueRef.current) + '"'}
                errorTitle={searchBarValueRef.current !== " " ? ('No Patent Search Results for: "' + searchBarValueRef.current + '"') : (<div></div>)}
              />
            </Grid>
          </Grid>
        )}
      </Grid>
    </div>
  );
}
