import * as React from "react";
import ImpactNavigation from "./ImpactNavigation";
import "./Impact.css";
import { useState, useEffect } from "react";

import { API } from "aws-amplify";
import {
  getResearcherImpactsByDepartment,
  getAllDepartments,
  getAllResearchersImpacts,
  getAllFaculty,
  getResearcherImpactsByFaculty,
} from "../../graphql/queries";

import ResearcherImpactByDepartment from "./ResearcherImpactByDepartment";
import AllResearcherImpacts from "./allResearcherImpacts";
import ImpactByFaculty from "./ResearcherImpactByFaculty";
import LoadingWheel from "../LoadingWheel";

export default function Impact(props) {
  const [
    researcherImpactsByDepartment,
    setResearcherImpactsByDepartment,
  ] = useState([]);
  const [departmentImpact, setDepartmentImpact] = useState("");
  const [allDepartments, setAllDepartments] = useState([]);
  const [allResearcherImpacts, setAllResearcherImpacts] = useState([]);

  const [
    researcherImpactsByFaculty,
    setResearcherImpactsByFaculty,
  ] = useState([]);
  const [facultyImpact, setFacultyImpact] = useState("");
  const [allFaculty, setAllFaculty] = useState([]);

  const [showByDepartment, setShowByDepartment] = useState(true);
  const [showByFaculty, setShowByFaculty] = useState(false);
  const [showOverallImpacts, setShowOverallImpacts] = useState(false);

  const [pageLoaded, setPageLoaded] = useState(false);

  const getDeparmentArray = async () => {
    const department = await API.graphql({
      query: getAllDepartments,
    });
    let allDepartmentsArray = department.data.getAllDepartments;
    setAllDepartments(allDepartmentsArray);
    setDepartmentImpact(allDepartmentsArray[0]);
  };

  const getResearcherImpactByDepartment = async () => {
    const impacts = await API.graphql({
      query: getResearcherImpactsByDepartment,
      variables: { prime_department: departmentImpact },
    });
    let researcher_impacts_by_department =
      impacts.data.getResearcherImpactsByDepartment;
    setResearcherImpactsByDepartment(researcher_impacts_by_department);
  };

  const getFacultyArray = async () => {
    const department = await API.graphql({
      query: getAllFaculty,
    });
    let allFacultyArray = department.data.getAllFaculty;
    setAllFaculty(allFacultyArray);
    setFacultyImpact(allFacultyArray[0]);
  };

  const getResearcherImpactByFaculty = async () => {
    const impacts = await API.graphql({
      query: getResearcherImpactsByFaculty,
      variables: { prime_faculty: facultyImpact },
    });
    let researcher_impacts_by_Faculty =
      impacts.data.getResearcherImpactsByFaculty;
    setResearcherImpactsByFaculty(researcher_impacts_by_Faculty);
  };

  const getOverallResearcherImpacts = async () => {
    const impacts = await API.graphql({
      query: getAllResearchersImpacts,
    });

    let allResearchImpactArray = impacts.data.getAllResearchersImpacts;
    setAllResearcherImpacts(allResearchImpactArray);
  };

  function changeDepartmentImpact(event) {
    setDepartmentImpact(event.target.value);
  }

  function changeFacultyToShowImpact(event) {
    setFacultyImpact(event.target.value);
  }

  useEffect(() => {
    Promise.all([
      getDeparmentArray(),
      getFacultyArray(),
      getOverallResearcherImpacts(),
    ]).then(() => {
      setPageLoaded(true);
    });
  }, []);

  useEffect(() => {
    getResearcherImpactByDepartment();
  }, [departmentImpact]);

  useEffect(() => {
    getResearcherImpactByFaculty();
  }, [facultyImpact]);

  function byDepartmentButton() {
    setShowByDepartment(true);
    setShowByFaculty(false);
    setShowOverallImpacts(false);
  }
  function byFacultyButton() {
    setShowByDepartment(false);
    setShowByFaculty(true);
    setShowOverallImpacts(false);
  }
  function overallImpactsButton() {
    setShowByDepartment(false);
    setShowByFaculty(false);
    setShowOverallImpacts(true);
  }

  return (
    <div>
      {!pageLoaded && <LoadingWheel />}
      {pageLoaded && (
        <div>
          <ImpactNavigation
            onClickFunctions={{
              byDepartmentButton,
              byFacultyButton,
              overallImpactsButton,
            }}
            enableOverallImpacts={false}
          />
          {showByDepartment && (
            <ResearcherImpactByDepartment
              allDepartments={allDepartments}
              researcherImpactsByDepartment={researcherImpactsByDepartment}
              changeDepartmentToShowImpact={changeDepartmentImpact}
              departmentToShowImpact={departmentImpact}
            />
          )}
          {showByFaculty && (
            <ImpactByFaculty
              allFaculty={allFaculty}
              researcherImpactsByFaculty={researcherImpactsByFaculty}
              changeFacultyToShowImpact={changeFacultyToShowImpact}
            />
          )}
        </div>
      )}
    </div>
  );
}
