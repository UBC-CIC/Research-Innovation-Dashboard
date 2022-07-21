import React from "react";
import { makeStyles } from "@mui/styles";
import { connect } from "react-redux";
import { updateMenuState } from "../../actions/menuActions";
import { Grid } from "@mui/material";
import NavigationBar from "../../components/Navigation_Bar";
import ResearcherProfileOverview from "../../Researcher_profile/Researcher_profile_overview";
import ResearcherProfileAreasOfInterest from "../../Researcher_profile/Researcher_profile_areas_of_interest";
import ResearcherProfilePublications from "../../Researcher_profile/Researcher_profile_publications";
import { Routes, Route } from "react-router-dom";
import SearchComponent from "../../Search_Reseachers/SearchComponent";
import SimilarResearchers from "../../Researcher_profile/Similar_Researchers";
import AdvancedSearchComponent from "../../Search_Reseachers/AdvancedSearchComponent";
import Rankings from "../../Rankings/Rankings";
import UbcMetrics from "../../UBC_Metrics/UbcMetrics";

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
            path="/Researchers/:scopusId/Publications"
            element={<ResearcherProfilePublications />}
          />
          <Route
            path="/Researchers/:scopusId/Areas_Of_Interest"
            element={<ResearcherProfileAreasOfInterest />}
          />
          <Route
            path="/Researchers/:scopusId/Similar_Researchers"
            element={<SimilarResearchers />}
          />
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
            path="/AdvancedSearch/:SearchForWhat/"
            element={<AdvancedSearchComponent />}
          />
          <Route
            path="/Search/Researchers/:searchValue"
            element={<SearchComponent whatToSearch={"Researchers"} />}
          />
          <Route
            path="/Search/Researchers/"
            element={<SearchComponent whatToSearch={"Researchers"} />}
          />
          <Route
            path="/Search/Publications/:searchValue"
            element={<SearchComponent whatToSearch={"Publications"} />}
          />
          <Route
            path="/Search/Publications/"
            element={<SearchComponent whatToSearch={"Publications"} />}
          />
          <Route
            path="/:searchValue"
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
