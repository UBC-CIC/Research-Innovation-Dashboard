import React, { useState, useEffect } from "react";
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Paper,
  Box,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { API } from "aws-amplify";
import { lastUpdatedResearchersList } from "../../graphql/queries";

const StyledTableCell = styled(TableCell)`
  color: #002145;
  font-weight: 500;
`;

const UpdateResearcherLogTable = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [updatedResearchersList, setUpdatedResearchersList] = useState();

  useEffect(() => {
    const getLog = async () => {
      const res = await API.graphql({
        query: lastUpdatedResearchersList,
      });
      const researcherLog = res.data.lastUpdatedResearchersList;
      //convert unix timestamps from response into readable dates
      const researcherLogConvertedDates = researcherLog.map((entry) => {
        const unixTimestamp = entry.last_updated;
        //multiply unix timestamp to milliseconds by multiplying by 1000, then create a new date object with the returned value
        const dateObject = new Date(unixTimestamp * 1000);
        const formattedDate = dateObject.toLocaleString();
        return {
          preferred_name: entry.preferred_name,
          last_updated: formattedDate,
        };
      });
      setUpdatedResearchersList(researcherLogConvertedDates.reverse());
    };
    getLog();
  }, []);

  // avoid a layout jump in the table when reaching the last page with empty rows
  let emptyRows =
    page <= 0
      ? 0
      : Math.max(0, (1 + page) * rowsPerPage - updatedResearchersList.length);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    updatedResearchersList && (
      <>
        <TableContainer component={Paper}>
          <Table aria-label="simple table">
            <TableHead>
              <TableRow>
                <StyledTableCell>Researcher Name</StyledTableCell>
                <StyledTableCell>Date Updated</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(rowsPerPage > 0
                ? updatedResearchersList.slice(
                    page * rowsPerPage,
                    page * rowsPerPage + rowsPerPage
                  )
                : updatedResearchersList
              ).map((researcher, index) => (
                <TableRow
                  key={index}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    <Box
                      sx={{
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        width: "250px",
                        overflow: "hidden",
                      }}
                    >
                      {researcher.preferred_name}
                    </Box>
                  </TableCell>
                  <TableCell>{researcher.last_updated}</TableCell>
                </TableRow>
              ))}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10]}
          component="div"
          count={
            lastUpdatedResearchersList && lastUpdatedResearchersList.length
          }
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          showFirstButton
          showLastButton
        />
      </>
    )
  );
};

export default UpdateResearcherLogTable;
