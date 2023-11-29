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
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import TextField from '@mui/material/TextField';
import Grid from "@mui/material/Grid";

const COLOR_OBJECT = {
  "Faculty of Applied Science": "#A84D52", // Redwood
  "Faculty of Science": "#2E5090", // YInMn Blue
  "The Sauder School of Business": "#88BD56", // Pistachio
  "Faculty of Dentistry": "#00B8A2", // Keppel
  "Faculty of Arts": "#634581", // Ultra Violet
  "Faculty of Forestry": "#82470D", // Chocolate
  "Faculty of Land and Food Systems": "#ADA871", // Sage
  "Faculty of Education": "#025033", // Castleton green
  "Faculty of Pharmaceutical Sciences": "#DBB2D1", // Pink lavender
  
  "Peter A. Allard School of Law": "#F7CB78", // Jasmine
  "Faculty of Medicine": "#40AFD1", // Pacific cyan

  "VP Academic and Provost": "#989C9C", // other shade of grey
  "VP Research and Innovation": "#989C9C",

  "UBCO - Barber - Faculty of Science": "#A3A9AA", // some sort of grey (Cadet gray)
  "UBCO - Barber - Faculty of Arts and Social Sciences": "#A3A9AA",
  "UBCO - Faculty of Creative and Critical Studies": "#A3A9AA",
  "UBCO - Faculty of Health and Social Development": "#A3A9AA",
  "UBCO - Faculty of Management": "#A3A9AA",
}

const FacultyFiltersDialog = ({
  open,
  handleClose,
  allFaculties,
  selectedFaculties,
  handleCheckFaculty,
  applyFilters,
  keywordFilter,
  setKeywordFilter,
}) => {
  const renderAllFaculties = () => {
    return (
      allFaculties && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flexWrap: "wrap",
            my: "1em",
          }}
        >
          <FormGroup sx={{ display: "flex", flexDirection: "row" }}>
            {allFaculties.map((faculty, index) => (
              <FormControlLabel
                key={index}
                control={<Checkbox />}
                label={<Typography ><IconButton disabled><FiberManualRecordIcon style={{ color: COLOR_OBJECT[faculty] }} /></IconButton>{faculty}</Typography>}
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
      onClose={() => {handleClose();}}
    >
      <IconButton sx={{ alignSelf: "flex-end" }} onClick={handleClose}>
        <CloseIcon />
      </IconButton>
      <Box sx={{ p: "2em", display: "flex", flexDirection: "column" }}>
        <Grid container spacing={2}>
          <Grid item xs={8}>
            <Typography variant="h6">Filter by Faculty</Typography>
            {renderAllFaculties()}
          </Grid>
          <Grid item xs={4}>
            <Box sx={{mb: "2em"}}>
              <Typography style={{paddingBottom:'1em'}} variant="h6">Filter by Keywords</Typography>
              <TextField label="Keywords" helperText="Example: genetics, ai" size="small" value={keywordFilter} onChange={(event) => {setKeywordFilter(event.target.value)}}/>
            </Box>
          </Grid>
        </Grid>
        <Button
          variant="outlined"
          sx={{ color: "#0055b7" }}
          onClick={() => {applyFilters();}}
        >
          Apply Filters
        </Button>
      </Box>
    </Dialog>
  );
};

export {FacultyFiltersDialog, COLOR_OBJECT};
