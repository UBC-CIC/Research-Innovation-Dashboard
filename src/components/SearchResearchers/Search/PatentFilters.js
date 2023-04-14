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
import InfoIcon from '@mui/icons-material/Info';
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
import { BorderColor } from "@mui/icons-material";

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
    "General tagging of new technological developments" // ;general tagging of cross-sectional technologies spanning over several sections of the IPC; technical subjects covered by former USPC cross-reference art collections [XRACs] and digests"
    ]);

  const LightTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} classes={{ popper: className }} />
  ))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: theme.palette.common.white,
      color: 'rgba(0, 0, 0, 0.87)',
      boxShadow: theme.shadows[2],
      maxWidth: 700,
      maxHeight: 700,
      border: "solid grey 7px",
      fontSize: "2rem"
    },
    // customize the tooltip arrow
    [`& .${tooltipClasses.arrow}`]: {
      "&::before": {
          color: 'grey', 
        },
      
    }
  }));

  const tooltipContent = () => {
    return (
      <Box style={{ width: "500px", height: "500px", overflow: "auto", border: 4 }}>
        <Typography variant="h1" sx={{fontSize: 17, fontWeight: 700}}>Human necessities (A):</Typography>
        <Typography variant="h5" sx={{fontSize: 14}}>
          You can expect to find patents that are related to human necessities, such as <em> food, clothing, 
          housing, medical or surgical equipment/devices, and more.</em>
        </Typography>
        <br></br>
        <Typography variant="h1" sx={{fontSize: 17, fontWeight: 700}}>Performing operations;transporting (B):</Typography>
        <Typography variant="h5" sx={{fontSize: 14}}>
          You can expect to find patents related to physical and chemical phenomena. This classification 
          includes a variety of fields, such as <em>mechanics (tools, machineries, etc), optics, 
          electrical engineering, transporting/vehicles, aeronautics, and more.</em>
        </Typography>
        <br></br>
        <Typography variant="h1" sx={{fontSize: 17, fontWeight: 700}}>Chemistry;metallurgy (C):</Typography>
        <Typography variant="h5" sx={{fontSize: 14}}>
          You can expect to find patents that covers chemistry-related technologies. This category includes a wide 
          range of fields, such as <em>organic chemistry, inorganic chemistry, biochemistry, 
          materials chemistry/metallurgy, and more.</em>
        </Typography>
        <br></br>
        <Typography variant="h1" sx={{fontSize: 17, fontWeight: 700}}>Textiles; paper (D):</Typography>
        <Typography variant="h5" sx={{fontSize: 14}}>
          You can expect to find patents that are related to <em>textile and paper production.</em>
        </Typography>
        <br></br>
        <Typography variant="h1" sx={{fontSize: 17, fontWeight: 700}}>Fixed constructions (E):</Typography>
        <Typography variant="h5" sx={{fontSize: 14}}>
          You can expect to find patents related to infrastructure and constructions, 
          such as <em> specific types of structures, such as bridges or tunnels. Additionally, you might find patents 
          related to earth drilling/mining.</em>
        </Typography>
        <br></br>
        <Typography variant="h1" sx={{fontSize: 17, fontWeight: 700}}>
          Mechanical engineering; lighting; heating; weapons; blasting engines or pumps (F):
        </Typography>
        <Typography variant="h5" sx={{fontSize: 14}}>
          You can expect to find patents related to mechanical engineering designs and methods. This 
          classification includes a variety of categories, such as <em>engines/pumps, fluid mechanics, 
          lighting/heating/combustion, weapons/blastings and other engineering fields.</em>
        </Typography>
        <br></br>
        <Typography variant="h1" sx={{fontSize: 17, fontWeight: 700}}>Physics (G):</Typography>
        <Typography variant="h5" sx={{fontSize: 14}}>
          You can expect to find patents related to <em>electronics, optics, semiconductor devices, 
          computer hardware, telecommunication systems, and other related technologies.</em>
          You may also find patents that cover <em>nuclear physics and nuclear engineering.</em>
        </Typography>
        <br></br>
        <Typography variant="h1" sx={{fontSize: 17, fontWeight: 700}}>Electricity (H):</Typography>
        <Typography variant="h5" sx={{fontSize: 14}}>
          This classification covers a broad range of fields related to electricity, including 
          <em>electric power generation, transmission, distribution, and storage, as well as electric 
          lighting and related applications. </em>
        </Typography>
        <br></br>
        <Typography variant="h1" sx={{fontSize: 17, fontWeight: 700}}>
          General tagging of new technological developments (Y):
        </Typography>
        <Typography variant="h5" sx={{fontSize: 14}}>
          It includes technologies that cannot be classified under any other CPC classification or 
          technologies that cover more than one CPC class. It may also includes emerging 
          technologies and green technologies (climate change mitigation/adaptation).
        </Typography>
        <br></br>
      </Box>)
  }

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
              .map((classification, index) => {
                return (
                    <FormControlLabel
                      key={index}
                      control={<Checkbox />}
                      checked={selectedPatentClassification.includes(classification)}
                      label={<Typography variant="body2">{classification}</Typography>}
                      onChange={(e) => handleCheckPatentClassifications(e, classification)}
                    />
                )})
            }
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
    <Box sx={{ display: "flex", flexDirection: "column", ml: "1.5em"}}>
      <Typography variant="h6" sx={{fontWeight: "bold"}}>Filters for Patents:</Typography>
      <Grid container sx={{flexDirection: "row", alignItems: "center"}} spacing={1}>
        <Grid item sx={{p: "0%", m: "0%"}}>
          <Typography sx={{ my: "1em", color: "#666666", fontSize: 20, marginBottom: "7px"}}>
            {"Patent Classification"}
          </Typography>
        </Grid>
        <Grid item sx={{paddingLeft: "0px"}}>
          <LightTooltip
            placement="right"
            sx={{bgColor: "white", maxWidth: 540}}
            title={tooltipContent()}
            arrow
          >
            <InfoOutlinedIcon sx={{m: "0px", fontSize: "28px", verticalAlign: "baseline"}}></InfoOutlinedIcon>
          </LightTooltip>
        </Grid>
      </Grid>
      <Typography sx={{ my: "1em", color: "#666666", fontSize: 20, marginTop: "7%"}}>{
        "(" + selectedPatentClassification.length + " selected)"}
      </Typography>
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
