import React, { useEffect, useState } from "react";
import { Box, Typography, Autocomplete, Chip, TextField } from "@mui/material";
import { API } from "aws-amplify";
import { getAllDistinctJournals } from "../graphql/queries";
import { CheckBox } from "@mui/icons-material";

const PublicationFilters = ({ selectedJournals, setSelectedJournals }) => {
  const [journalOptions, setJournalOptions] = useState();

  useEffect(() => {
    const getFilterOptions = async () => {
      const res = await API.graphql({
        query: getAllDistinctJournals,
      });
      const allJournals = res.data.getAllDistinctJournals;
      setJournalOptions(allJournals);
    };
    getFilterOptions();
  }, []);

  const handleCheckJournal = (e, journal) => {
    console.log(journal);
    // if (e.target.checked) {
    //   setSelectedJournals((prev) => [...prev, journal]);
    // } else {
    //   setSelectedJournals(
    //     selectedJournals.filter(
    //       (selectedJournal) => selectedJournal !== journal
    //     )
    //   );
    // }
  };

  const renderJournalOptions = () => {
    return (
      journalOptions && (
        <Autocomplete
          multiple
          id="tags-standard"
          options={journalOptions}
          getOptionLabel={(journal) => journal}
          ListboxProps={{ style: { maxHeight: "15rem" } }}
          onChange={(e, journal) => handleCheckJournal(e, journal)}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="standard"
              label="All Journals"
              placeholder="Selected"
            />
          )}
          sx={{ width: "90%", alignSelf: "center" }}
        />
      )
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", ml: "1em" }}>
      <Typography variant="h6">Filter for Publications:</Typography>
      <Typography sx={{ my: "1em", color: "#0055B7" }}>Journal</Typography>
      {renderJournalOptions()}
    </Box>
  );
};

export default PublicationFilters;
