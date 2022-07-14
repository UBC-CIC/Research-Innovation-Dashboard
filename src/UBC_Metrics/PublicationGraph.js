import {
  Box,
  Paper,
  Typography,
  Menu,
  MenuItem,
  Tooltip,
  IconButton,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { Chart } from "react-chartjs-2";
import FilterListIcon from "@mui/icons-material/FilterList";
import "chart.js/auto";
import { API } from "aws-amplify";
import {
  totalPublicationPerYear,
  facultyMetrics,
  getAllFaculty,
} from "../graphql/queries";

const PublicationGraph = () => {
  const [totalPublicationData, setTotalPublicationData] = useState();
  const [facultyData, setFacultyData] = useState();
  const [facultyOptions, setFacultyOptions] = useState();
  const [selectedFaculty, setSelectedFaculty] = useState();
  const [openFilterMenu, setOpenFilterMenu] = useState(false);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);

  /** functions for filter menu */
  const handleClick = (e) => {
    setFilterMenuAnchor(e.currentTarget);
    setOpenFilterMenu(true);
  };

  const handleClose = () => {
    setFilterMenuAnchor(null);
    setOpenFilterMenu(false);
  };

  const getfacultyOptions = async () => {
    const facultyRes = await API.graphql({
      query: getAllFaculty,
    });
    const allFacultyArray = facultyRes.data.getAllFaculty;
    setFacultyOptions(allFacultyArray);
    setSelectedFaculty(allFacultyArray[0]);
  };

  // get data for bar chart (total publications per year for all faculties)
  const getTotalPublicationData = async () => {
    const totalDataRes = await API.graphql({
      query: totalPublicationPerYear,
    });
    const totalData = totalDataRes.data.totalPublicationPerYear;
    const pastTenYearsData = totalData.splice(1, 11).reverse();
    setTotalPublicationData(pastTenYearsData);
  };

  // get data for line chart every time a new faculty is selected (total publication per year for specific faculty)
  const getFacultyData = async () => {
    const facultyMetricDataRes = await API.graphql({
      query: facultyMetrics,
      variables: { faculty: selectedFaculty && selectedFaculty },
    });
    const facultyMetricData = facultyMetricDataRes.data.facultyMetrics;
    const pastTenYearsFacultyMetricData =
      facultyMetricData[0].year === "2023"
        ? facultyMetricData.splice(1, 11)
        : facultyMetricData.splice(0, 11);
    const chronologicalData = pastTenYearsFacultyMetricData.reverse();
    setFacultyData(chronologicalData);
  };

  useEffect(() => {
    getfacultyOptions();
    getTotalPublicationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    getFacultyData();
  }, [selectedFaculty]);

  return (
    totalPublicationData &&
    facultyData && (
      <Paper sx={{ p: "1em" }} elevation={0}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: "1.5em",
          }}
        >
          <Typography variant="h5">
            Total Publications At UBC Per Year{" "}
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Tooltip title="Apply Filter">
              <IconButton onClick={handleClick}>
                <FilterListIcon />
              </IconButton>
            </Tooltip>
            <Menu
              id="filter-menu"
              open={openFilterMenu}
              anchorEl={filterMenuAnchor}
              onClose={handleClose}
              sx={{ height: "60%" }}
            >
              {facultyOptions &&
                facultyOptions.map((filter, index) => (
                  <MenuItem
                    key={index}
                    onClick={() => setSelectedFaculty(filter)}
                    style={
                      selectedFaculty === filter
                        ? { backgroundColor: "#ededed" }
                        : {}
                    }
                  >
                    {filter}
                  </MenuItem>
                ))}
            </Menu>
          </Box>
        </Box>
        {totalPublicationData && facultyData && (
          <Chart
            type="bar"
            data={{
              labels: totalPublicationData.map((data) => data.year_published),
              datasets: [
                {
                  type: "line",
                  label: `Number of Publications for ${selectedFaculty}`,
                  data: facultyData.map(
                    (dataPoint) => dataPoint.num_publications
                  ),
                  backgroundColor: "#002145",
                  borderColor: "#0055B7",
                },
                {
                  type: "bar",
                  label: "Total Publications for All Faculties",
                  data: totalPublicationData.map(
                    (dataPoint) => dataPoint.count
                  ),
                  backgroundColor: "#97D4E9",
                },
              ],
            }}
            options={{
              scales: {
                x: {
                  stacked: true,
                  title: {
                    display: true,
                    text: "Year",
                    padding: {
                      top: 20,
                    },
                  },
                },
                y: {
                  stacked: true,
                  title: {
                    display: true,
                    text: "Number of Publications",
                    padding: {
                      bottom: 20,
                    },
                  },
                },
              },
              plugins: {
                responsive: true,
                maintainAspectRatio: false,
              },
            }}
            height={369}
            width={900}
          />
        )}
      </Paper>
    )
  );
};

export default PublicationGraph;
