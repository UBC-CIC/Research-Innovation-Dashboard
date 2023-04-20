import * as React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import "./ResearcherProfile.css";
import Button from "@mui/material/Button";
import AreasOfInterest from "./AreasOfInterest";
import Publications from "./Publications";
import IntellectualProperty from "./IntellectualPropertyActivity";
import ResearcherInfo from "./ResearcherInfo";
import ResearcherHighlights from "./ResearchHighlights";
import ResearchProfileNavigation from "./ResearcherProfileNavigation";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import SimilarResearchers from "./SimilarResearchers";
import LoadingWheel from "../LoadingWheel";
import PublicationBarGraph from "./PublicationBarGraph";
import PatentInformation from "./PatentInformation";
import ResearcherSearchResultsComponent from "../SearchResearchers/ResearcherSearchResultsComponent";

import Amplify from "@aws-amplify/core";
import { Auth } from "@aws-amplify/auth";
import awsmobile from "../../aws-exports";
import GrantInformation from "./GrantInformation";

import { API } from "aws-amplify";
import {
  getResearcherFull,
  getResearcherPubsByCitations,
  getResearcherPubsByYear,
  getResearcherPubsByTitle,
  getNumberOfResearcherPubsLastFiveYears,
  getNumberOfResearcherPubsAllYears,
  similarResearchers,
  getResearcherGrants,
  getResearcherPatents,
  searchResearcher,
  otherResearchersWithKeyword,
} from "../../graphql/queries";

Amplify.configure(awsmobile);
Auth.configure(awsmobile);

