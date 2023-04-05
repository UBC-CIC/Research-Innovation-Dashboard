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
import { getAllGrantAgencies } from "../../../graphql/queries";
import PatentFiltersDialog from "./PatentFiltersDialog";

const PatentFilters = ({
    selectedPatentClassification,
    setSelectedPatentClassification,
    searchYet
}) => {
  const [patentOptions, setPatentOptions] = useState([
    "Human necessities", 
    "Performing operations; transporting",
    "Chemistry; metallurgy",
    "Textiles; paper",
    "Fixed constructions",
    "Mechanical engineering; lighting; heating; weapons; blasting engines or pumps",
    "Physics",
    "Electricity",
    "General tagging of new technological developments; general tagging of cross-sectional technologies spanning over several sections of the IPC; technical subjects covered by former USPC cross-reference art collections [XRACs] and digests"
    ]);
  const [openPatentFiltersDialog, setOpenPatentFiltersDialog] = useState(false);

  const handleClose = () => {
    setOpenPatentFiltersDialog(false);
  };

  const handleCheckPatentClassifications = (e, department) => {
    if (e.target.checked) {
        setSelectedPatentClassification((prev) => [...prev, department]);
    } else {
        setSelectedPatentClassification(
            selectedPatentClassification.filter(
          (selectedDepartment) => selectedDepartment !== department
        )
      );
    }
  };

  const renderClassificationsOptions = () => {
    return (
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <FormGroup>
          {patentOptions &&
            patentOptions
              .slice(0, 5)
              .map((classification, index) => (
                <FormControlLabel
                  key={index}
                  control={<Checkbox />}
                  checked={selectedPatentClassification.includes(classification)}
                  label={<Typography variant="body2">{classification}</Typography>}
                  onChange={(e) => handleCheckPatentClassifications(e, classification)}
                />
              ))}
        </FormGroup>
        <Button
          onClick={() => setOpenPatentFiltersDialog(true)}
          sx={{ color: "#666666", justifyContent: "flex-start" }}
        >
          Show All
        </Button>
      </Box>
    );
  };

  return (searchYet &&
    <Box sx={{ display: "flex", flexDirection: "column", ml: "1em" }}>
      <Typography variant="h6" sx={{fontWeight: "bold"}}>Filters for Patents:</Typography>
      <Typography sx={{ my: "1em", color: "#666666", fontSize: 20}}>{"Patent Classifications (" + selectedPatentClassification.length + " selected)"}</Typography>
      {renderClassificationsOptions()}
      <PatentFiltersDialog
        open={openPatentFiltersDialog}
        handleClose={handleClose}
        patentOptions={patentOptions}
        selectedPatentClassification={selectedPatentClassification}
        handleCheckPatentClassifications={handleCheckPatentClassifications}
      />
      
    </Box>
  );
};

export default PatentFilters;
