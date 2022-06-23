import * as React from 'react';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Typography from "@mui/material/Typography";
import './Rankings.css'
import { useState} from 'react';
import Button from "@mui/material/Button";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import NativeSelect from '@mui/material/NativeSelect';
import InputBase from '@mui/material/InputBase';
import { styled } from '@mui/material/styles';
import { Link } from 'react-router-dom'

const heightMatch = {height: "100%"};

const BootstrapInput = styled(InputBase)(({ theme }) => ({
    'label + &': {
      marginTop: theme.spacing(3),
    },
    '& .MuiInputBase-input': {
      borderRadius: 4,
      position: 'relative',
      backgroundColor: theme.palette.background.paper,
      border: '1px solid #ced4da',
      fontSize: 16,
      padding: '10px 26px 10px 12px',
      transition: theme.transitions.create(['border-color', 'box-shadow']),
      // Use the system font instead of the default Roboto font.
      '&:focus': {
        borderRadius: 4,
        borderColor: '#80bdff',
        boxShadow: '0 0 0 0.2rem rgba(0,123,255,.25)',
      },
    },
  }));

export default function RankByFaculty(props) {
    const [numberOfRankingsToShow, setNumberOfRankingsToShow] = useState(2);
    const [increaseRankingsListBy, setIncreaseRankingsListBy] = useState(5);

    const facultyDropDownItems = props.allFaculty.map((department)=>
        <option value={department.prime_faculty} key={department.prime_faculty}>{department.prime_faculty}</option>
    );

    const rankings_element = props.researcherRankingsByFaculty.filter((data,index) =>index < numberOfRankingsToShow)
    .map((prof_data, index) =>
    <Grid container key={prof_data.preferred_name}>
        <Grid item xs={1}>
                    <Paper style={heightMatch} square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}}>
                        <Typography align='center' variant='h6'>
                            {index+1}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={2}>
                    <Paper style={heightMatch} square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}}>
                        <Typography component={Link} to={"/Researchers/"+prof_data.scopus_id+"/"} align='center' variant='h6'>
                            {prof_data.preferred_name}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={3}>
                    <Paper style={heightMatch} square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}}>
                        <Typography align='center' variant='h6'>
                            {prof_data.prime_faculty}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={3}>
                    <Paper style={heightMatch} square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}}>
                        <Typography align='center' variant='h6'>
                            {prof_data.prime_department}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={1}>
                    <Paper style={heightMatch} square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}}>
                        <Typography align='center' variant='h6'>
                            {prof_data.num_citations}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={1}>
                    <Paper style={heightMatch} square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}}>
                        <Typography align='center' variant='h6'>
                            {prof_data.h_index}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={1}>
                    <Paper style={heightMatch} square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}}>
                        <Typography align='center' variant='h6'>
                            {}
                        </Typography>
                    </Paper>
                </Grid>
    </Grid>)

    function showMoreRankings() {
        setNumberOfRankingsToShow(numberOfRankingsToShow+increaseRankingsListBy);
        setIncreaseRankingsListBy(increaseRankingsListBy*2);
    }

    function ShowMoreRankingsButton() {
        if(numberOfRankingsToShow<props.researcherRankingsByFaculty.length){
            return(<Button onClick={showMoreRankings}
                sx={{m: 1, border: "2px solid Black", color: "black", backgroundColor: 'white'}}>
                    Show More Publications
                </Button>);
        }
        return;
    }
    
    return(
        <div>
            <Grid container justifyContent="flex-end">
                <Grid item xs={12}>
                    <Paper square={true} elevation={0} variant="outlined">
                        <Grid container id='full_box'>
                            <Grid item xs={6}>
                                <Typography align='left' variant='h3' justifyContent={'center'}>
                                    Researcher Rankings
                                </Typography> 
                            </Grid>
                            <Grid item xs={6} >
                                <Stack direction="row" justifyContent="end">
                                    <FormControl sx={{ m: 1, mr: 0 }} variant="standard">
                                        <NativeSelect
                                        id="demo-customized-select-native"
                                        value={props.departmentToRank}
                                        onChange={props.changeFacultyToRank}
                                        input={<BootstrapInput />}
                                        >
                                            {facultyDropDownItems}
                                        </NativeSelect>
                                    </FormControl>
                                </Stack>
                            </Grid>
                            <Grid item xs={1}>
                                <Paper style={heightMatch} square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}}>
                                    <Typography align='center' variant='h6'>
                                        Rank
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={2}>
                                <Paper style={heightMatch} square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}}>
                                    <Typography align='center' variant='h6'>
                                        Name
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={3}>
                                <Paper style={heightMatch} square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}}>
                                    <Typography align='center' variant='h6'>
                                        Faculty
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={3}>
                                <Paper style={heightMatch} square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}}>
                                    <Typography align='center' variant='h6'>
                                        Department
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={1}>
                                <Paper style={heightMatch} square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}}>
                                    <Typography align='center' variant='h6'>
                                        Citations
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={1}>
                                <Paper style={heightMatch} square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}}>
                                    <Typography align='center' variant='h6'>
                                        H Index (5 Years)
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={1}>
                                <Paper style={heightMatch} square={true} elevation={0} variant="outlined" sx={{textAlign: 'center'}}>
                                    <Typography align='center' variant='h6'>
                                        Funding
                                    </Typography>
                                </Paper>
                            </Grid>
                            {rankings_element}
                        </Grid>
                        <Box textAlign='center'>
                            <ShowMoreRankingsButton />
                            <br />
                        </Box>
                    </Paper>
                </Grid>
            </Grid>          
        </div>
    )
}