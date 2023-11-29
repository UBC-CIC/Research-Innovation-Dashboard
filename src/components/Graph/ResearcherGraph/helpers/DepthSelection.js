import React, { useState, useEffect } from "react";
import { GetSigma } from "./GraphEvents";
import {ToggleButton,ToggleButtonGroup} from "@mui/material"


const DepthSelection = ({nodeId}) =>{

    const [selectedDepth, setSelectedDepth] = useState(1);
  
    useEffect(() => {
      if(nodeId) {
        updateGraph(nodeId)
      }
    }, [selectedDepth])
    const updateGraph = (nodeId) =>{
      const sigma = GetSigma();
      const graph = sigma.getGraph();
      const [nodeIDs,firstEdgeIDs,secondEdgeIDs,thirdEdgeIDs] = getNeighborhood(graph, nodeId, selectedDepth);
      
      sigma.setSetting("nodeReducer", (node, data) => {
        return nodeIDs.has(node)
          ? { ...data,zIndex:1 }
          : { ...data, label: "",zIndex: 0, hidden:true };
      });
      sigma.setSetting("edgeReducer", (edge, data) => {
        if(firstEdgeIDs.has(edge)){
          return { ...data, size: data.size, color: "#585858"}
        }
        else if(secondEdgeIDs.has(edge)){
          return { ...data, size: data.size, color: "#8A8A8A"}
        }
        else if(thirdEdgeIDs.has(edge)){
          return { ...data, size: data.size, color: "#BCBCBC"}
        }
        else{
          return { ...data, hidden: true };
        }
      });
    } 
    const getNeighborhood = (graph, centerNode, depth) => {
      let neighborhoodNodes = new Set([centerNode])
      let firstEdges = new Set([])
      let secondEdges = new Set([])
      let thirdEdges = new Set([])
      graph.forEachNeighbor(centerNode,(firstNeighbor,attributes)=>{
        neighborhoodNodes.add(firstNeighbor)
        firstEdges.add(graph.edge(centerNode,firstNeighbor))
        if(depth==1){
          return [neighborhoodNodes,firstEdges,secondEdges,thirdEdges];
        }
        graph.forEachNeighbor(firstNeighbor,(secondNeighbor,attributes)=>{
          neighborhoodNodes.add(secondNeighbor)
          secondEdges.add(graph.edge(firstNeighbor,secondNeighbor))
          if(depth==2){
            return [neighborhoodNodes,firstEdges,secondEdges,thirdEdges];
          }
          graph.forEachNeighbor(secondNeighbor,(thirdNeighbor,attributes)=>{
            neighborhoodNodes.add(thirdNeighbor)
            thirdEdges.add(graph.edge(secondNeighbor,thirdNeighbor))
              return [neighborhoodNodes,firstEdges,secondEdges,thirdEdges];
          })
        })
      })
      return [neighborhoodNodes,firstEdges,secondEdges,thirdEdges];
    }
  
    const handleSelectedDepth = (event, newValue) =>{
      if (newValue !== null) {
        setSelectedDepth(newValue);
      }
    }
    return(
      <ToggleButtonGroup 
              value={selectedDepth}
              exclusive
              onChange={handleSelectedDepth}
              size="small"
          >
            <ToggleButton value={1}>
              1<sup>st</sup>
            </ToggleButton>
            <ToggleButton value={2}>
              2<sup>nd</sup>
            </ToggleButton>
            <ToggleButton value={3}>
              3<sup>rd</sup>
            </ToggleButton>
          </ToggleButtonGroup>
    );
  }

 export default DepthSelection
  