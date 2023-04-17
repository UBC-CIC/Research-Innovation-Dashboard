import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Button,
} from "@mui/material";
import { API } from "aws-amplify";
import { getAllDepartments, getAllFaculty } from "../../../graphql/queries";
import DepartmentFiltersDialog from "./DepartmentFiltersDialog";
import FacultyFiltersDialog from "./FacultyFiltersDialog";

const ResearcherFilters = ({
  selectedDepartments,
  setSelectedDeparments,
  selectedFaculties,
  setSelectedFaculties,
  searchYet,
  openDepartmentFiltersDialog,
  setOpenDepartmentFiltersDialog,
  //currentFacultyOptions,
  //setCurrentFacultyOptions
}) => {
  const [departmentOptions, setDepartmentOptions] = useState();
  const [facultyOptions, setFacultyOptions] = useState();
  // const [openFacultyFiltersDialog, setOpenFacultyFiltersDialog] = useState(false);
  const [optionsToShow, setOptionsToShow] = useState(7)

  const OPTIONS_TO_SHOW = 7
  const INCR_OPTIONS_BY = 10

  const handleClose = () => {
    setOpenDepartmentFiltersDialog(false);
    //setOpenFacultyFiltersDialog(false);
  };
  
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
      const allDepartments = departmentRes.data.getAllDepartments;
      const allFaculties = facultyRes.data.getAllFaculty;
      //console.log(allFaculties)
      setDepartmentOptions(allDepartments);
      // create an initial list of json objects that contains the faculty and an integer
      // e.g. {'faculty': 'Faculty of Science', 'checked': 0} with 0 means unchecked and 1 means checked
      setFacultyOptions(allFaculties.map((item, index) => ({"faculty": item, "checked": 0})));
    };
    getFilterOptions();
  }, []);

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

      let facultyOptionsTemp = facultyOptions
      const currentIndex = facultyOptions.findIndex((obj) => obj["faculty"] === faculty);
      facultyOptionsTemp[currentIndex]["checked"] = 1
      //setFacultyOptions(facultyOptionsTemp);
      setFacultyOptions(facultyOptionsTemp)
      console.log(facultyOptionsTemp)

    } else {
      // unchecked
      setSelectedFaculties(
        selectedFaculties.filter(
          (selectedFaculty) => selectedFaculty !== faculty
        )
      );
        
      let facultyOptionsTemp = facultyOptions
      const currentIndex = facultyOptions.findIndex((obj) => obj["faculty"] === faculty);
      facultyOptionsTemp[currentIndex]["checked"] = 0
      //setFacultyOptions(facultyOptionsTemp);
      setFacultyOptions(facultyOptionsTemp)
      console.log(facultyOptionsTemp)
    }
    //console.log(selectedFaculties)
  };

  const renderDepartmentOptions = () => {
    return (
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <FormGroup>
          {departmentOptions &&
            departmentOptions
              .slice(0, 5)
              .map((department, index) => (
                <FormControlLabel
                  key={index}
                  control={<Checkbox />}
                  checked={selectedDepartments.includes(department)}
                  label={<Typography variant="body2">{department}</Typography>}
                  onChange={(e) => handleCheckDepartment(e, department)}
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
          {facultyOptions &&
            facultyOptions
              // sort the options based on descending checked value and then based on ascending alphabetical order
              //.sort((f1, f2) => f2['checked'] - f1['checked'] || f1['faculty'].localeCompare(f2['faculty']))
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
        {facultyOptions && (optionsToShow < facultyOptions.length) ? 
        (<Button
          //onClick={() => setOpenFacultyFiltersDialog(true)}
          onClick={() => setOptionsToShow(facultyOptions.length)}
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
      {renderFacultyOptions()}
      <Typography variant="h6" sx={{ my: "1em", color: "#666666" }}>{"Department (" + selectedDepartments.length + " selected)" }</Typography>
      {renderDepartmentOptions()}
      {/* <FacultyFiltersDialog
        open={openFacultyFiltersDialog}
        handleClose={handleClose}
        allFaculties={facultyOptions}
        selectedFaculties={selectedFaculties}
        handleCheckFaculty={handleCheckFaculty}
      /> */}
      <DepartmentFiltersDialog
        open={openDepartmentFiltersDialog}
        handleClose={handleClose}
        allDepartments={departmentOptions}
        selectedDepartments={selectedDepartments}
        handleCheckDepartment={handleCheckDepartment}
      />
    </Box>
  );
};

export default ResearcherFilters;
