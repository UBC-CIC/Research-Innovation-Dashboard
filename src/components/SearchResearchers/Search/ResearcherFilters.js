import React, { useEffect, useState } from "react";
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
}) => {
  const [departmentOptions, setDepartmentOptions] = useState();
  const [facultyOptions, setFacultyOptions] = useState();
  const [openDepartmentFiltersDialog, setOpenDepartmentFiltersDialog] = useState(false);
  const [openFacultyFiltersDialog, setOpenFacultyFiltersDialog] = useState(false);

  const handleClose = () => {
    setOpenDepartmentFiltersDialog(false);
    setOpenFacultyFiltersDialog(false);
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
      setDepartmentOptions(allDepartments);
      setFacultyOptions(allFaculties);
    };
    getFilterOptions();
  }, []);

  const handleCheckDepartment = (e, department) => {
    if (e.target.checked) {
      setSelectedDeparments((prev) => [...prev, department]);
    } else {
      setSelectedDeparments(
        selectedDepartments.filter(
          (selectedDepartment) => selectedDepartment !== department
        )
      );
    }
  };

  const handleCheckFaculty = (e, faculty) => {
    if (e.target.checked) {
      setSelectedFaculties((prev) => [...prev, faculty]);
    } else {
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
          sx={{ color: "#0055B7", justifyContent: "flex-start" }}
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
              .slice(0, 5)
              .map((faculty, index) => (
                <FormControlLabel
                  key={index}
                  control={<Checkbox />}
                  checked={selectedFaculties.includes(faculty)}
                  label={<Typography variant="body2">{faculty}</Typography>}
                  onChange={(e) => handleCheckFaculty(e, faculty)}
                />
              ))}
        </FormGroup>
        <Button
          onClick={() => setOpenFacultyFiltersDialog(true)}
          sx={{ color: "#0055B7", justifyContent: "flex-start" }}
        >
          Show All
        </Button>
      </Box>
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", ml: "1em" }}>
      <Typography variant="h6">Filter for Researchers:</Typography>
      <Typography sx={{ my: "1em", color: "#0055B7" }}>Department</Typography>
      {renderDepartmentOptions()}
      <Typography sx={{ my: "1em", color: "#0055B7" }}>Faculty</Typography>
      {renderFacultyOptions()}
      <DepartmentFiltersDialog
        open={openDepartmentFiltersDialog}
        handleClose={handleClose}
        allDepartments={departmentOptions}
        selectedDepartments={selectedDepartments}
        handleCheckDepartment={handleCheckDepartment}
      />
      <FacultyFiltersDialog
        open={openFacultyFiltersDialog}
        handleClose={handleClose}
        allFaculties={facultyOptions}
        selectedFaculties={selectedFaculties}
        handleCheckFaculty={handleCheckFaculty}
      />
    </Box>
  );
};

export default ResearcherFilters;