export default function Researcher_profile_overview() {
  const { researcherId } = useParams();

  const [first_name, set_first_name] = useState("");
  const [last_name, set_last_name] = useState("");
  const [preferred_name, set_preferred_name] = useState("");
  const [prime_department, set_prime_department] = useState("");
  const [prime_faculty, set_prime_faculty] = useState("");
  const [email, set_email] = useState("");
  const [phone_number, set_phone_number] = useState("");
  const [office, set_office] = useState("");
  const [num_publications, set_num_publications] = useState(0);
  const [h_index, set_h_index] = useState(0);
  const [funding, set_funding] = useState("");
  const [num_patents_filed, set_num_patents_filed] = useState(0);
  const [num_licensed_patents, set_num_licensed_patents] = useState(0);
  const [showOverview, setShowOverview] = useState(true);
  const [showAreasOfInterest, setShowAreasOfInterest] = useState(false);
  const [showPublications, setShowPublications] = useState(false);
  const [showSimilarResearchers, setShowSimilarResearchers] = useState(false);
  const [similarResearchersArray, setSimilarResearchersArray] = useState([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(0)
  const [rank, setRank] = useState("")
  const [grantData, setGrantData] = useState([]);
  const [showGrants, setShowGrants] = useState(false);
  const [showPatents, setShowPatents] = useState(false);
  const [showResearchersWithSimilarKeyword, setShowResearchersWithSimilarKeyword] = useState(false);
  const [researcherPatents, setResearcherPatents] = useState([]);
  const [scopusId, setScopusId] = useState("");

  const [numberOfPublicationsToShow, setNumberOfPublicationsToShow] =
    useState(2);
  const [increasePublicationListBy, setincreasePublicationListBy] =
    useState(50);

  const [
    descendingPublicationListByCitation,
    setDescendingPublicationListByCitation,
  ] = useState([]);
  const [
    ascendingPublicationListByCitation,
    setAscendingPublicationListByCitation,
  ] = useState([]);

  const [descendingPublicationListByYear, setDescendingPublicationListByYear] =
    useState([]);
  const [ascendingPublicationListByYear, setAscendingPublicationListByYear] =
    useState([]);

  const [
    descendingPublicationListByTitle,
    setDescendingPublicationListByTitle,
  ] = useState([]);
  const [ascendingPublicationListByTitle, setAscendingPublicationListByTitle] =
    useState([]);

  const [numberOfPublications, setNumberOfPublications] = useState(0);

  const [sortedAreasOfInterest, setSortedAreasOfInterest] = useState([[""]]);

  const [barGraphLastFiveYears, setBarGraphLastFiveYears] = useState([
    "0",
    "0",
    "0",
    "0",
    "0",
  ]);
  const [publicationsPerYear, setPublicationsPerYear] = useState([
    "0",
    "0",
    "0",
    "0",
    "0",
  ]);

  const [barGraphLastAllYears, setBarGraphLastAllYears] = useState(["0"]);
  const [publicationsAllYears, setPublicationsAllYears] = useState(["0"]);

  const [pageLoaded, setPageLoaded] = useState(false);

  const [showFullGraph, setShowFullGraph] = useState(false);

  const [researchersWithClickedKeyword, setResearchersWithClickedKeyword] = useState([]);
  const [researcherSearchResultPage, setResearcherSearchResultPage] = useState(1);
  const [keywordToSearchFor, setKeywordToSearchFor] = useState("")

  const [navButtonSelected, setNavButtonSelected] = useState("Overview")

  const getPatents = async () => {
    const researcherPatentData = await API.graphql({
      query: getResearcherPatents,
      variables: { id: researcherId },
    });

    //console.log(researcherPatentData.data.getResearcherPatents);
    const sortedPatents = researcherPatentData.data.getResearcherPatents
      .sort((patent1, patent2) => patent2.patent_publication_date.substring(0,4) - patent1.patent_publication_date.substring(0,4))
    setResearcherPatents(sortedPatents);
  }

  const getAllPublications = async () => {
    const dataSortedByCitation = await API.graphql({
      query: getResearcherPubsByCitations,
      variables: { id: researcherId },
    });
    const dataSortedByYear = await API.graphql({
      query: getResearcherPubsByYear,
      variables: { id: researcherId },
    });
    const dataSortedByTitle = await API.graphql({
      query: getResearcherPubsByTitle,
      variables: { id: researcherId },
    });
    let publication_data_sorted_by_ciation =
      dataSortedByCitation.data.getResearcherPubsByCitations;
    let publication_data_sorted_by_year =
      dataSortedByYear.data.getResearcherPubsByYear;
    let publication_data_sorted_by_title =
      dataSortedByTitle.data.getResearcherPubsByTitle;
    let descendingPublicationsCitation = [];
    let ascendingPublicationsCitation = [];

    let descendingPublicationsYear = [];
    let ascendingPublicationsYear = [];

    let descendingPublicationsTitle = [];
    let ascendingPublicationsTitle = [];

    for (let i = 0; i < publication_data_sorted_by_ciation.length; i++) {
      let authors = publication_data_sorted_by_ciation[i].author_names;
      //Sorted By Citation Publication
      let publicationCitation = {
        id: publication_data_sorted_by_ciation[i].id,
        title: publication_data_sorted_by_ciation[i].title,
        author_names: authors,
        cited_by: publication_data_sorted_by_ciation[i].cited_by,
        year_published: publication_data_sorted_by_ciation[i].year_published,
        journal: publication_data_sorted_by_ciation[i].journal,
        link: publication_data_sorted_by_ciation[i].link,
        keywords: publication_data_sorted_by_ciation[i].keywords
      };
      descendingPublicationsCitation.push(publicationCitation);
      ascendingPublicationsCitation.unshift(publicationCitation);

      //Sorted By Year Publication
      let publicationYear = {
        id: publication_data_sorted_by_year[i].id,
        title: publication_data_sorted_by_year[i].title,
        author_names: authors,
        cited_by: publication_data_sorted_by_year[i].cited_by,
        year_published: publication_data_sorted_by_year[i].year_published,
        journal: publication_data_sorted_by_year[i].journal,
        link: publication_data_sorted_by_year[i].link,
        keywords: publication_data_sorted_by_year[i].keywords
      };
      descendingPublicationsYear.push(publicationYear);
      ascendingPublicationsYear.unshift(publicationYear);

      //Sorted By Title Publication
      let publicationTitle = {
        id: publication_data_sorted_by_title[i].id,
        title: publication_data_sorted_by_title[i].title,
        author_names: authors,
        cited_by: publication_data_sorted_by_title[i].cited_by,
        year_published: publication_data_sorted_by_title[i].year_published,
        journal: publication_data_sorted_by_title[i].journal,
        link: publication_data_sorted_by_title[i].link,
        keywords: publication_data_sorted_by_title[i].keywords
      };
      descendingPublicationsTitle.push(publicationTitle);
      ascendingPublicationsTitle.unshift(publicationTitle);
    }

    setNumberOfPublications(descendingPublicationsCitation.length);

    setDescendingPublicationListByCitation(descendingPublicationsCitation);
    setAscendingPublicationListByCitation(ascendingPublicationsCitation);

    setDescendingPublicationListByYear(descendingPublicationsYear);
    setAscendingPublicationListByYear(ascendingPublicationsYear);

    setDescendingPublicationListByTitle(descendingPublicationsTitle);
    setAscendingPublicationListByTitle(ascendingPublicationsTitle);

    const grantResult = await API.graphql({
      query: getResearcherGrants,
      variables: {
        id: researcherId,
      },
    });
    // grant sorted by most recent
    const sortedGrant = grantResult.data.getResearcherGrants
      .sort((grant1, grant2) => grant2.year.substring(0,4) - grant1.year.substring(0,4))
    setGrantData(sortedGrant);
    setPageLoaded(true);
  };

  const getResearcherGeneralInformation = async () => {
    const researcher_data_response = await API.graphql({
      query: getResearcherFull,
      variables: { id: researcherId },
    });
    let researcher_data = researcher_data_response.data.getResearcherFull;
    set_first_name(researcher_data.first_name);
    set_last_name(researcher_data.last_name);
    set_preferred_name(researcher_data.preferred_name);
    set_prime_department(researcher_data.prime_department);
    set_prime_faculty(researcher_data.prime_faculty);
    set_email(researcher_data.email);
    set_phone_number("");
    set_office("");
    set_num_publications(researcher_data.num_documents);
    set_h_index(researcher_data.h_index);
    set_num_patents_filed(researcher_data.num_patents_filed);
    setLastUpdatedAt(researcher_data.last_updated);
    setRank(researcher_data.rank);
    setScopusId(researcher_data.scopus_id)

    set_num_licensed_patents(0);

    const result = await API.graphql({
      query: similarResearchers,
      variables: {
        researcher_id: researcherId,
      },
    });

    setSimilarResearchersArray(result.data.similarResearchers);

    // create weighted list of keywords
    let keywordHashmap = new Map();
    let keyWords = researcher_data.merged_keywords.split(", ");

    for (let i = 0; i < keyWords.length; i++) {
      if (keywordHashmap.get(keyWords[i])) {
        keywordHashmap.set(keyWords[i], keywordHashmap.get(keyWords[i]) + 1);
      } else {
        keywordHashmap.set(keyWords[i], 1);
      }
    }

    let sortedKeywordHashmap = [...keywordHashmap].sort((a, b) => b[1] - a[1]);
    let sortedAreas = [];
    let areaWeight = [];

    for (let i = 0; i < sortedKeywordHashmap.length; i++) {
      sortedAreas.push(sortedKeywordHashmap[i][0]);
    }
    // save weighted list of keywords to state variable
    setSortedAreasOfInterest(sortedKeywordHashmap);
    //console.log(sortedAreasOfInterest)
  };
  const getResearcherBarGraphData = async () => {
    const bar_graph_data_response = await API.graphql({
      query: getNumberOfResearcherPubsLastFiveYears,
      variables: { id: researcherId },
    });
    const bar_graph_data_response_all_years = await API.graphql({
      query: getNumberOfResearcherPubsAllYears,
      variables: { id: researcherId },
    });
    let bar_graph_data =
      bar_graph_data_response.data.getNumberOfResearcherPubsLastFiveYears;
    let bar_graph_data_all_years =
      bar_graph_data_response_all_years.data.getNumberOfResearcherPubsAllYears;
    setBarGraphLastFiveYears(bar_graph_data.lastFiveYears);
    setPublicationsPerYear(bar_graph_data.publicationsPerYear);
    setBarGraphLastAllYears(bar_graph_data_all_years.allyears);
    setPublicationsAllYears(bar_graph_data_all_years.publicationsPerYear);
  };

  useEffect(() => {
    getResearcherGeneralInformation().catch((e) => {
      console.log(e);
    });
    getAllPublications().catch((e) => {
      console.log(e);
    });
    getResearcherBarGraphData().catch((e) => {
      console.log(e);
    });
    getPatents().catch((e) => {
      console.log(e);
    });
  }, []);

  useEffect(() => {
    let funding = 0
    for(let i = 0; i<grantData.length; i++){
      funding += grantData[i].amount;
    }
    set_funding((funding.toLocaleString()))
  }, [grantData]);

  function showOverviewFunc() {
    setShowOverview(true);
    setShowAreasOfInterest(false);
    setShowPublications(false);
    setNumberOfPublicationsToShow(2);
    setincreasePublicationListBy(5);
    setShowSimilarResearchers(false);
    setShowGrants(false);
    setShowPatents(false);
    setShowFullGraph(false);
    setShowResearchersWithSimilarKeyword(false);
    setNavButtonSelected("Overview");
  }

  function showAreasOfInterestFunc() {
    setShowOverview(false);
    setShowAreasOfInterest(true);
    setShowPublications(false);
    setNumberOfPublicationsToShow(2);
    setincreasePublicationListBy(5);
    setShowSimilarResearchers(false);
    setShowGrants(false);
    setShowPatents(false);
    setShowFullGraph(false);
    setShowResearchersWithSimilarKeyword(false);
    setNavButtonSelected("Areas of Interest");
  }

  function showPublicationsFunc() {
    setShowOverview(false);
    setShowAreasOfInterest(false);
    setShowPublications(true);
    setShowSimilarResearchers(false);
    setShowGrants(false);
    setShowPatents(false);
    setShowFullGraph(false);
    setShowResearchersWithSimilarKeyword(false);
    setNavButtonSelected("Publications");
  }

  function showSimilarResearchersFunc() {
    setShowOverview(false);
    setShowAreasOfInterest(false);
    setShowPublications(false);
    setShowSimilarResearchers(true);
    setShowGrants(false);
    setShowPatents(false);
    setNumberOfPublicationsToShow(2);
    setincreasePublicationListBy(5);
    setShowFullGraph(false);
    setShowResearchersWithSimilarKeyword(false);
  }

  function showGrantsFunction() {
    setShowOverview(false);
    setShowAreasOfInterest(false);
    setShowPublications(false);
    setShowSimilarResearchers(false);
    setShowGrants(true);
    setShowPatents(false);
    setNumberOfPublicationsToShow(2);
    setincreasePublicationListBy(5);
    setShowFullGraph(false);
    setShowResearchersWithSimilarKeyword(false);
    setNavButtonSelected("Grants");
  }

  function showPatentsFunction() {
    setShowOverview(false);
    setShowAreasOfInterest(false);
    setShowPublications(false);
    setShowSimilarResearchers(false);
    setShowGrants(false);
    setShowPatents(true);
    setNumberOfPublicationsToShow(2);
    setincreasePublicationListBy(5);
    setShowFullGraph(false);
    setShowResearchersWithSimilarKeyword(false);
    setNavButtonSelected("Patents");
  }

  function showResearchersWithSimlarKeyword(keyWord) {
    setShowOverview(false);
    setShowAreasOfInterest(false);
    setShowPublications(false);
    setShowSimilarResearchers(false);
    setShowGrants(false);
    setShowPatents(false);
    setNumberOfPublicationsToShow(2);
    setincreasePublicationListBy(5);
    setShowFullGraph(false);
    setShowResearchersWithSimilarKeyword(true);
    setKeywordToSearchFor(keyWord);
    getSimilarResearcherBasedOnKeyword(keyWord);
  }

  const getSimilarResearcherBasedOnKeyword = async (keyWord) => {
    const searchResults = await API.graphql({
      query: otherResearchersWithKeyword,
      variables: {
        keyword: keyWord
      },
    });
    // console.log(keyWord)
    let results = searchResults.data.otherResearchersWithKeyword;
    // console.log(results);
    for(let i = 0; i<results.length; i++) {
      //Remove the researcher the keyword came from
      if(results[i].researcher_id == researcherId) {
        // console.log("removed researcher you got keyword from");
        results.splice(i, 1);
        break;
      }
    }
    setResearchersWithClickedKeyword(results);
  };
  
  return (
    <Box>
      {!pageLoaded && <LoadingWheel />}
      {pageLoaded && (
        <Grid container>
          <ResearcherInfo
            researcher_information={{
              preferred_name,
              prime_department,
              prime_faculty,
              email,
              phone_number,
              office,
              scopusId,
              lastUpdatedAt,
              rank,
            }}
          />
          <ResearcherHighlights
            showFullGraph={showFullGraph}
            setShowFullGraph={setShowFullGraph}
            preferred_name={preferred_name}
            barGraphData={{
              barGraphLastFiveYears: barGraphLastFiveYears,
              publicationsPerYear: publicationsPerYear,
            }}
            researcher_information={{ num_publications, h_index, funding }}
          />
          {showFullGraph && (
            <Paper
              sx={{ p: "1%", width: "100%", borderBottom: "0px" }}
              square={true}
              elevation={0}
              variant="outlined"
            >
              <PublicationBarGraph
                width={"100%"}
                preferred_name={preferred_name}
                barGraphData={{
                  barGraphLastFiveYears: barGraphLastAllYears,
                  publicationsPerYear: publicationsAllYears,
                }}
              ></PublicationBarGraph>
            </Paper>
          )}
          <ResearchProfileNavigation
            researcher_information={{ first_name, last_name }}
            onClickFunctions={{
              showOverviewFunc,
              showAreasOfInterestFunc,
              showPublicationsFunc,
              showGrantsFunction,
              showPatentsFunction,
            }}
            navButtonSelected={navButtonSelected}
            dataLength={{grants: grantData.length, patents: researcherPatents.length}}
          />
          {showOverview && (
            <Grid container>
              <Grid item xs={12}>
                <Paper
                  square={true}
                  elevation={0}
                  sx={{ borderTop: "0px" }}
                  variant="outlined"
                >
                  <AreasOfInterest
                    AreasOfInterestTabOpened={showAreasOfInterest}
                    numberOfSimilarResearchers={similarResearchersArray.length}
                    areasOfInterest={sortedAreasOfInterest}
                    showResearchersWithSimlarKeyword={showResearchersWithSimlarKeyword}
                    onClickFunctions={{
                      showAreasOfInterestFunc,
                      showSimilarResearchersFunc,
                    }}
                  />
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper square={true} elevation={0} variant="outlined">
                  <Publications
                    inPublicationPage={false}
                    stateVariables={{
                      numberOfPublicationsToShow,
                      numberOfPublications,
                      increasePublicationListBy,
                      descendingPublicationListByCitation,
                      ascendingPublicationListByCitation,
                      descendingPublicationListByYear,
                      ascendingPublicationListByYear,
                      descendingPublicationListByTitle,
                      ascendingPublicationListByTitle,
                    }}
                    stateFunctions={{
                      setNumberOfPublicationsToShow,
                      setincreasePublicationListBy,
                    }}
                  />
                  <Box textAlign="center">
                    <Button
                      onClick={showPublicationsFunc}
                      sx={{
                        m: 1,
                        border: "2px solid Black",
                        color: "black",
                        backgroundColor: "white",
                      }}
                    >
                      View All Publications
                    </Button>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper square={true} elevation={0} variant="outlined">
                    <GrantInformation 
                      grantData={grantData} 
                      tabOpened={showGrants} 
                      initialNumberOfRows={2}
                      searchYet={true}
                    />
                    <Box textAlign="center">
                      {/* <Button
                        onClick={showGrantsFunction}
                        sx={{
                          m: 1,
                          border: "2px solid Black",
                          color: "black",
                          backgroundColor: "white",
                        }}
                      >
                        View All Grants
                      </Button> */}
                    </Box>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper square={true} elevation={0} variant="outlined">
                  <PatentInformation  
                    researcherPatents={researcherPatents} 
                    initialNumberOfRows={2}
                    searchYet={true}
                  />
                  <Box textAlign="center">
                      {/* <Button
                        onClick={showPatentsFunction}
                        sx={{
                          m: 1,
                          border: "2px solid Black",
                          color: "black",
                          backgroundColor: "white",
                        }}
                      >
                        View All Patents
                      </Button> */}
                    </Box>
                </Paper>
              </Grid>
            </Grid>
          )}
          {showAreasOfInterest && (
            <AreasOfInterest
              AreasOfInterestTabOpened={showAreasOfInterest}
              numberOfSimilarResearchers={similarResearchersArray.length}
              areasOfInterest={sortedAreasOfInterest}
              showResearchersWithSimlarKeyword={showResearchersWithSimlarKeyword}
              onClickFunctions={{
                showAreasOfInterestFunc,
                showSimilarResearchersFunc,
              }}
            />
          )}
          {showPublications && (
            <Grid item xs={12}>
              <Paper square={true} elevation={0} variant="outlined">
                <Publications
                  inPublicationPage={true}
                  stateVariables={{
                    numberOfPublicationsToShow,
                    numberOfPublications,
                    increasePublicationListBy,
                    descendingPublicationListByCitation,
                    ascendingPublicationListByCitation,
                    descendingPublicationListByYear,
                    ascendingPublicationListByYear,
                    descendingPublicationListByTitle,
                    ascendingPublicationListByTitle,
                  }}
                  stateFunctions={{
                    setNumberOfPublicationsToShow,
                    setincreasePublicationListBy,
                  }}
                />
              </Paper>
            </Grid>
          )}
          {showSimilarResearchers && (
            <SimilarResearchers
              researchSearchResults={similarResearchersArray}
            />
          )}
          {showGrants && (
            <GrantInformation 
              grantData={grantData} 
              tabOpened={showGrants} 
              initialNumberOfRows={25}
              searchYet={true}
            />
          )}
          {showPatents && (
            <Grid item xs={12}>
            <PatentInformation 
              tabOpened={showPatents} 
              researcherPatents={researcherPatents} 
              initialNumberOfRows={2}
              searchYet={true}
            />
            </Grid>
          )}
          {showResearchersWithSimilarKeyword && (
            <ResearcherSearchResultsComponent
              searchYet={true}
              researchSearchResults={researchersWithClickedKeyword}
              researcherSearchResultPage={researcherSearchResultPage}
              setResearcherSearchResultPage={setResearcherSearchResultPage}
              //resultTitle={"Other researchers with the Keyword: "+keywordToSearchFor}
              errorTitle={"No Other Researchers with the keyword: "+keywordToSearchFor}
              keywordToSearchFor={keywordToSearchFor}
            />
          )}
        </Grid>
      )}
    </Box>
  );
}
