import React from "react";
import {
  Dialog,
  Box,
  IconButton,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const FacultyFiltersDialog = ({
  open,
  handleClose,
  allFaculties,
  selectedFaculties,
  handleCheckFaculty,
}) => {
  const renderAllFaculties = () => {
    return (
      allFaculties && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flexWrap: "wrap",
            my: "2em",
          }}
        >
          <FormGroup sx={{ display: "flex", flexDirection: "row" }}>
            {allFaculties.map((faculty, index) => (
              <FormControlLabel
                key={index}
                control={<Checkbox />}
                label={<Typography variant="body2">{faculty}</Typography>}
                checked={selectedFaculties.includes(faculty)}
                onChange={(e) => handleCheckFaculty(e, faculty)}
              />
            ))}
          </FormGroup>
        </Box>
      )
    );
  };

  return (
    <Dialog
      open={open}
      aria-labelledby="faculty-filter-options"
      PaperProps={{ sx: { minWidth: "70%", maxHeight: "70%" } }}
    >
      <IconButton sx={{ alignSelf: "flex-end" }} onClick={handleClose}>
        <CloseIcon />
      </IconButton>
      <Box sx={{ p: "2em", display: "flex", flexDirection: "column" }}>
        <Typography>All Faculties</Typography>
        {renderAllFaculties()}
        <Button
          variant="outlined"
          sx={{ color: "#0055b7" }}
          onClick={() => handleClose()}
        >
          Apply Filters
        </Button>
      </Box>
    </Dialog>
  );
};

export default FacultyFiltersDialog;
