import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Button,
  IconButton
} from "@mui/material";
import { API } from "aws-amplify";
import { getAllDepartments, getAllFaculty } from "../../../graphql/queries";
import DepartmentFiltersDialog from "./DepartmentFiltersDialog";
import FacultyFiltersDialog from "./FacultyFiltersDialog";
import ClearIcon from '@mui/icons-material/Clear';

const ResearcherFilters = ({
  selectedDepartments,
  setSelectedDeparments,
  selectedFaculties,
  setSelectedFaculties,
  searchYet,
  openDepartmentFiltersDialog,
  setOpenDepartmentFiltersDialog,
  currentFacultyOptions,
  setCurrentFacultyOptions,
  currentDepartmentOptions,
  setCurrentDepartmentOptions
}) => {
  
  const [optionsToShow, setOptionsToShow] = useState(7)

  const OPTIONS_TO_SHOW = 7
  const INCR_OPTIONS_BY = 10

  const handleClose = () => {
    setOpenDepartmentFiltersDialog(false);
  };

  const handleCheckDepartment = (e, department) => {
    // when checked
    if (e.target.checked) {
      setSelectedDeparments((prev) => [...prev, department]);
    } else {
      // when unchecked
      setSelectedDeparments(
        selectedDepartments.filter(
          (selectedDepartment) => selectedDepartment !== department
        )
      );
    }
  };

  const handleCheckFaculty = (e, faculty) => {
    if (e.target.checked) {
      // checked
      setSelectedFaculties((prev) => {return [...prev, faculty]});
    } else {
      // unchecked
      setSelectedFaculties(
        selectedFaculties.filter(
          (selectedFaculty) => selectedFaculty !== faculty
        )
      );
    }
  };

  const renderDepartmentOptions = () => {
    return (
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <FormGroup>
          {currentDepartmentOptions &&
            currentDepartmentOptions
              // sort the options based on descending checked value and then based on ascending alphabetical order
              .sort((f1, f2) => f2['checked'] - f1['checked'] || f1['department'].localeCompare(f2['department']))
              .slice(0, 5)
              .map((department, index) => (
                <FormControlLabel
                  key={index}
                  control={<Checkbox />}
                  checked={selectedDepartments.includes(department['department'])}
                  label={<Typography variant="body2">{department['department']}</Typography>}
                  onChange={(e) => handleCheckDepartment(e, department['department'])}
                />
              ))}
        </FormGroup>
        <Button
          onClick={() => setOpenDepartmentFiltersDialog(true)}
          sx={{ color: "#666666", justifyContent: "flex-start" }}
        >
          Show All
        </Button>
      </Box>
    );
  };

  const renderFacultyOptions = () => {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        <FormGroup>
          {currentFacultyOptions &&
            currentFacultyOptions
              // sort the options based on descending checked value and then based on ascending alphabetical order
              .sort((f1, f2) => f2['checked'] - f1['checked'] || f1['faculty'].localeCompare(f2['faculty']))
              .slice(0, optionsToShow)
              .map((faculty, index) => (
                <FormControlLabel
                  key={index}
                  control={<Checkbox />}
                  checked={selectedFaculties.includes(faculty["faculty"])}
                  label={<Typography variant="body2">{faculty["faculty"]}</Typography>}
                  onChange={(e) => handleCheckFaculty(e, faculty["faculty"])}
                />
              ))}
        </FormGroup>
        {currentFacultyOptions && (optionsToShow < currentFacultyOptions.length) ? 
        (<Button
          //onClick={() => setOpenFacultyFiltersDialog(true)}
          onClick={() => setOptionsToShow(currentFacultyOptions.length)}
          sx={{ color: "#666666", justifyContent: "flex-start" }}
        >
          Show more
        </Button>) : 
        (<Button
          //onClick={() => setOpenFacultyFiltersDialog(true)}
          onClick={() => setOptionsToShow(OPTIONS_TO_SHOW)}
          sx={{ color: "#666666", justifyContent: "flex-start" }}
        >
          Show less
        </Button>)
        }
      </Box>
    );
  };

  return (searchYet &&
    <Box sx={{ display: "flex", flexDirection: "column", ml: "1em" }}>
      <Typography variant="h6" sx={{fontWeight: "bold"}}>Filters for Researchers:</Typography>
      <Typography variant="h6" sx={{ my: "1em", color: "#666666" }}>{"Faculty (" + selectedFaculties.length + " selected)"}</Typography>
      {(selectedFaculties.length > 0) && 
        (<Button onClick={() => setSelectedFaculties([])} sx={{justifyContent: "left", p: 0, pb: 1, color: "#666666"}}>
          Clear all filters {<ClearIcon sx={{pl: 1}}></ClearIcon>}
        </Button>)}
      {renderFacultyOptions()}
      <Typography variant="h6" sx={{ my: "1em", color: "#666666" }}>{"Department (" + selectedDepartments.length + " selected)" }</Typography>
      {(selectedDepartments.length > 0) && 
        (<Button onClick={() => setSelectedDeparments([])} sx={{justifyContent: "left", p: 0, pb: 1, color: "#666666"}}>
          Clear all filters {<ClearIcon sx={{pl: 1}}></ClearIcon>}
        </Button>)}
      {renderDepartmentOptions()}
      <DepartmentFiltersDialog
        open={openDepartmentFiltersDialog}
        handleClose={handleClose}
        allDepartments={currentDepartmentOptions.map((department) => department['department'])}
        selectedDepartments={selectedDepartments}
        handleCheckDepartment={handleCheckDepartment}
      />
    </Box>
  );
};

export default ResearcherFilters;
