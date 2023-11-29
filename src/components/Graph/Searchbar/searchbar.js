import { useState, useEffect } from "react";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import TextField from "@mui/material/TextField";
import Box from "@material-ui/core/Box";
import Stack from "@mui/material/Stack";
import { Button } from "@mui/material";
import Autocomplete from '@mui/material/Autocomplete';
import {GraphEvents, GetSigma, setNode} from "../ResearcherGraph/helpers/GraphEvents";
import "./searchbar.css"

export default function SearchBar(props) {
  const sigma = GetSigma();

  const ZoomOnNode = (node) => {
    setNode(node.id);
    let camera = sigma.getCamera();
    let zoom_ratio = 0.15;
    let zoom_factor = camera.ratio/zoom_ratio
    camera.x = node.x;
    camera.y = node.y;
    if (zoom_factor <= 1.5) {
      camera.ratio = 1.5
      zoom_factor = camera.ratio/zoom_ratio
    }
    camera.animatedZoom({duration: 200 * zoom_factor, factor: zoom_factor});
  }
  const ZoomToNode = (node) => {
    console.log("Moving Camera")
    let camera = sigma.getCamera();
    camera.animate(node, {duration: 500});
  }
  
  const SearchForNode = () => {
    if(props.searchQuery) {
      let node = sigma.getNodeDisplayData(props.searchQuery.id);
      if (node) {
        ZoomOnNode(node);
      }
      else {
        console.log("Could not find node")
      }
    }
  }

  useEffect(() => {
    SearchForNode();
  }, [props.searchQuery])

  return (
    <Box className="search-bar-box" component={Stack} direction="row">
      <Autocomplete
        autoComplete
        clearOnBlur={true}
        value={null}
        options={props.autoCompleteOptions}
        id="search-bar"
        className="text"
        
        renderInput={(params) => <TextField id="search-bar-text" {...params} label={props.text} />}
        
        onChange={(e,newInputValue) => {
          props.setSearchQuery(newInputValue);
        }}
        onKeyPress={(event) => { 
          if (event.key == "Enter") {SearchForNode()}
        }}
        size="small"
        sx={{ width: props.size }}
      />
      {/* <IconButton type="submit" aria-label="search" onClick={SearchForNode}>
        <SearchIcon style={{ fill: "grey" }} />
      </IconButton> */}
      <Button id="filter-graph-button" onClick={() => props.setOpenFacultyFiltersDialog(true)} variant="contained">Filter the Graph</Button>
  </Box>
  );
}

// Non Funtional
const clearSearchBar = () => {
  let searchBar = document.getElementById("search-bar");
  searchBar.value = null
  let searchBarText = document.getElementById("search-bar-text");
}

export {SearchBar};