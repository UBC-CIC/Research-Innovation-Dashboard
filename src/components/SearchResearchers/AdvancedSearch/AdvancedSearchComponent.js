import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import React, { useRef } from "react";
import Stack from "@mui/material/Stack";
import { useState, useEffect } from "react";
import AdvancedSearchRow from "./AdvancedSearchRow";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import ResearcherSearchResultsComponent from "../ResearcherSearchResultsComponent";
import PublicationSearchResultsComponent from "../PublicationSearchResultsComponent";
import GrantInformation from "../../ResearcherProfile/GrantInformation";
import AutoCompleteDropDown from "./AutoCompleteDrowDown";
import InputBase from "@mui/material/InputBase";
import Scroll from "react-scroll";
import ArrowDropDownCircleRoundedIcon from '@mui/icons-material/ArrowDropDownCircleRounded';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

import { API } from "aws-amplify";

import {
  advancedSearchResearchers,
  advancedSearchPublications,
  getAllDistinctJournals,
  getAllDepartments,
  getAllFaculty,
  advancedSearchGrants,
} from "../../../graphql/queries";

export default function Advanced_Search(props) {
  const [researchSearchResults, setResearcherSearchResults] = useState([]);
  const [publicationSearchResults, setPublicationSearchResults] = useState([]);
  const [grantsSearchResults, setGrantsSearchResults] = useState([]);
  const [allJournals, setAllJournals] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [allFaculty, setAllFaculty] = useState([]);
  const [researcherSearchResultPage, setResearcherSearchResultPage] = useState(1);
  const [publicationsSearchResultPage, setPublicationsSearchResultPage] = useState(1);

  let scroll = Scroll.animateScroll;

  let {
    SearchForWhat,
    AllWords,
    ExactPhrase,
    AnyWords,
    NoneOfTheseWords,
    Department,
    Faculty,
    yearFrom,
    yearTo,
    Journal,
  } = useParams();

  const [includeAllTheseWordsSearchBarValue,setIncludeAllTheseWordsSearchBarValue] = useState("");
  const [exactPhraseSearchBarValue, setExactPhraseSearchBarValue] = useState("");
  const [anyWordsSearchBarValue, setAnyWordsSearchBarValue] = useState("");
  const [noneOfTheseWordsSearchBarValue, setNoneOfTheseWordsSearchBarValue] = useState("");

  const [filterFacultyValue, setFilterFacultyValue] = useState("");
  const [filterDepartmentValue, setFilterDepartmentValue] = useState("");
  const [filterJournalValue, setFitlerJournalValue] = useState("");
  const [contentToSearchForValue, setContentToSearchForValue] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchClicked, setSearchClicked] = useState(true);
  const [advancedSearchYet, setAdvancedSearchYet] = useState(false);

  const titleRef = useRef();

  function updateVariables() {
    let date = new Date();
    let year = date.getFullYear();
    let month = (date.getMonth() + 1).toString();
    if (month.length === 1) {
      month = 0 + month;
    }

    if (!AllWords || AllWords === " ") {
      AllWords = "";
    }
    if (!ExactPhrase || ExactPhrase === " ") {
      ExactPhrase = "";
    }
    if (!AnyWords || AnyWords === " ") {
      AnyWords = "";
    }
    if (!NoneOfTheseWords || NoneOfTheseWords === " ") {
      NoneOfTheseWords = "";
    }
    if (!Department) {
      Department = "All Departments";
    }
    if (!Faculty) {
      Faculty = "All Faculties";
    }
    if (!Journal) {
      Journal = "All Journals";
    }
    if (!yearFrom) {
      yearFrom = year - 5 + "-" + month;
    }
    if (!yearTo) {
      yearTo = year + "-" + month;
    }
    if (SearchForWhat === "null") {
      SearchForWhat = "Everything";
    }
    setIncludeAllTheseWordsSearchBarValue(AllWords);
    setExactPhraseSearchBarValue(ExactPhrase);
    setAnyWordsSearchBarValue(AnyWords);
    setNoneOfTheseWordsSearchBarValue(NoneOfTheseWords);
    setFilterFacultyValue(Faculty);
    setFilterDepartmentValue(Department);
    setFitlerJournalValue(Journal);
    setContentToSearchForValue(SearchForWhat);
    setFromDate(yearFrom);
    setToDate(yearTo);
  }

  let navigate = useNavigate();
  let path = "/AdvancedSearch/";
  const routeChange = () => {
    if (!contentToSearchForValue) {
      path = path + "Everything/";
    } else {
      path = path + contentToSearchForValue + "/";
    }

    if (includeAllTheseWordsSearchBarValue.length === 0) {
      path = path + " /";
    } else {
      path = path + includeAllTheseWordsSearchBarValue + "/";
    }
    if (exactPhraseSearchBarValue.length === 0) {
      path = path + " /";
    } else {
      path = path + exactPhraseSearchBarValue + "/";
    }
    if (anyWordsSearchBarValue.length === 0) {
      path = path + " /";
    } else {
      path = path + anyWordsSearchBarValue + "/";
    }
    if (noneOfTheseWordsSearchBarValue.length === 0) {
      path = path + " /";
    } else {
      path = path + noneOfTheseWordsSearchBarValue + "/";
    }
    if (!filterDepartmentValue) {
      path = path + "All Departments/";
    } else {
      path = path + filterDepartmentValue + "/";
    }
    if (!filterFacultyValue) {
      path = path + "All Faculties/";
    } else {
      path = path + filterFacultyValue + "/";
    }
    if (!fromDate) {
      path = path + yearFrom + "/";
    } else {
      path = path + fromDate + "/";
    }
    if (!toDate) {
      path = path + yearTo + "/";
    } else {
      path = path + toDate + "/";
    }
    if (!filterJournalValue) {
      path = path + "All Journals/";
    } else {
      path = path + filterJournalValue + "/";
    }
    navigate(path);
    setSearchClicked(true);
  };

  const getAllJournals = async () => {
    const result = await API.graphql({
      query: getAllDistinctJournals,
    });
    result.data.getAllDistinctJournals.shift(); // There is an Empty Journal Bug in DB for now!
    result.data.getAllDistinctJournals.unshift("All Journals");
    setAllJournals(result.data.getAllDistinctJournals);
  };

  const getAllFacultyFunction = async () => {
    const result = await API.graphql({
      query: getAllFaculty,
    });
    result.data.getAllFaculty.unshift("All Faculties");
    setAllFaculty(result.data.getAllFaculty);
  };

  const getAllDepartmentsFunction = async () => {
    const result = await API.graphql({
      query: getAllDepartments,
    });
    result.data.getAllDepartments.unshift("All Departments");
    setAllDepartments(result.data.getAllDepartments);
  };

  const searchResearchersQuery = async () => {
    const researcherSearchResult = await API.graphql({
      query: advancedSearchResearchers,
      variables: {
        includeAllTheseWords: AllWords,
        includeTheseExactWordsOrPhrases: ExactPhrase,
        includeAnyOfTheseWords: AnyWords,
        noneOfTheseWords: NoneOfTheseWords,
        prime_department: filterDepartmentValue,
        prime_faculty: filterFacultyValue,
        table: "researcher_data",
      },
    });
    setResearcherSearchResults(
      researcherSearchResult.data.advancedSearchResearchers
    );
  };
  const searchPublicationsQuery = async () => {
    const publicationsSearchResult = await API.graphql({
      query: advancedSearchPublications,
      variables: {
        includeAllTheseWords: AllWords,
        includeTheseExactWordsOrPhrases: ExactPhrase,
        includeAnyOfTheseWords: AnyWords,
        noneOfTheseWords: NoneOfTheseWords,
        table: "publication_data",
        year_gte: fromDate.slice(0, 4),
        year_lte: toDate.slice(0, 4),
        journal: filterJournalValue,
      },
    });
    setPublicationSearchResults(
      publicationsSearchResult.data.advancedSearchPublications
    );
  };

  const searchGrantsQuery = async () => {
    const grantsSearchResult = await API.graphql({
      query: advancedSearchGrants,
      variables: {
        includeAllTheseWords: AllWords,
        includeTheseExactWordsOrPhrases: ExactPhrase,
        includeAnyOfTheseWords: AnyWords,
        noneOfTheseWords: NoneOfTheseWords,
        table: "grant_data",
      },
    });
    //console.log(grantsSearchResult)
    setGrantsSearchResults(
      grantsSearchResult.data.advancedSearchGrants
    );
  };

  function scrollToResults() {
    titleRef.current.scrollIntoView({ behavior: "smooth" });
  }

  async function search() {
    await searchResearchersQuery();
    await searchPublicationsQuery();
    await searchGrantsQuery();
    scrollToResults();
  }

  useEffect(() => {
    if (searchClicked) {
      updateVariables();
      setSearching(true);
      setSearchClicked(false);
    }
  }, [
    SearchForWhat,
    AllWords,
    ExactPhrase,
    AnyWords,
    NoneOfTheseWords,
    Department,
    Faculty,
    yearFrom,
    yearTo,
    Journal,
    searchClicked,
  ]);

  useEffect(() => {
    if (searching) {
      search();
      setSearching(false);
    }
  }, [searching]);

  useEffect(() => {
    getAllJournals();
    getAllFacultyFunction();
    getAllDepartmentsFunction();
    updateVariables();
  }, []);

  return (
    <div>
      <Grid container>
        <Paper
          square={true}
          elevation={0}
          sx={{
            width: "100%",
            pl: "2%",
            pr: "2%",
            borderBottom: 1,
            borderColor: "rgba(0, 0, 0, 0.12)",
          }}
          component={Stack}
          direction="row"
        >
          <Typography variant="h4" sx={{ m: "2%", ml: "0%" }}>
            Advanced Search
          </Typography>
        </Paper>
      </Grid>

      <Grid container spacing={0.5}>
        <Grid item xs={7.5} sx={{flexDirection: "column"}}>
          <AutoCompleteDropDown
              value={contentToSearchForValue}
              setValue={setContentToSearchForValue}
              title={"Type Of Content To Search For"}
              DropDownArray={["Everything", "Researchers", "Publications", "Grants"]}
              advancedSearchYet={advancedSearchYet}
              setAdvancedSearchYet={setAdvancedSearchYet}
            />
          <AdvancedSearchRow
            routeChange={routeChange}
            whatDoesSearchBoxDo={"Include All These Words:"}
            howToDoSearchBox={
              "Type in the important words with spaces between them"
            }
            searchBarValue={includeAllTheseWordsSearchBarValue}
            setSearchBarValue={setIncludeAllTheseWordsSearchBarValue}
            advancedSearchYet={advancedSearchYet}
            setAdvancedSearchYet={setAdvancedSearchYet}
          />
          <AdvancedSearchRow
            routeChange={routeChange}
            whatDoesSearchBoxDo={"Include These Exact Phrases: "}
            howToDoSearchBox={
              'Put exact phrases in quotes, e.g., "Singapore Economy" '
            }
            searchBarValue={exactPhraseSearchBarValue}
            setSearchBarValue={setExactPhraseSearchBarValue}
            advancedSearchYet={advancedSearchYet}
            setAdvancedSearchYet={setAdvancedSearchYet}
          />
          <AdvancedSearchRow
            routeChange={routeChange}
            whatDoesSearchBoxDo={"Include Any Of These Words"}
            howToDoSearchBox={"Put in words that you want to search for"}
            searchBarValue={anyWordsSearchBarValue}
            setSearchBarValue={setAnyWordsSearchBarValue}
            advancedSearchYet={advancedSearchYet}
            setAdvancedSearchYet={setAdvancedSearchYet}
          />
          <AdvancedSearchRow
            routeChange={routeChange}
            whatDoesSearchBoxDo={"Do Not Include Any Of These Words"}
            howToDoSearchBox={
              "Put a minus sign in front of words you want to exclude, e.g, -Economics -Asia"
            }
            searchBarValue={noneOfTheseWordsSearchBarValue}
            setSearchBarValue={setNoneOfTheseWordsSearchBarValue}
            advancedSearchYet={advancedSearchYet}
            setAdvancedSearchYet={setAdvancedSearchYet}
          />
          <Paper
          square={true}
          elevation={0}
          sx={{ width: "91%"}}
          style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: "1%"}}
          >
            <Button
              onClick={() => {
                setAdvancedSearchYet(true)
                routeChange();
              }}
              sx={{
                borderRadius: 0,
                border: "2px solid Black",
                color: "black",
                backgroundColor: "white",
              }}
            >
              Search
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={4.5}>
          <Accordion>
            <AccordionSummary
              //expandIcon={<ExpandMoreIcon/>}
              expandIcon={<ArrowDropDownCircleRoundedIcon sx={{}}/>}
              aria-controls="panel1a-content"
              id="panel1a-header"
              sx={{marginRight: '0%'}}
            >
              <Typography variant="h6" sx={{ m: "0%", ml: "1%", pl: "0%", pr: "0%", pb: "1%" }}>
                Narrow Search Results By
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container>
                <AutoCompleteDropDown
                  value={filterDepartmentValue}
                  setValue={setFilterDepartmentValue}
                  title={"Filter Researchers By Department"}
                  DropDownArray={allDepartments}
                />
                <AutoCompleteDropDown
                  value={filterFacultyValue}
                  setValue={setFilterFacultyValue}
                  title={"Filter Researchers By Faculty"}
                  DropDownArray={allFaculty}
                />
                <Paper
                  square={true}
                  elevation={0}
                  sx={{ width: "100%", ml: "2%", mr: "2%" }}
                  component={Stack}
                  direction="row"
                >
                  <Paper
                    elevation={0}
                    sx={{ width: "20%", paddingRight: "2%" }}
                    component={Stack}
                    direction="column"
                    justifyContent="center"
                  ></Paper>
                  <Paper
                    square={true}
                    elevation={0}
                    sx={{ width: "24%", border: 0, ml: "7%", mr: "28%" }}
                    component={Stack}
                    direction="row"
                  >
                    FROM
                  </Paper>
                  <Paper
                    square={true}
                    elevation={0}
                    sx={{ width: "24%", border: 0, ml: "1%" }}
                    component={Stack}
                    direction="row"
                  >
                    TO
                  </Paper>
                  <Paper
                    elevation={0}
                    sx={{ width: "30%", paddingLeft: "2%" }}
                    component={Stack}
                    direction="column"
                    justifyContent="center"
                  ></Paper>
                </Paper>
                <Paper
                  square={true}
                  elevation={0}
                  sx={{ width: "100%", m: "2%", mt: "0%" }}
                  component={Stack}
                  direction="row"
                  
                >
                  <Paper
                    elevation={0}
                    sx={{ width: "20%", paddingRight: "2%" }}
                    component={Stack}
                    direction="column"
                    justifyContent="center"
                  >
                    <Typography variant="h7">Filter Publications By Year:</Typography>
                  </Paper>
                  <Paper
                    square={true}
                    elevation={0}
                    sx={{ width: "24%", border: 1, mr: "17%" }}
                    component={Stack}
                    direction="row"
                  >
                    <InputBase
                      value={fromDate}
                      type="month"
                      onChange={(event) => {
                        setFromDate(event.target.value);
                      }}
                      fullWidth={true}
                      sx={{ padding: "8px", fontSize: "1.0rem" }}
                    ></InputBase>
                  </Paper>
                  <Paper
                    square={true}
                    elevation={0}
                    sx={{ width: "24%", border: 1, ml: "1%" }}
                    component={Stack}
                    direction="row"
                  >
                    <InputBase
                      value={toDate}
                      type="month"
                      onChange={(event) => {
                        setToDate(event.target.value);
                      }}
                      fullWidth={true}
                      sx={{ padding: "8px", fontSize: "1.0rem" }}
                    ></InputBase>
                  </Paper>
                </Paper>
                <AutoCompleteDropDown
                  value={filterJournalValue}
                  setValue={setFitlerJournalValue}
                  title={"Filter Publications By Journal"}
                  DropDownArray={allJournals}
                />
                {/* <AutoCompleteDropDown
                  value={contentToSearchForValue}
                  setValue={setContentToSearchForValue}
                  title={"Type Of Content To Search For"}
                  DropDownArray={["Everything", "Researchers", "Publications", "Grants"]}
                /> */}
                <Paper
                  square={true}
                  elevation={0}
                  sx={{
                    width: "100%",
                    p: "2%",
                    borderBottom: 1,
                    borderColor: "rgba(0, 0, 0, 0.12)",
                  }}
                  component={Stack}
                  direction="row"
                >
                  <Paper
                    elevation={0}
                    sx={{ width: "20%", paddingRight: "2%" }}
                    component={Stack}
                    direction="column"
                    justifyContent="center"
                  ></Paper>
                  <Paper
                    elevation={0}
                    sx={{ width: "30%", paddingLeft: "2%" }}
                    component={Stack}
                    direction="column"
                    justifyContent="center"
                  ></Paper>
                </Paper>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
      <div ref={titleRef}></div>
      {advancedSearchYet && (SearchForWhat === "Everything" || SearchForWhat === "Researchers") && (
        <ResearcherSearchResultsComponent
          researchSearchResults={researchSearchResults}
          researcherSearchResultPage={researcherSearchResultPage}
          setResearcherSearchResultPage={setResearcherSearchResultPage}
          searchYet={true}
        />
      )}
      {advancedSearchYet && (SearchForWhat === "Everything" || SearchForWhat === "Publications") && (
        <PublicationSearchResultsComponent
          publicationSearchResults={publicationSearchResults}
          publicationsSearchResultPage={publicationsSearchResultPage}
          setPublicationsSearchResultPage={setPublicationsSearchResultPage}
          searchYet={true}
        />
      )}
      {advancedSearchYet &&(SearchForWhat === "Everything" || SearchForWhat === "Grants") && (
        <GrantInformation 
          grantData={grantsSearchResults} 
          tabOpened={false} 
          initialNumberOfRows={50}
          searchYet={true}
        />
      )}
    </div>
  );
}
