import React from "react";
import { makeStyles } from "@mui/styles";
import { connect } from "react-redux";
import { updateMenuState } from "../../actions/menuActions";
import { Grid } from "@mui/material";
import NavigationBar from "../../components/NavigationBar";
import ResearcherProfileOverview from "../../components/ResearcherProfile/ResearcherProfile";
import { Routes, Route } from "react-router-dom";
import SearchComponent from "../../components/SearchResearchers/Search/SearchComponent";
import AdvancedSearchComponent from "../../components/SearchResearchers/AdvancedSearch/AdvancedSearchComponent";
import Rankings from "../../components/Rankings/Rankings";
import UbcMetrics from "../../components/UBCMetrics/UbcMetrics";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
  },
  list: {
    width: 250,
  },
  fullList: {
    width: "auto",
  },
  drawer: {
    width: 240,
    flexShrink: 0,
  },
  drawerContainer: {
    overflow: "auto",
  },
  drawerPaper: {
    width: 240,
  },
  content: {
    flexGrow: 1,
    [theme.breakpoints.down("sm")]: {
      padding: theme.spacing(3),
    },
  },
}));

function PageContainer(props) {
  const classes = useStyles();

  return (
    <Grid container direction="column">
      <NavigationBar />

      <main className={classes.content}>
        <Routes>
          <Route
            path="/Researchers/:scopusId"
            element={<ResearcherProfileOverview />}
          />
          <Route path="/UBC/Metrics/" element={<UbcMetrics />} />
          <Route path="/Rankings/" element={<Rankings />} />
          <Route
            path="/AdvancedSearch/:SearchForWhat/:AllWords/:ExactPhrase/:AnyWords/:NoneOfTheseWords/:Department/:Faculty/:yearFrom/:yearTo/:Journal"
            element={<AdvancedSearchComponent />}
          />
          <Route
            path="/Search/Researchers/:anyDepartmentFilter/:anyFacultyFilter/:searchValue/"
            element={<SearchComponent whatToSearch={"Researchers"} />}
          />
          <Route
            path="/Search/Publications/:journalFilter/:searchValue/"
            element={<SearchComponent whatToSearch={"Publications"} />}
          />
          <Route
            path="/:anyDepartmentFilter/:anyFacultyFilter/:journalFilter/:searchValue/"
            element={<SearchComponent whatToSearch={"Everything"} />}
          />
          <Route
            path="/"
            element={<SearchComponent whatToSearch={"Everything"} />}
          />
        </Routes>
      </main>
    </Grid>
  );
}

const mapStateToProps = (state) => {
  return {
    menuEnabled: state.appState.showSideBar,
  };
};

const mapDispatchToProps = {
  updateMenuState,
};

export default connect(mapStateToProps, mapDispatchToProps)(PageContainer);
