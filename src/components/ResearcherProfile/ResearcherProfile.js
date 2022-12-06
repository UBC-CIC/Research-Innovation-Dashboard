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
} from "../../graphql/queries";

Amplify.configure(awsmobile);
Auth.configure(awsmobile);

export default function Researcher_profile_overview() {
  const { scopusId } = useParams();

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

  const getAllPublications = async () => {
    const dataSortedByCitation = await API.graphql({
      query: getResearcherPubsByCitations,
      variables: { id: scopusId },
    });
    const dataSortedByYear = await API.graphql({
      query: getResearcherPubsByYear,
      variables: { id: scopusId },
    });
    const dataSortedByTitle = await API.graphql({
      query: getResearcherPubsByTitle,
      variables: { id: scopusId },
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
      };
      descendingPublicationsTitle.push(publicationTitle);
      ascendingPublicationsTitle.unshift(publicationTitle);
    }

    setNumberOfPublications(descendingPublicationsCitation.length);

    const result = await API.graphql({
      query: similarResearchers,
      variables: {
        scopus_id: scopusId,
      },
    });

    setDescendingPublicationListByCitation(descendingPublicationsCitation);
    setAscendingPublicationListByCitation(ascendingPublicationsCitation);

    setDescendingPublicationListByYear(descendingPublicationsYear);
    setAscendingPublicationListByYear(ascendingPublicationsYear);

    setDescendingPublicationListByTitle(descendingPublicationsTitle);
    setAscendingPublicationListByTitle(ascendingPublicationsTitle);

    const grantResult = await API.graphql({
      query: getResearcherGrants,
      variables: {
        id: scopusId,
      },
    });



    console.log(grantResult.data.getResearcherGrants)
    setGrantData(grantResult.data.getResearcherGrants);
    setPageLoaded(true);
  };

  const getResearcherGeneralInformation = async () => {
    const researcher_data_response = await API.graphql({
      query: getResearcherFull,
      variables: { id: scopusId },
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

    set_num_licensed_patents(0);

    const result = await API.graphql({
      query: similarResearchers,
      variables: {
        scopus_id: scopusId,
      },
    });

    setSimilarResearchersArray(result.data.similarResearchers);

    // create weighted list of keywords
    let keywordHashmap = new Map();
    let keyWords = researcher_data.keywords.split(", ");

    for (let i = 0; i < keyWords.length; i++) {
      if (keywordHashmap.get(keyWords[i])) {
        keywordHashmap.set(keyWords[i], keywordHashmap.get(keyWords[i]) + 1);
      } else {
        keywordHashmap.set(keyWords[i], 1);
      }
    }

    let sortedKeywordHashmap = [...keywordHashmap].sort((a, b) => b[1] - a[1]);

    let sortedAreas = [];

    for (let i = 0; i < sortedKeywordHashmap.length; i++) {
      sortedAreas.push(sortedKeywordHashmap[i][0]);
    }
    // save weighted list of keywords to state variable
    setSortedAreasOfInterest(sortedAreas);
  };
  const getResearcherBarGraphData = async () => {
    const bar_graph_data_response = await API.graphql({
      query: getNumberOfResearcherPubsLastFiveYears,
      variables: { id: scopusId },
    });
    const bar_graph_data_response_all_years = await API.graphql({
      query: getNumberOfResearcherPubsAllYears,
      variables: { id: scopusId },
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
  }, []);

  useEffect(() => {
    let funding = 0
    for(let i = 0; i<grantData.length; i++){
      funding += grantData[i].amount;
    }
    set_funding((funding.toLocaleString()))
    // console.log(funding);
  }, [grantData]);

  function showOverviewFunc() {
    setShowOverview(true);
    setShowAreasOfInterest(false);
    setShowPublications(false);
    setNumberOfPublicationsToShow(2);
    setincreasePublicationListBy(5);
    setShowSimilarResearchers(false);
    setShowGrants(false);
  }

  function showAreasOfInterestFunc() {
    setShowOverview(false);
    setShowAreasOfInterest(true);
    setShowPublications(false);
    setNumberOfPublicationsToShow(2);
    setincreasePublicationListBy(5);
    setShowSimilarResearchers(false);
    setShowGrants(false);
  }

  function showPublicationsFunc() {
    setShowOverview(false);
    setShowAreasOfInterest(false);
    setShowPublications(true);
    setShowSimilarResearchers(false);
    setShowGrants(false);
  }

  function showSimilarResearchersFunc() {
    setShowOverview(false);
    setShowAreasOfInterest(false);
    setShowPublications(false);
    setShowSimilarResearchers(true);
    setShowGrants(false);
    setNumberOfPublicationsToShow(2);
    setincreasePublicationListBy(5);
  }

  function showGrantsFunction() {
    setShowOverview(false);
    setShowAreasOfInterest(false);
    setShowPublications(false);
    setShowSimilarResearchers(false);
    setShowGrants(true);
    setNumberOfPublicationsToShow(2);
    setincreasePublicationListBy(5);
  }

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
            }}
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
                    <GrantInformation grantData={grantData} tabOpened={showGrants} initialNumberOfRows={2}/>
                    <Box textAlign="center">
                    <Button
                      onClick={showGrantsFunction}
                      sx={{
                        m: 1,
                        border: "2px solid Black",
                        color: "black",
                        backgroundColor: "white",
                      }}
                    >
                      View All Grants
                    </Button>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper square={true} elevation={0} variant="outlined">
                  <IntellectualProperty
                    researcher_information={{
                      num_patents_filed,
                      num_licensed_patents,
                    }}
                  />
                </Paper>
              </Grid>
            </Grid>
          )}
          {showAreasOfInterest && (
            <AreasOfInterest
              AreasOfInterestTabOpened={showAreasOfInterest}
              numberOfSimilarResearchers={similarResearchersArray.length}
              areasOfInterest={sortedAreasOfInterest}
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
            <GrantInformation grantData={grantData} tabOpened={showGrants} initialNumberOfRows={25}/>
          )}
        </Grid>
      )}
    </Box>
  );
}
