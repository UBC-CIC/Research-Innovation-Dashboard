import React, { useState } from "react";
import { styled } from "@mui/material/styles";
import {
  Box,
  TableContainer,
  Table,
  TableCell,
  TableHead,
  TableRow,
  TableBody,
  Paper,
  Alert,
} from "@mui/material";

const StyledTableCell = styled(TableCell)`
  color: #002145;
  font-weight: 500;
`;

const FlaggedIds = () => {
  const mockData = [
    [
      {
        name: "Robert Carruthers",
        scopus_id: 12345,
        employee_id: 123840,
        faculty: "Faculty of Medicine",
        department: "Anesthesiology",
      },
      {
        name: "Robert Carruthers",
        scopus_id: 12345,
        employee_id: 203942,
        faculty: "Faculty of Medicine",
        department: "Family Medicine",
      },
      {
        name: "Robert Carruthers",
        scopus_id: 12345,
        employee_id: 234233,
        faculty: "Faculty of Medicine",
        department: "Neuroscience",
      },
    ],
    [
      {
        name: "John Smith",
        scopus_id: 34234,
        employee_id: 990983,
        faculty: "Faculty of Arts",
        department: "Anthropology",
      },
      {
        name: "John Smith",
        scopus_id: 34234,
        employee_id: 273894,
        faculty: "Faculty of Arts",
        department: "Sociology",
      },
      {
        name: "John Smith",
        scopus_id: 34234,
        employee_id: 283747,
        faculty: "Faculty of Arts",
        department: "Philosophy",
      },
    ],
  ];

  const renderIdTables = () => {
    return mockData.map((data, index) => {
      return (
        <TableContainer component={Paper} key={index}>
          <Table aria-label="Flagged Id table">
            <TableHead>
              <TableRow>
                <StyledTableCell>Researcher Name</StyledTableCell>
                <StyledTableCell>Scopus ID</StyledTableCell>
                <StyledTableCell>Employee ID</StyledTableCell>
                <StyledTableCell>Faculty</StyledTableCell>
                <StyledTableCell>Department</StyledTableCell>
                <StyledTableCell>Reason Flagged</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((researcher, index) => (
                <TableRow
                  key={index}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    <Box
                      sx={{
                        width: "150px",
                        overflow: "wrap",
                      }}
                    >
                      {researcher.name}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        width: "50px",
                        overflow: "wrap",
                      }}
                    >
                      {researcher.scopus_id}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        width: "50px",
                        overflow: "wrap",
                      }}
                    >
                      {researcher.employee_id}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        width: "150px",
                        overflow: "wrap",
                      }}
                    >
                      {researcher.faculty}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        width: "150px",
                        overflow: "wrap",
                      }}
                    >
                      {researcher.department}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        width: "200px",
                        overflow: "wrap",
                      }}
                    >
                      Conflicting Scopus ID
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "2em" }}>
      {mockData.length > 0 ? (
        <>
          <Alert severity="info">
            There are <strong>{mockData.length}</strong> researchers with
            flagged IDs
          </Alert>
          {renderIdTables()}
        </>
      ) : (
        <Alert severity="info">
          There are currently no researchers with flagged IDs
        </Alert>
      )}
    </Box>
  );
};

export default FlaggedIds;
