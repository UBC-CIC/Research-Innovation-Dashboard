import React, { useState, useEffect } from "react";
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
import { API } from "aws-amplify";
import { getFlaggedIds } from "../../graphql/queries";

const StyledTableCell = styled(TableCell)`
  color: #002145;
  font-weight: 500;
`;

const FlaggedIds = () => {
  const [flaggedData, setFlaggedData] = useState();

  useEffect(() => {
    const getFlaggedData = async () => {
      const res = await API.graphql({
        query: getFlaggedIds,
      });
      setFlaggedData(res.data.getFlaggedIds);
    };
    getFlaggedData();
  }, []);

  const renderIdTables = () => {
    return flaggedData.map((data, index) => {
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
                      {researcher.preferred_name}
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
                      {researcher.institution_user_id}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        width: "150px",
                        overflow: "wrap",
                      }}
                    >
                      {researcher.prime_faculty}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        width: "150px",
                        overflow: "wrap",
                      }}
                    >
                      {researcher.prime_department}
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
      {flaggedData && flaggedData.length > 0 ? (
        <>
          <Alert severity="info">
            There are <strong>{flaggedData.length}</strong> researchers with
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
