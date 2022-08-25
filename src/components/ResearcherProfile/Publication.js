import * as React from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";

const gridStyling = {
  height: "100%",
};

export default function PUBLICATION({ publication_data }) {
  let array = publication_data.author_names.split(",");
  let authorNamesString = "";

  for (let i = 0; i < array.length && i < 5; i++) {
    if (i == 4) {
      authorNamesString = authorNamesString + array[i] + "...";
    } else {
      authorNamesString = authorNamesString + array[i] + ", ";
    }
  }

  return (
    <Grid
      key={publication_data.id}
      container
      gridAutoRows="1fr"
      style={{ marginLeft: "2%", marginRight: "2%" }}
    >
      <Grid item xs={10}>
        <Paper
          style={gridStyling}
          square={true}
          elevation={0}
          sx={{ textAlign: "left" }}
        >
          <Typography variant="h5">
            <a href={publication_data.link}>{publication_data.title}</a>
          </Typography>
          <Typography>{authorNamesString}</Typography>
          <Typography>Journal Of {publication_data.journal}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={2}>
        <Paper
          style={gridStyling}
          square={true}
          elevation={0}
          component={Stack}
          direction="column"
          justifyContent="center"
        >
          <Typography align="center" variant="h6">
            {publication_data.year_published}
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}
