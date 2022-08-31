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
import { getUpdatePublicationsLogs } from "../../graphql/queries";

const StyledTableCell = styled(TableCell)`
  color: #002145;
  font-weight: 500;
`;

const UpdatePubsLogTable = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [updatePublicationLogs, setUpdatePublicationLogs] = useState();

  useEffect(() => {
    const getLogs = async () => {
      const res = await API.graphql({
        query: getUpdatePublicationsLogs,
      });
      const publicationLogs = res.data.getUpdatePublicationsLogs;
      //convert unix timestamps from response into readable dates
      const publicationLogConvertedDates = publicationLogs.map((entry) => {
        const unixTimestamp = entry.date_updated;
        //multiply unix timestamp to milliseconds by multiplying by 1000, then create a new date object with the returned value
        const dateObject = new Date(unixTimestamp * 1000);
        const formattedDate = dateObject.toLocaleString();
        return {
          number_of_publications_updated: entry.number_of_publications_updated,
          date_updated: formattedDate,
        };
      });
      setUpdatePublicationLogs(publicationLogConvertedDates.reverse());
    };
    getLogs();
  }, []);

  // avoid a layout jump in the table when reaching the last page with empty rows
  let emptyRows =
    page <= 0
      ? 0
      : Math.max(0, (1 + page) * rowsPerPage - updatePublicationLogs.length);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    updatePublicationLogs && (
      <>
        <TableContainer component={Paper}>
          <Table aria-label="update publications log table">
            <TableHead>
              <TableRow>
                <StyledTableCell>
                  Number of Publications Updated
                </StyledTableCell>
                <StyledTableCell>Date Updated</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(rowsPerPage > 0
                ? updatePublicationLogs.slice(
                    page * rowsPerPage,
                    page * rowsPerPage + rowsPerPage
                  )
                : updatePublicationLogs
              ).map((data, index) => (
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
                      {data.number_of_publications_updated}
                    </Box>
                  </TableCell>
                  <TableCell>{data.date_updated}</TableCell>
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
        {/* render the correct pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10]}
          component="div"
          count={updatePublicationLogs && updatePublicationLogs.length}
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
export default UpdatePubsLogTable;
