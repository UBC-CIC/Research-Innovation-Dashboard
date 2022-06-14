import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Button from "@mui/material/Button";
import ButtonGroup from '@mui/material/ButtonGroup';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from "@mui/material/Typography";
import Stack from '@mui/material/Stack';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

let faculty_list = ['Arts', 'Applied Science', 'Architecture and Landscape', 'Bussiness', 'Dentistry',
'Education', 'Forestry',];

let department_list = ['Biomedical Engineering', 'Chemical and Biological Engineering', 'Civil Engineering', 'Engineering Physics', 'Electrical And Computer Engineering',
'Integrated Engineering', 'Geological Engineering'];

let areas_of_interest_list = ['Water Filtration', 'Urban Water Stratagy', 'Neural Network', 'Industrial Water Processing', 'Water Recycling',
'Algorithms', 'Architecture', 'Artificial Intelligence', 'Computer Vision', 'Concurrency',];

const equalSizedGrid = {
    height: "100%",
    paddingLeft: 24,
  };

const faculty_checkboxes = faculty_list.map((faculty)=>
    <Grid item xs={3} key={faculty}>
        <Paper style={equalSizedGrid} square={true} elevation={0} component={Stack} direction="column" justifyContent="center">
            <Typography variant='h7'>
                <FormControlLabel control={<Checkbox defaultChecked />} label={faculty} />
            </Typography>
        </Paper>
    </Grid>
)
const department_checkboxes = department_list.map((department)=>
    <Grid item xs={3} key={department}>
        <Paper style={equalSizedGrid} square={true} elevation={0} component={Stack} direction="column" justifyContent="center">
            <Typography variant='h7'>
                <FormControlLabel control={<Checkbox defaultChecked />} label={department} />
            </Typography>
        </Paper>
    </Grid>
)
const areas_checkboxes = areas_of_interest_list.map((areas)=>
    <Grid item xs={3} key={areas}>
        <Paper style={equalSizedGrid} square={true} elevation={0} component={Stack} direction="column" justifyContent="center">
            <Typography variant='h7'>
                <FormControlLabel control={<Checkbox defaultChecked />} label={areas} />
            </Typography>
        </Paper>
    </Grid>
)

export default function Filter_Researchers_Bar() {
    const [facultyOpen, setFacultyOpen] = React.useState(false);
    const [departmentOpen, setDepartmentOpen] = React.useState(false);
    const [areasOpen, setAreasOpen] = React.useState(false);

    const openFacultyFilter = () => {
        setFacultyOpen(true);
    };

    const handleFacultyClose = () => {
        setFacultyOpen(false);
    };

    const openDepartmentFilter = () => {
        setDepartmentOpen(true);
    };

    const handleDepartmentClose = () => {
        setDepartmentOpen(false);
    };

    const openAreasFilter = () => {
        setAreasOpen(true);
    };

    const handleAreasClose = () => {
        setAreasOpen(false);
    };

    return(
        <Grid item xs={12}>
            <Paper square={true} elevation={0} variant="outlined">
                <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', '& > *': { m: 1,},}}>
                    <ButtonGroup size='large' variant="text" aria-label="text button group" >
                        <Button onClick={openFacultyFilter}>Filter By Faculty</Button>
                        <Button onClick={openDepartmentFilter}>Filter By Department</Button>
                        <Button onClick={openAreasFilter}>Filter By Researcher Area</Button>
                    </ButtonGroup>
                </Box>
            </Paper>
            <Dialog fullWidth={true} maxWidth={'md'} open={facultyOpen} onClose={handleFacultyClose}>
                <DialogTitle align='center' variant='h4'>Filter By Faculty</DialogTitle>
                    <Grid container>
                        {faculty_checkboxes}    
                    </Grid>
                <DialogActions>
                    <Button onClick={handleFacultyClose}>Cancel</Button>
                    <Button onClick={handleFacultyClose}>Filter</Button>
                </DialogActions>
            </Dialog>

            <Dialog fullWidth={true} maxWidth={'md'} open={departmentOpen} onClose={handleDepartmentClose}>
                <DialogTitle align='center' variant='h4'>Filter By Department</DialogTitle>
                    <Grid container>
                        {department_checkboxes}    
                    </Grid>
                <DialogActions>
                    <Button onClick={handleDepartmentClose}>Cancel</Button>
                    <Button onClick={handleDepartmentClose}>Filter</Button>
                </DialogActions>
            </Dialog>

            <Dialog fullWidth={true} maxWidth={'md'} open={areasOpen} onClose={handleAreasClose}>
                <DialogTitle align='center' variant='h4'>Filter By Areas Of Interest</DialogTitle>
                    <Grid container>
                        {areas_checkboxes}    
                    </Grid>
                <DialogActions>
                    <Button onClick={handleAreasClose}>Cancel</Button>
                    <Button onClick={handleAreasClose}>Filter</Button>
                </DialogActions>
            </Dialog>
        </Grid>
    );
}