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

const StyledTableCell = styled(TableCell)`
  color: #002145;
  font-weight: 500;
`;

const UpdateResearcherLogTable = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const mockData = [
    { name: "Christy Lam", last_updated: "Tue Aug 16 2022 13:59:37 GMT-0700" },
    { name: "John Lee", last_updated: "Mon Aug 15 2022 13:59:37 GMT-0700" },
    { name: "Test Test", last_updated: "Sun Aug 14 2022 13:59:37 GMT-0700" },
    { name: "Hao Li", last_updated: "Sat Aug 13 2022 13:59:37 GMT-0700" },
    {
      name: "Ian Moss",
      last_updated: "Fri Aug 12 2022 13:59:37 GMT-0700",
    },
    {
      name: "John Smith",
      last_updated: "Fri Aug 12 2022 13:59:37 GMT-0700",
    },
    {
      name: "Jane Moss",
      last_updated: "Fri Aug 12 2022 13:59:37 GMT-0700",
    },
  ];

  // avoid a layout jump in the table when reaching the last page with empty rows
  let emptyRows =
    page <= 0 ? 0 : Math.max(0, (1 + page) * rowsPerPage - mockData.length);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
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
              ? mockData.slice(
                  page * rowsPerPage,
                  page * rowsPerPage + rowsPerPage
                )
              : mockData
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
                    {researcher.name}
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
        count={mockData && mockData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        showFirstButton
        showLastButton
      />
    </>
  );
};

export default UpdateResearcherLogTable;
