import React, { useState, useEffect } from "react";
import '../../index.css';
import Grid from '@mui/material/Grid';
import {ResearcherGraph} from './ResearcherGraph/ResearcherGraph';
import Navbar from "./Navbar/navbar";
import {SearchBar} from "./Searchbar/searchbar"
import Tutorial from "./Tutorial/Tutorial";
import { useParams } from 'react-router-dom';

import Amplify from "@aws-amplify/core";
import { Auth } from "@aws-amplify/auth";
import awsmobile from "../../aws-exports";
import { API } from "aws-amplify";

import {
  getResearchers,
  getEdges,
  getAllFaculty,
} from "../../graphql/queries";

Amplify.configure(awsmobile);
Auth.configure(awsmobile);


export default function TheApp(props) {
  const { scopusId } = useParams();

  const [researcherNodes, setResearcherNodes] = useState(null);
  const [graphEdges, setGraphEdges] = useState(null);
  const [autoCompleteOptions, setAutoCompleteOptions] = useState([]);
  const [allFaculties, setAllFaculties] = useState([]);
  const [currentlyAppliedFaculties, setCurrentlyAppliedFaculties] = useState([]);
  const [currentlyAppliedKeywordFilter, setCurrentlyAppliedKeywordFilter] = useState("");
  const [keywordFilter, setKeywordFilter] = useState("");
  const [chosenFaculties, setChosenFaculties] = useState([]);
  const [openFacultyFiltersDialog, setOpenFacultyFiltersDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [run, setRun] = useState(false);
  const [graphProgress, setGraphProgress ] = useState(10)

  //On page load get the faculties
  useEffect(() => {
    getTheFaculties();
  }, [])

  //On page load and every time filters are changed re-make the graph
  useEffect(() => {
    changeGraph();
  }, [currentlyAppliedFaculties, currentlyAppliedKeywordFilter])

  const getGraph = async () => {
    try {

      /*const [researchers, edgesResult] = await Promise.all([
        API.graphql({
          query: getResearchers,
          variables: {"facultiesToFilterOn": currentlyAppliedFaculties, "keyword": keywordFilter.toLowerCase()},
        }),
        API.graphql({
          query: getEdges,
          variables: {"facultiesToFilterOn": currentlyAppliedFaculties, "keyword": keywordFilter.toLowerCase()},
        }),
      ]);*/

      const [researchers, edgesResult] = await Promise.all([
        (await fetch(`${process.env.REACT_APP_CLOUDFRONT_URL}nodes.json`)).json(),
        (await fetch(`${process.env.REACT_APP_CLOUDFRONT_URL}edges.json`)).json()
      ]);

      setResearcherNodes(researchers);
      setGraphEdges(edgesResult);
      setGraphProgress(20);
      setAutoCompleteOptions(Object.values(researchers).map(formatOptions));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const formatOptions = (entry) => {
    let retval = entry.attributes
    retval.id = entry.key
    return retval
  }

  const getTheFaculties = async () => {
    const getFaculties = await API.graphql({
      query: getAllFaculty,
    });
    setAllFaculties(getFaculties.data.getAllFaculty)
  }

  const changeGraph = () => {
    setGraphEdges(null);
    setResearcherNodes(null);
    setSelectedNode(null);
    setSelectedEdge(null);
    setGraphProgress(10)
    getGraph();
    setSelectedNode(scopusId);
  }

  function startTutorial() {
    setRun(true);
  }

  return (
    <Grid container spacing={2}>
      <Tutorial selectedNode={selectedNode} setSelectedNode={setSelectedNode}
                selectedEdge={selectedEdge} setSelectedEdge={setSelectedEdge}
                openFacultyFiltersDialog={openFacultyFiltersDialog}
                run={run} setRun={setRun}/>
      <Grid item xs={12}>
        <Navbar startTutorial={startTutorial}/>
      </Grid>
      <Grid id="search-bar-main" item xs={12}>
        <SearchBar text="Search Graph" size="100vh" setOpenFacultyFiltersDialog={setOpenFacultyFiltersDialog} 
        autoCompleteOptions={autoCompleteOptions} searchQuery={searchQuery} setSearchQuery={setSearchQuery}></SearchBar>
      </Grid>
      <Grid item xs={12}>
        <ResearcherGraph researcherNodes={researcherNodes}  
        graphEdges={graphEdges} facultyOptions={allFaculties}
        currentlyAppliedFaculties={currentlyAppliedFaculties} setCurrentlyAppliedFaculties={setCurrentlyAppliedFaculties}
        selectedFaculties={chosenFaculties} setSelectedFaculties={setChosenFaculties}
        changeGraph={changeGraph} openFacultyFiltersDialog={openFacultyFiltersDialog} setOpenFacultyFiltersDialog={setOpenFacultyFiltersDialog}
        keywordFilter={keywordFilter} setKeywordFilter={setKeywordFilter}
        currentlyAppliedKeywordFilter={currentlyAppliedKeywordFilter} setCurrentlyAppliedKeywordFilter={setCurrentlyAppliedKeywordFilter}
        selectedNode={selectedNode} setSelectedNode={setSelectedNode}
        selectedEdge={selectedEdge} setSelectedEdge={setSelectedEdge}
        graphProgress={graphProgress} setGraphProgress={setGraphProgress}
        />
      </Grid>
    </Grid>
  )
}