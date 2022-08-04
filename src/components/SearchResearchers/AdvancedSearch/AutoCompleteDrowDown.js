import * as React from 'react';
import Typography from '@mui/material/Typography';

import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';

import AutoCompleteStyled from './AutoCompleteStyled';

export default function AutoCompleteDropDown(props) {
  return (
    <Grid container>
            <Paper square={true} elevation={0} sx={{width: "100%", m: "2%"}} component={Stack} direction="row">
                <Paper elevation={0} sx={{width: "20%", paddingRight: "2%"}} component={Stack} direction="column" justifyContent="center">
                    <Typography variant='h7'>
                        {props.title}
                    </Typography>
                </Paper>
                <Paper elevation={0} sx={{width: "50%"}} component={Stack} direction="column" justifyContent="center">
                  <AutoCompleteStyled value={props.value} setValue={props.setValue} DropDownArray={props.DropDownArray} />
                </Paper>
                <Paper elevation={0} sx={{width: "30%", paddingLeft: "2%"}} component={Stack} direction="column" justifyContent="center">
                    <Typography variant='h7'>
                        {props.howToDoSearchBox}
                    </Typography>
                </Paper>
            </Paper>
    </Grid>
  );
}