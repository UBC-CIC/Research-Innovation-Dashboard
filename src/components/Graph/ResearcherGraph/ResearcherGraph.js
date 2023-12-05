import React, { useState, useEffect } from "react";
import "@react-sigma/core/lib/react-sigma.min.css";
import {
  SigmaContainer,
  ControlsContainer,
  ZoomControl,
  FullScreenControl,
} from "@react-sigma/core";
import {
  Container,
  Box,
  Card,
  Grid,
  IconButton,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import "./ResearcherGraph.css";
import {GraphEvents} from "./helpers/GraphEvents";
import Graph from "graphology";
import {random } from 'graphology-layout';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import CircularProgress from '@mui/material/CircularProgress';
import Amplify from "@aws-amplify/core";
import { Auth } from "@aws-amplify/auth";
import awsmobile from "../../../aws-exports";
import { API } from "aws-amplify";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import 'katex/dist/katex.min.css'
import Latex from 'react-latex-next'
import {FacultyFiltersDialog,COLOR_OBJECT} from "../FacultyFiltersDialog";
import  DepthSelection from "./helpers/DepthSelection";

import {
  getResearcherForGraph,
  getSharedPublications,
  getSimilarResearchers,
} from "../../../graphql/queries";

Amplify.configure(awsmobile);
Auth.configure(awsmobile);

const ResearcherGraph = (props) => {
  const [graph, setGraph] = useState(null);

  const [selectedResearcher, setSelectedResearcher] = useState(null);
  const [similarResearchers, setSimilarResearchers] = useState(null);

  const [edgeResearcherOne, setEdgeResearcherOne] = useState(null);
  const [edgeResearcherTwo, setEdgeResearcherTwo] = useState(null);
  const [sharedPublications, setSharedPublications] = useState([]);


  const [graphState, setGraphState ] = useState("loading")
  const [tempGraph, setTempGraph ] = useState(null)
  const [alertOpen, setAlertOpen] = React.useState(false);
  
  useEffect(() => {
    if(props.researcherNodes ===null || props.graphEdges === null){
      setGraphState("loading");
    }
    //if there are no nodes found, no graph is not displayed
    else if(!props.researcherNodes.length){
      setGraphState("empty");
    } 
    else{
      switch(props.graphProgress){
        case 20:
          const jsonGraph = {
            attributes:{},
            nodes: props.researcherNodes,
            edges: props.graphEdges,
          }
    
          const graph = Graph.from(jsonGraph)
          graph.forEachNode((key,attributes)=>{
            const numOfNeighbors = graph.neighbors(key).length
            const size = 3-20/(numOfNeighbors+9)
    
            if(size>0){
              graph.setNodeAttribute(key,'size',size)
            }
          })
          
          setTempGraph(graph)
          props.setGraphProgress(30)
        break;
        case(30):
          random.assign(tempGraph); //assigns each node a random x,y value between [0,1]
          props.setGraphProgress(40)
        break;
        case(40):
        forceAtlas2.assign(tempGraph, {iterations: 20});
        props.setGraphProgress(50)
        break;
        case(50):
        forceAtlas2.assign(tempGraph, {iterations: 20});
        props.setGraphProgress(60)
        break;
        case(60):
        forceAtlas2.assign(tempGraph, {iterations: 20});
        props.setGraphProgress(70)
        break;
        case(70):
        forceAtlas2.assign(tempGraph, {iterations: 20});
        props.setGraphProgress(80)
        break;
        case(80):
        forceAtlas2.assign(tempGraph, {iterations: 20});
        props.setGraphProgress(90)
        break;
        case(90):
        setGraph(tempGraph)
        setGraphState("finished");
        break;
      }   
    }
  }, [props.researcherNodes, props.graphEdges, props.graphProgress])

  //On change of the selected node get information on the researcher
  useEffect(() => {
    if(graphState === "finished" && props.selectedNode && props.researcherNodes){
      // Check if props.selectedNode exists within props.researcherNodes.key
      const selectedNodeExists = props.researcherNodes.some(node => node.key === props.selectedNode);

        if(selectedNodeExists) {
          getResearcherFunction(selectedResearcher);
        } else{
          props.setSelectedNode(null);
          setSelectedResearcher(null);
          setSimilarResearchers(null);
          setAlertOpen(true);
        }
    }
  }, [props.selectedNode, graphState])

  useEffect(() => {
    if(props.selectedEdge) {
      getEdgeInformation();
    }else{
      setEdgeResearcherOne(null);
      setEdgeResearcherTwo(null);
      setSharedPublications([]);
    }
  }, [props.selectedEdge])

  const getResearcherFunction = async () => {
    let result = await API.graphql({
      query: getResearcherForGraph,
      variables: {"id": props.selectedNode}
    });
    let researcher = result.data.getResearcherForGraph;
    setSelectedResearcher(researcher);

    result = await API.graphql({
      query: getSimilarResearchers,
      variables: {"researcher_id": researcher.id}
    });
    let similarResearchers = result.data.getSimilarResearchers;
    setSimilarResearchers(similarResearchers);
  }

  const getEdgeInformation = async () => {
    let researchersIds = props.selectedEdge.split("&&");
    let researcherOneId = researchersIds[0];
    let researcherTwoId = researchersIds[1];

    //Get the researcher information

    let result = await API.graphql({
      query: getResearcherForGraph,
      variables: {"id": researcherOneId}
    });
    let researcher = result.data.getResearcherForGraph;
    setEdgeResearcherOne(researcher);

    result = await API.graphql({
      query: getResearcherForGraph,
      variables: {"id": researcherTwoId}
    });
    researcher = result.data.getResearcherForGraph;
    setEdgeResearcherTwo(researcher);

    result = await API.graphql({
      query: getSharedPublications,
      variables: {"id1": researcherOneId, "id2": researcherTwoId}
    });
    let publications = result.data.getSharedPublications;
    setSharedPublications(publications);
  }

  const handleCheckFaculty = (e, faculty) => {
    if (e.target.checked) {
      props.setSelectedFaculties((prev) => [...prev, faculty]);
    } else {
      props.setSelectedFaculties(
        props.selectedFaculties.filter(
          (selectedFaculty) => selectedFaculty !== faculty
        )
      );
    }
  };
  
  const applyFilters = () => {
    props.setCurrentlyAppliedKeywordFilter(props.keywordFilter)
    props.setCurrentlyAppliedFaculties(props.selectedFaculties);
    props.setOpenFacultyFiltersDialog(false);
  }

  const handleClose = () => {
    props.setOpenFacultyFiltersDialog(false);
    props.setSelectedFaculties(props.currentlyAppliedFaculties);
    props.setKeywordFilter(props.currentlyAppliedKeywordFilter);
  };

  return (
    <div className="Researcher-Graph">
      <Grid container spacing={0} direction="row">
        <SidePanel
          selectedNode={props.selectedNode} selectedEdge={props.selectedEdge}
          facultyOptions={props.facultyOptions} currentlyAppliedFaculties={props.currentlyAppliedFaculties}
          selectedResearcher={selectedResearcher} similarResearchers={similarResearchers} 
          edgeResearcherOne={edgeResearcherOne} edgeResearcherTwo={edgeResearcherTwo} sharedPublications={sharedPublications}
        />
        <FacultyFiltersDialog
                open={props.openFacultyFiltersDialog}
                handleClose={handleClose}
                allFaculties={props.facultyOptions}
                selectedFaculties={props.selectedFaculties}
                handleCheckFaculty={handleCheckFaculty}
                applyFilters={applyFilters}
                keywordFilter={props.keywordFilter}
                setKeywordFilter={props.setKeywordFilter}
              />
        <Grid item xs={8} id='graph'>
          <Container maxWidth={false}>
            { graphState === "finished" ? (
            <Card id="researcher-graph-card">
              <SigmaContainer
                graph={graph}
                style={{ height: "75vh" }}
                settings={{
                  zIndex: true,
                  labelRenderedSizeThreshold: 7, //the size at which the the nodes label show up
                }}
              >
                <GraphEvents
                  firstClickedNode={props.selectedNode}
                  setFirstClickedNode={props.setSelectedNode}
                  selectedEdge={props.selectedEdge}
                  setSelectedEdge={props.setSelectedEdge}
                />
                <ControlsContainer position={"bottom-right"}>
                  <ZoomControl />
                  <FullScreenControl />
                </ControlsContainer>
              </SigmaContainer>
            </Card>
            ) : <GraphStatusMessage state={graphState} progress={props.graphProgress}/>}
          </Container>
        </Grid>
      </Grid>
      {/* Alert Dialog */}
      <Dialog open={alertOpen} onClose={() => setAlertOpen(false)}>
        <DialogTitle>Alert</DialogTitle>
        <DialogContent>
          <div>The researcher could not be found in the graph.</div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertOpen(false)} color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

const GraphStatusMessage = ({state, progress}) =>{
  const CircularProgressWithLabel = ({progress}) => { //from mui material-ui 
    return (
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress variant="determinate" value={progress} />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="caption" component="div" color="text.secondary">
            {`${Math.round(progress)}%`}
          </Typography>
        </Box>
      </Box>
    );
  }
  return (
    state==="loading"? ( <center>
      <CircularProgressWithLabel progress={progress}/>
      <Typography gutterBottom variant="h5" color="#002145" margin="0px" component="div">
            <b>Graph loading in progress...</b> 
          </Typography>
          <Typography gutterBottom variant="h6" color="#002145" margin="0px" component="div">
            This might take a moment
          </Typography>
    </center>
  ):
  <center> {/** else the graph state=="empty" */}
      <Typography gutterBottom variant="h5" color="#002145" margin="0px" component="div">
            <b>No results found</b> 
          </Typography>
      <Typography gutterBottom variant="h6" color="#002145" margin="0px" component="div">
        Change the graph's filters to view more data.
      </Typography>
    </center>
  );
}

const SidePanel = ({selectedNode, selectedEdge, facultyOptions, currentlyAppliedFaculties, selectedResearcher, similarResearchers, edgeResearcherOne, edgeResearcherTwo, sharedPublications}) =>{
  
  const GraphLegend = ({allFaculties, filteredFaculties}) => {

    const FacultyLabel = ({faculty}) => (
      <Typography variant="body2">
        <IconButton disabled><FiberManualRecordIcon style={{ color: COLOR_OBJECT[faculty] }} /></IconButton>
        {faculty}
      </Typography>
    )

    return(
      <Accordion disableGutters id="accordion">
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body1">Graph Legend</Typography>
        </AccordionSummary>
        <AccordionDetails id="accordion-details">
          <Card id="graph-legend">
            {filteredFaculties.length==0 ? //When no faculty filters selected
            allFaculties.map((faculty,index) => ( //display all faculties' labels
                <FacultyLabel key={index} faculty={faculty}/>
            )): 
            filteredFaculties.map((faculty,index) => ( //show only the applied filtered faculties' labels
                <FacultyLabel key={index} faculty={faculty}/>
            ))}
          </Card>
        </AccordionDetails>
      </Accordion>
    );
  }

  const PotentialConnections = ({selectedResearcher,similarResearchers}) => {
    const MAX_POTENTIAL_CONNECTIONS = 5;
    const [accordionExpanded, setAccordionExpanded] = useState(false); 

    const ResearchersList = ()=>{
      const researchersCards = [];
      for(let i=0; i<Math.min(similarResearchers.length, MAX_POTENTIAL_CONNECTIONS); i++){
        const researcher = similarResearchers[i]
        researchersCards.push(
          <Card key={i}  id="researchers-list-card">
              <CardContent id="researchers-list-card-content">
                <Typography variant="body1" color="#002145">
                  <b>{researcher.firstName + " " + researcher.lastName}</b>
                </Typography>
                <Typography variant="body2" color="#404040">
                {researcher.faculty}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                 <b>Keywords shared ({researcher.sharedKeywords.length}):</b> {researcher.sharedKeywords.join(", ")}
                </Typography>
              </CardContent>
            </Card>
        )
      }
      return researchersCards;
    }

    return (
      <Accordion disableGutters expanded={accordionExpanded} onChange={()=>setAccordionExpanded(!accordionExpanded)} id="accordion">
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body1">Similar Researchers</Typography>
        </AccordionSummary>
        <AccordionDetails id="accordion-details">
          <Card id="accordion-details-card">
            <CardContent id="potential-connections-card-content">
          {similarResearchers && selectedResearcher?
            similarResearchers.length==0 ?
              <Typography variant="body2" color="text.secondary">No potential connections found.</Typography>
            :<>
              <Typography variant="caption" color="text.secondary">
                These researchers have not collaborated with {selectedResearcher.firstName + " " + selectedResearcher.lastName} but share similar research topics.
              </Typography>
              <ResearchersList/>
            </>
            
          :(<center><CircularProgress color="inherit" data-testid="progressSpinner" /></center>)}
          </CardContent>
          </Card>
        </AccordionDetails>
      </Accordion>
     
    );
  }

  const ResearcherInfo = ({researcher}) => {

    return (
      researcher ? (
        <>
          <Typography gutterBottom variant="h5" color="#002145" margin="0px" component="div">
            <b>{researcher.firstName + " " + researcher.lastName}</b>
          </Typography>
          <Typography variant="subtitle1" color="#002145">
            <b>{researcher.rank}</b>
          </Typography>
          <Typography variant="body2" color="#404040">
            {researcher.faculty}
          </Typography>
          <br/>
          <Typography variant="body2" color="#404040">
          <b>Department: </b>
            {researcher.department}
          </Typography>
          <Typography variant="body2" color="#404040">
          <b>Email: </b>
            {researcher.email}
          </Typography>
          <Typography variant="body2" color="#404040">
            <b>{"Scopus Id: "}</b>
            {researcher.id}
          </Typography>
          <br/>
          <Typography variant="subtitle2" color="#002145">
            <b>Change Levels of Connection</b>
          </Typography>
          <DepthSelection nodeId={researcher.id}/>
          <br/>
          <br/>
          <Typography variant="caption" color="text.secondary">
            Click on connected node to see information about how they
            are connected
          </Typography>
        </>
        ) : (<center><CircularProgress color="inherit" /></center>)
    );
  }

  const EdgeInfo = ({edgeResearcherOne, edgeResearcherTwo, sharedPublications }) =>{

      const publications = sharedPublications.map((publicationData, index) =>
      <div key={index} className="paper-link">
          <a href={publicationData.link} target="_blank" rel="noopener noreferrer">   
            <Latex>{publicationData.title}</Latex> 
            <OpenInNewIcon fontSize="inherit" />
          </a>
      </div>
    );

    return (
      edgeResearcherOne && edgeResearcherTwo && sharedPublications.length!=0 ? (
        <>
        <Typography gutterBottom variant="h5" color="#002145" margin="0px" component="div">
            <b>{edgeResearcherOne.firstName + " " + edgeResearcherOne.lastName + " &" }</b> 
          </Typography>
          <Typography gutterBottom variant="h5" color="#002145" margin="0px" component="div">
            <b> {edgeResearcherTwo.firstName + " " + edgeResearcherTwo.lastName}</b>
          </Typography>
          <br/>
          <Typography variant="subtitle1" margin="0px" color="#002145">
            <b>Shared Publications ({sharedPublications.length})</b> 
          </Typography>
          <Typography component={'div'} variant="body2" color="text.secondary">
            {publications}
          </Typography>
        </>
        ) : (<center><CircularProgress color="inherit" /></center>)
    );
  }

  const [detailsExpanded, setDetailsExpanded] = useState(true);  

  return(
    <Grid item xs={4} className="side-panel" id="sidePanel">
    <GraphLegend allFaculties={facultyOptions} filteredFaculties={currentlyAppliedFaculties}/>
    {selectedNode && !selectedEdge && ( /**when in nodeSelectionMode */
      <PotentialConnections {...{selectedResearcher, similarResearchers}}/>
    )}
    <Accordion disableGutters expanded={detailsExpanded} onChange={()=>setDetailsExpanded(!detailsExpanded)} id="accordion">
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="body1">Graph Details</Typography>
      </AccordionSummary>
      <AccordionDetails id="accordion-details">
        <Card id="accordion-details-card">
          <CardContent>
            {selectedNode && !selectedEdge &&  /**when in nodeSelectionMode */
              <ResearcherInfo researcher={selectedResearcher}/>
            }
            {selectedEdge && /**when in edgeSelectionMode */
             <EdgeInfo {...{edgeResearcherOne, edgeResearcherTwo, sharedPublications}}/>
            }
            {!selectedNode && /**when no node selected */
              <Typography variant="body2" color="text.secondary">
                Click on a node to view more information about the researcher
              </Typography>
            }
          </CardContent>
        </Card> 
      </AccordionDetails>
    </Accordion>
  </Grid>
  );
}

export {ResearcherGraph, GraphStatusMessage, SidePanel};
