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

const DepartmentFiltersDialog = ({
  open,
  handleClose,
  allDepartments,
  selectedDepartments,
  handleCheckDepartment,
}) => {
  //query will go here to apply filter

  const renderAllDepartments = () => {
    return (
      allDepartments && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flexWrap: "wrap",
            my: "2em",
          }}
        >
          <FormGroup sx={{ display: "flex", flexDirection: "row" }}>
            {allDepartments.map((department, index) => (
              <FormControlLabel
                key={index}
                control={<Checkbox />}
                label={<Typography variant="body2">{department}</Typography>}
                checked={selectedDepartments.includes(department)}
                onChange={(e) => handleCheckDepartment(e, department)}
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
      aria-labelledby="department-filter-options"
      PaperProps={{ sx: { minWidth: "70%", maxHeight: "70%" } }}
    >
      <IconButton sx={{ alignSelf: "flex-end" }} onClick={handleClose}>
        <CloseIcon />
      </IconButton>
      <Box sx={{ p: "2em", display: "flex", flexDirection: "column" }}>
        <Typography>All Departments</Typography>
        {renderAllDepartments()}
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

export default DepartmentFiltersDialog;
