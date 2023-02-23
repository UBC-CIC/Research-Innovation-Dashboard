import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from "@mui/material/Button";
import Grid from '@mui/material/Grid';
import {useState, useEffect} from 'react';
import './ResearcherProfile.css'
import Patent from './Patent';
import { Typography } from '@mui/material';

export default function PatentInformation(props){

    const [numberOfRows, setNumberOfRows] = useState(props.initialNumberOfRows);
    const [increaseRowCountBy, setIncreaseRowCountBy] = useState(25);

    function ShowMorePatentsButton() {
        if(numberOfRows<props.researcherPatents.length){
            return(<Button onClick={showMorePatents}
                sx={{m: 1, border: "2px solid Black", color: "black", backgroundColor: 'white'}}>
                    Show More Patents
                </Button>);
        }
        return;
    }

    function showMorePatents(){
        setNumberOfRows(numberOfRows+increaseRowCountBy);
    }

    const mappedData =
    props.researcherPatents
      .filter(
        (data, index) => index < numberOfRows
      )
      .map((filteredData, index) => (
        <Patent title={filteredData.patent_title} inventors={filteredData.patent_inventors} sponsors={filteredData.patent_sponsors}
        publicationDate={filteredData.patent_publication_date} patentNumber={filteredData.patent_number}
        familyNumber={filteredData.patent_family_number} patentClassification={filteredData.patent_classification}/>
      ));

    return(
        <Box >
        <Box sx={{ ml: "2%", mr: "2%" }} id="header_text">
            Patents
        </Box>
        <Box sx={{ ml: "2%", mr: "2%" }}>
            <Grid container>
                <Grid item xs={8}>
                    <Paper
                    square={true}
                    elevation={0}
                    variant="outlined"
                    sx={{ textAlign: "center" }}
                    >
                    {/* <TableSortLabel
                        onClick={sortHandler("title")}
                        active={sortByTitle}
                        direction={sortByTitleDirection}
                    > */}
                        <Typography align="center" variant="h6">
                            General Information
                        </Typography>
                    {/* </TableSortLabel> */}
                    </Paper>
                </Grid>
                <Grid item xs={2}>
                    <Paper
                    square={true}
                    elevation={0}
                    variant="outlined"
                    sx={{ textAlign: "center" }}
                    >
                    {/* <TableSortLabel
                        onClick={sortHandler("year")}
                        active={sortByYear}
                        direction={sortByYearDirection}
                    > */}
                        <Typography align="center" variant="h6">
                            Family Number
                        </Typography>
                    {/* </TableSortLabel> */}
                    </Paper>
                </Grid>
                <Grid item xs={2}>
                    <Paper
                    square={true}
                    elevation={0}
                    variant="outlined"
                    sx={{ textAlign: "center" }}
                    >
                    {/* <TableSortLabel
                        onClick={sortHandler("year")}
                        active={sortByYear}
                        direction={sortByYearDirection}
                    > */}
                        <Typography align="center" variant="h6">
                            Year Published
                        </Typography>
                    {/* </TableSortLabel> */}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
        <Box sx={{ m: "0%" }}>
            <Grid container>
                {mappedData}
            </Grid>
            {props.tabOpened && 
                <Box textAlign="center">
                    <ShowMorePatentsButton />
                </Box>
            }
        </Box>
        </Box>
    );}