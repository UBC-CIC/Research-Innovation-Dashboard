import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from "@mui/material/Button";
import Grid from '@mui/material/Grid';
import {useState, useEffect} from 'react';
import './ResearcherProfile.css'
import Grant from './Grant';
import Pagination from "@mui/material/Pagination";

export default function GrantInformation(props){

    const [numberOfRows, setNumberOfRows] = useState(props.initialNumberOfRows);
    const [increaseRowCountBy, setIncreaseRowCountBy] = useState(25);
    const [page, setPage] = useState(1);

    let numberOfGrantsPerPage = 5;

    function ShowMoreGrantsButton() {
        if(numberOfRows<props.grantData.length){
            return(<Button onClick={showMoreGrants}
                sx={{m: 1, border: "2px solid Black", color: "black", backgroundColor: 'white'}}>
                    Show More Grants
                </Button>);
        }
        return;
    }

    function showMoreGrants(){
        setNumberOfRows(numberOfRows+increaseRowCountBy);
    }

    function paginationCallback(data, index) {
        if (
          (page - 1) * numberOfGrantsPerPage <= index &&
          index < page * numberOfGrantsPerPage
        ) {
          return data;
        }
    }

    const mappedData =
    props.grantData
      .filter(
        (data, index) => paginationCallback(data, index)
      )
      .map((filteredData, index) => (
        <Grant key={index} name={filteredData.name} projectTitle={filteredData.project_title} agency={filteredData.agency} amount={filteredData.amount} year={filteredData.year} />
      ));

    return(
        <Box sx={{ml: "2%", mr: "2%", width: "96%"}}>
            <Box>
                <Box sx={{}} id="header_text">
                    Grants
                </Box>
                <Box sx={{}}>
                    <Grid container>
                        <Grid item xs={2}>
                            <Paper
                            square={true}
                            elevation={0}
                            variant="outlined"
                            sx={{ textAlign: "center", height: "100%", justifyContent: "center", flexDirection: "column", display: "flex", fontWeight: 'bold' }}
                            >
                                Grant Winner Name
                            </Paper>
                        </Grid>
                        <Grid item xs={6}>
                            <Paper
                            square={true}
                            elevation={0}
                            variant="outlined"
                            sx={{ textAlign: "center", height: "100%", justifyContent: "center", flexDirection: "column", display: "flex", fontWeight: 'bold' }}
                            >
                                Project Title
                            </Paper>
                        </Grid>
                        <Grid item xs={2}>
                            <Paper
                            square={true}
                            elevation={0}
                            variant="outlined"
                            sx={{ textAlign: "center", height: "100%", justifyContent: "center", flexDirection: "column", display: "flex", fontWeight: 'bold' }}
                            >
                                Granting Agency
                            </Paper>
                        </Grid>
                        <Grid item xs={1}>
                            <Paper
                            square={true}
                            elevation={0}
                            variant="outlined"
                            sx={{ textAlign: "center", height: "100%", justifyContent: "center", flexDirection: "column", display: "flex", fontWeight: 'bold' }}
                            >
                                Amount
                            </Paper>
                        </Grid>
                        <Grid item xs={1}>
                            <Paper
                            square={true}
                            elevation={0}
                            variant="outlined"
                            sx={{ textAlign: "center", height: "100%", justifyContent: "center", flexDirection: "column", display: "flex", fontWeight: 'bold' }}
                            >
                                Allocated Year
                            </Paper>
                        </Grid>
                    </Grid>
                    {mappedData}
                    {true && <Grid container>
                        <Grid item xs={12} sx={{ m: "2%" }}>
                            <Box display="flex" alignItems="center" justifyContent="center">
                                 <Pagination
                                    size="large"
                                    defaultPage={1}
                                    page={page}
                                    count={Math.ceil(
                                        props.grantData.length / numberOfGrantsPerPage
                                    )}
                                    onChange={(event, value) => {
                                        setPage(value);
                                    }}
                                />
                            </Box>
                        </Grid>
                    </Grid>}
                    {/* {props.tabOpened && 
                    <Box textAlign='center'>
                        <ShowMoreGrantsButton />
                    </Box>
                    } */}
                </Box>
            </Box>
        </Box>
    );}