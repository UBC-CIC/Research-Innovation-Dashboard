import NavigationBar from "./Navigation_Bar"
import ResearcherProfileOverview from "./Researcher_profile/Researcher_profile_overview"
import ResearcherProfileAreasOfInterest from "./Researcher_profile/Researcher_profile_areas_of_interest"
import ResearcherProfilePublications from "./Researcher_profile/Researcher_profile_publications"
import {Routes, Route} from "react-router-dom";
import SearchComponent from './Search_Reseachers/SearchComponent'
import SimilarResearchers from "./Researcher_profile/Similar_Researchers"
import AdvancedSearch from "./Search_Reseachers/Advanced_Search";
import Rankings from "./Rankings/Rankings"

import React from 'react';
import './stylesheet.css'

console.log(React.version);

function App() {
  return (
    <div id='websiteFont'>
      <NavigationBar />
      <Routes>
        <Route path="/Researchers/:scopusId/Publications" element={<ResearcherProfilePublications />} />
        <Route path="/Researchers/:scopusId/Areas_Of_Interest" element={<ResearcherProfileAreasOfInterest />} />
        <Route path="/Researchers/:scopusId/Similar_Researchers" element={<SimilarResearchers />} />
        <Route path="/Researchers/:scopusId" element={<ResearcherProfileOverview />} />
        <Route path="/Rankings/" element={<Rankings />} />
        <Route path="/Advanced_Search/" element={<AdvancedSearch />} />
        <Route path="/Search/Researchers/:searchValue" element={<SearchComponent whatToSearch={"Researchers"} />} />
        <Route path="/Search/Researchers/" element={<SearchComponent whatToSearch={"Researchers"} />} />
        <Route path="/Search/Publications/:searchValue" element={<SearchComponent whatToSearch={"Publications"} />} />
        <Route path="/Search/Publications/" element={<SearchComponent whatToSearch={"Publications"} />} />
        <Route path="/:searchValue" element={<SearchComponent whatToSearch={"Everything"} />} />
        <Route path="/" element={<SearchComponent whatToSearch={"Everything"} />} />
      </Routes>
    </div>
  );
}

export default App;
