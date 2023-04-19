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
import GrantFiltersDialog from "./GrantFiltersDialog";
import ClearIcon from '@mui/icons-material/Clear';

const GrantsFilters = ({
  selectedGrants,
  setSelectedGrants,
  searchYet
}) => {
  const [grantsOptions, setGrantsOptions] = useState();
  const [openGrantFiltersDialog, setOpenGrantFiltersDialog] = useState(false);

  const handleClose = () => {
    setOpenGrantFiltersDialog(false);
  };
  useEffect(() => {
    const getFilterOptions = async () => {
      const grantResults = await Promise.all([
        API.graphql({
          query: getAllGrantAgencies,
        })
      ]);
      const allGrants = grantResults[0].data.getAllGrantAgencies;
      //console.log(allGrants)
      setGrantsOptions(allGrants);
    };
    getFilterOptions();
  }, []);

  const handleCheckGrant = (e, department) => {
    if (e.target.checked) {
      setSelectedGrants((prev) => [...prev, department]);
    } else {
      setSelectedGrants(
        selectedGrants.filter(
          (selectedDepartment) => selectedDepartment !== department
        )
      );
    }
  };

  const renderDepartmentOptions = () => {
    return (
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <FormGroup>
          {grantsOptions &&
            grantsOptions
              .slice(0, 5)
              .map((grant, index) => (
                <FormControlLabel
                  key={index}
                  control={<Checkbox />}
                  checked={selectedGrants.includes(grant)}
                  label={<Typography variant="body2">{grant}</Typography>}
                  onChange={(e) => handleCheckGrant(e, grant)}
                />
              ))}
        </FormGroup>
        {/* <Button
          onClick={() => setOpenGrantFiltersDialog(true)}
          sx={{ color: "##666666", justifyContent: "flex-start" }}
        >
          Show All
        </Button> */}
      </Box>
    );
  };

  return (searchYet &&
    <Box sx={{ display: "flex", flexDirection: "column", ml: "1em" }}>
      <Typography variant="h6" sx={{fontWeight: "bold"}}>Filters for Grants:</Typography>
      <Typography sx={{ my: "1em", color: "#666666", fontSize: 20}}>{"Grants (" + selectedGrants.length + " selected)"}</Typography>
      {(selectedGrants.length > 0) && 
        (<Button onClick={() => setSelectedGrants([])} sx={{justifyContent: "left", p: 0, pb: 1, color: "#666666"}}>
          Clear all filters {<ClearIcon sx={{pl: 1}}></ClearIcon>}
        </Button>)}
      {renderDepartmentOptions()}
      <GrantFiltersDialog
        open={openGrantFiltersDialog}
        handleClose={handleClose}
        allGrants={grantsOptions}
        selectedGrant={selectedGrants}
        handleCheckGrant={handleCheckGrant}
      />
      
    </Box>
  );
};

export default GrantsFilters;
