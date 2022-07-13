import * as React from "react";
import RankingsNavigation from "./Rankings_Navigation";
import "./Rankings.css";
import { useState, useEffect } from "react";

import Amplify from "@aws-amplify/core";
import { Auth } from "@aws-amplify/auth";
import awsmobile from "../aws-exports";

import { API } from "aws-amplify";
import {
  getResearcherRankingsByDepartment,
  getAllDepartments,
  getAllResearchersRankings,
  getAllFaculty,
  getResearcherRankingsByFaculty,
} from "../graphql/queries";

import RankingsByDepartment from "./RankResearcherByDepartment";
import AllResearcherRankings from "./allResearcherRankings";
import RankByFaculty from "./RankByFaculty";
import LoadingWheel from "../LoadingWheel";

Amplify.configure(awsmobile);
Auth.configure(awsmobile);

export default function Rankings(props) {
  const [
    researcherRankingsByDepartment,
    setResearcherRankingsByDepartment,
  ] = useState([]);
  const [departmentToRank, setDepartmentToRank] = useState("");
  const [allDepartments, setAllDepartments] = useState([]);
  const [allResearcherRankings, setAllResearcherRankings] = useState([]);

  const [
    researcherRankingsByFaculty,
    setResearcherRankingsByFaculty,
  ] = useState([]);
  const [facultyToRank, setFacultyToRank] = useState("");
  const [allFaculty, setAllFaculty] = useState([]);

  const [showByDepartment, setShowByDepartment] = useState(true);
  const [showByFaculty, setShowByFaculty] = useState(false);
  const [showOverallRankings, setShowOverallRankings] = useState(false);

  const [pageLoaded, setPageLoaded] = useState(false);

  const getDeparmentArray = async () => {
    const department = await API.graphql({
      query: getAllDepartments,
    });
    let allDepartmentsArray = department.data.getAllDepartments;
    setAllDepartments(allDepartmentsArray);
    setDepartmentToRank(allDepartmentsArray[0]);
  };

  const getResearcherRankingByDepartment = async () => {
    const rankings = await API.graphql({
      query: getResearcherRankingsByDepartment,
      variables: { prime_department: departmentToRank },
    });
    let researcher_rankings_by_department =
      rankings.data.getResearcherRankingsByDepartment;
    setResearcherRankingsByDepartment(researcher_rankings_by_department);
  };

  const getFacultyArray = async () => {
    const department = await API.graphql({
      query: getAllFaculty,
    });
    let allFacultyArray = department.data.getAllFaculty;
    setAllFaculty(allFacultyArray);
    setFacultyToRank(allFacultyArray[0]);
  };

  const getResearcherRankingByFaculty = async () => {
    const rankings = await API.graphql({
      query: getResearcherRankingsByFaculty,
      variables: { prime_faculty: facultyToRank },
    });
    let researcher_rankings_by_Faculty =
      rankings.data.getResearcherRankingsByFaculty;
    setResearcherRankingsByFaculty(researcher_rankings_by_Faculty);
  };

  const getOverallResearcherRankings = async () => {
    const rankings = await API.graphql({
      query: getAllResearchersRankings,
    });

    let allResearchRankingArray = rankings.data.getAllResearchersRankings;
    setAllResearcherRankings(allResearchRankingArray);
  };

  function changeDepartmentToRank(event) {
    setDepartmentToRank(event.target.value);
  }

  function changeFacultyToRank(event) {
    setFacultyToRank(event.target.value);
  }

  useEffect(() => {
    Promise.all([
      getDeparmentArray(),
      getFacultyArray(),
      getOverallResearcherRankings(),
    ]).then(() => {
      setPageLoaded(true);
    });
  }, []);

  useEffect(() => {
    getResearcherRankingByDepartment();
  }, [departmentToRank]);

  useEffect(() => {
    getResearcherRankingByFaculty();
  }, [facultyToRank]);

  function byDepartmentButton() {
    setShowByDepartment(true);
    setShowByFaculty(false);
    setShowOverallRankings(false);
  }
  function byFacultyButton() {
    setShowByDepartment(false);
    setShowByFaculty(true);
    setShowOverallRankings(false);
  }
  function overallRankingsButton() {
    setShowByDepartment(false);
    setShowByFaculty(false);
    setShowOverallRankings(true);
  }

  return (
    <div>
      {!pageLoaded && <LoadingWheel />}
      {pageLoaded && (
        <div>
          <RankingsNavigation
            onClickFunctions={{
              byDepartmentButton,
              byFacultyButton,
              overallRankingsButton,
            }}
          />
          {showByDepartment && (
            <RankingsByDepartment
              allDepartments={allDepartments}
              researcherRankingsByDepartment={researcherRankingsByDepartment}
              changeDepartmentToRank={changeDepartmentToRank}
              departmentToRank={departmentToRank}
            />
          )}
          {showByFaculty && (
            <RankByFaculty
              allFaculty={allFaculty}
              researcherRankingsByFaculty={researcherRankingsByFaculty}
              changeFacultyToRank={changeFacultyToRank}
            />
          )}
          {showOverallRankings && (
            <AllResearcherRankings
              allResearcherRankings={allResearcherRankings}
            />
          )}
        </div>
      )}
    </div>
  );
}
