import Navigation_Bar from "./Navigation_Bar"
import Researcher_profile_overview from "./Researcher_profile/Researcher_profile_overview"
import Researcher_profile_areas_of_interest from "./Researcher_profile/Researcher_profile_areas_of_interest"
import Researcher_profile_publications from "./Researcher_profile/Researcher_profile_publications"
import {Routes, Route} from "react-router-dom";
import Search_Researchers from './Search_Reseachers/Search_Researchers'
import Similar_Researchers from "./Researcher_profile/Similar_Researchers"
import Rankings from "./Rankings/Rankings"
import React, { Component }  from 'react';
import './stylesheet.css'

function App() {
  return (
    <div id='websiteFont'>
      <Navigation_Bar />
      <Routes>
        <Route path="/Researchers/:scopusId/Publications" element={<Researcher_profile_publications />} />
        <Route path="/Researchers/:scopusId/Areas_Of_Interest" element={<Researcher_profile_areas_of_interest />} />
        <Route path="/Researchers/:scopusId/Similar_Researchers" element={<Similar_Researchers />} />
        <Route path="/Researchers/:scopusId" element={<Researcher_profile_overview />} />
        <Route path="/Researchers" element={<Search_Researchers />} />
        <Route path="/Rankings/" element={<Rankings />} />
        <Route path="/" element={
        <div>
        </div>} />
        <Route path="/Hello/:scopusId" element={
        <h2>hi</h2>
        } />
      </Routes>
    </div>
  );
}

export default App;
