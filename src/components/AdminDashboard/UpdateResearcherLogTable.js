import React, { useState, useEffect } from "react";
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Box,
} from "@mui/material";

const UpdateResearcherLogTable = () => {
  const mockData = [
    { name: "Christy Lam", last_updated: "Tue Aug 16 2022 13:59:37 GMT-0700" },
    { name: "John Lee", last_updated: "Mon Aug 15 2022 13:59:37 GMT-0700" },
    { name: "Test Test", last_updated: "Sun Aug 14 2022 13:59:37 GMT-0700" },
    { name: "Hao Li", last_updated: "Sat Aug 13 2022 13:59:37 GMT-0700" },
    {
      name: "Ian Moss",
      last_updated: "Fri Aug 12 2022 13:59:37 GMT-0700",
    },
  ];
  return (
    <TableContainer component={Paper}>
      <Table aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: "#002145", fontWeight: 500 }}>
              Researcher Name
            </TableCell>
            <TableCell sx={{ color: "#002145", fontWeight: 500 }}>
              Date Updated
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {mockData.map((researcher, index) => (
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
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default UpdateResearcherLogTable;
