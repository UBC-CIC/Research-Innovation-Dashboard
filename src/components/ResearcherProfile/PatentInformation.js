import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from "@mui/material/Button";
import Grid from '@mui/material/Grid';
import {useState, useEffect} from 'react';
import './ResearcherProfile.css'
import Patent from './Patent';
import { Typography } from '@mui/material';
import Pagination from "@mui/material/Pagination";

export default function PatentInformation(props){
    const [numberOfRows, setNumberOfRows] = useState(props.initialNumberOfRows);
    const [increaseRowCountBy, setIncreaseRowCountBy] = useState(25);
    const [page, setPage] = useState(1);

    let numberOfPatentsPerPage = 3;

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

    function paginationCallback(data, index) {
        if (
          (page - 1) * numberOfPatentsPerPage <= index &&
          index < page * numberOfPatentsPerPage
        ) {
          return data;
        }
    }

    const mappedData =
    props.researcherPatents//.sort((patent1, patent2) => patent1.patent_publication_date > patent2.patent_publication_date ? -1 : 1) // descending year
      //.sort((patent1, patent2) => new Date(patent2.patent_publication_date) - new Date(patent1.patent_publication_date))
      .filter(
        (data, index) => paginationCallback(data, index)
      )
      .map((filteredData, index) => (
        <Patent key={index} title={filteredData.patent_title} inventors={filteredData.patent_inventors} sponsors={filteredData.patent_sponsors}
        publicationDate={filteredData.patent_publication_date} patentNumber={filteredData.patent_number}
        familyNumber={filteredData.patent_family_number} patentClassification={filteredData.patent_classification}
        inventors_assigned_ids={filteredData.inventors_assigned_ids} matched_inventors_names={filteredData.matched_inventors_names}/>
      ));

    return(props.searchYet && 
        <Grid sx={{ml: "1%"}}>
            {props.researcherPatents.length === 0 && (
                <Paper elevation={0} square={true} sx={{width: "100%" }}>
                    <Typography variant="h4" sx={{ marginLeft: "2%"}}>{props.errorTitle}</Typography>
                </Paper>
            )}
            {props.researcherPatents.length > 0 && <Box >
                <Box sx={{ ml: "2%", mr: "2%" }}>
                    {props.researcherPatents.length > 1 ?
                    (<Box sx={{  }} id="header_text">
                        {"Patents (" + props.researcherPatents.length + " results)"}
                    </Box>) :
                    (<Box sx={{  }} id="header_text">
                        Patent
                    </Box>)
                    }
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
                    {true && 
                    <Grid container>
                        <Grid item xs={12} sx={{ m: "2%" }}>
                            <Box display="flex" alignItems="center" justifyContent="center">
                                <Pagination
                                    size="large"
                                    defaultPage={1}
                                    page={page}
                                    count={Math.ceil(
                                        props.researcherPatents.length / numberOfPatentsPerPage
                                    )}
                                onChange={(event, value) => {
                                    setPage(value);
                                }}
                                />
                            </Box>
                        </Grid>
                    </Grid>}
                    {props.tabOpened && 
                        <Box textAlign="center">
                            <ShowMorePatentsButton />
                        </Box>
                    }
                </Box>
            </Box>}
        </Grid>
    );}