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

const UpdatePubsLogTable = () => {
  const mockData = [
    { num_updated: 100, date: "Tue Aug 16 2022 13:59:37 GMT-0700" },
    { num_updated: 500, date: "Mon Aug 15 2022 13:59:37 GMT-0700" },
    { num_updated: 600, date: "Sun Aug 14 2022 13:59:37 GMT-0700" },
    { num_updated: 350, date: "Sat Aug 13 2022 13:59:37 GMT-0700" },
    { num_updated: 1000, date: "Fri Aug 12 2022 13:59:37 GMT-0700" },
  ];
  return (
    <TableContainer component={Paper}>
      <Table aria-label="update publications log table">
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: "#002145", fontWeight: 500 }}>
              Number of Publications Updated
            </TableCell>
            <TableCell sx={{ color: "#002145", fontWeight: 500 }}>
              Date Updated
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {mockData.map((data, index) => (
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
                  {data.num_updated}
                </Box>
              </TableCell>
              <TableCell>{data.date}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
export default UpdatePubsLogTable;
