import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import React from "react";
import Stack from "@mui/material/Stack";
import InputBase from "@mui/material/InputBase";
import TextField from '@mui/material/TextField';

export default function AdvancedSearchRow(props) {
  return (
    <Grid container>
      <Paper
        square={true}
        elevation={0}
        sx={{ width: "100%", m: "2%" }}
        component={Stack}
        direction="row"
      >
        <Paper
          elevation={0}
          sx={{ width: "20%", paddingRight: "2%" }}
          component={Stack}
          direction="column"
          justifyContent="center"
        >
          <Typography variant="h7">{props.whatDoesSearchBoxDo}</Typography>
        </Paper>
        <Paper square={true} elevation={0} sx={{ width: "50%", border: 1 }}>
          <InputBase
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                props.setAdvancedSearchYet(true)
                props.routeChange();
              }
            }}
            value={props.searchBarValue}
            onChange={(e) => {
              props.setSearchBarValue(e.target.value);
            }}
            fullWidth={true}
            sx={{ padding: "8px", fontSize: "1.0rem" }}
            placeholder={props.howToDoSearchBox}
          ></InputBase>
        </Paper>
        {/* <Paper
          elevation={0}
          sx={{ width: "30%", paddingLeft: "2%" }}
          component={Stack}
          direction="column"
          justifyContent="center"
        >
          <Typography variant="h7">{props.howToDoSearchBox}</Typography>
        </Paper> */}
      </Paper>
    </Grid>
  );
}
