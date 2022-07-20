import { createTheme } from "@mui/material/styles";
import blue from "@material-ui/core/colors/blue";

const theme = createTheme({
  palette: {
    primary: {
      main: "#012144",
    },
    secondary: {
      main: blue[500],
    },
    darkTheme: {
      main: "#282c34",
      card: "#4a4f59",
    },
  },
});

export default theme;
