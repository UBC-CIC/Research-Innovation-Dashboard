import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Autocomplete,
  autocompleteClasses,
  TextField,
} from "@mui/material";
import { API } from "aws-amplify";
import { getAllDistinctJournals } from "../../../graphql/queries";
import { VariableSizeList } from "react-window";
import useMediaQuery from "@mui/material/useMediaQuery";
import Popper from "@mui/material/Popper";
import { useTheme, styled } from "@mui/material/styles";

const PublicationFilters = ({ selectedJournals, setSelectedJournals, searchYet }) => {
  const [journalOptions, setJournalOptions] = useState();

  const LISTBOX_PADDING = 8; // px

  function renderRow(props) {
    const { data, index } = props;
    const dataSet = data[index];

    return (
      <Typography
        component="li"
        {...dataSet[0]}
        sx={{ wordWrap: "break-word" }}
      >
        {dataSet[1]}
      </Typography>
    );
  }

  const OuterElementContext = React.createContext({});

  const OuterElementType = React.forwardRef((props, ref) => {
    const outerProps = React.useContext(OuterElementContext);
    return <div ref={ref} {...props} {...outerProps} />;
  });

  function useResetCache(data) {
    const ref = React.useRef(null);
    React.useEffect(() => {
      if (ref.current != null) {
        ref.current.resetAfterIndex(0, true);
      }
    }, [data]);
    return ref;
  }

  // Adapter for react-window
  const ListboxComponent = React.forwardRef(function ListboxComponent(
    props,
    ref
  ) {
    const { children, ...other } = props;
    const itemData = [];
    children.forEach((item) => {
      itemData.push(item);
      itemData.push(...(item.children || []));
    });

    const theme = useTheme();
    const smUp = useMediaQuery(theme.breakpoints.up("sm"), {
      noSsr: true,
    });

    const itemCount = itemData.length;
    const itemSize = smUp ? 30 : 48;

    const getChildSize = (child) => {
      if (child.hasOwnProperty("group")) {
        return 48;
      }

      return itemSize;
    };

    const getHeight = () => {
      if (itemCount > 5) {
        return 5 * itemSize;
      }
      return itemData.map(getChildSize).reduce((a, b) => a + b, 0);
    };

    const gridRef = useResetCache(itemCount);

    return (
      <div ref={ref}>
        <OuterElementContext.Provider value={other}>
          <VariableSizeList
            itemData={itemData}
            height={getHeight() + 2 * LISTBOX_PADDING}
            width="100%"
            ref={gridRef}
            outerElementType={OuterElementType}
            innerElementType="ul"
            itemSize={(index) => getChildSize(itemData[index])}
            overscanCount={5}
            itemCount={itemCount}
          >
            {renderRow}
          </VariableSizeList>
        </OuterElementContext.Provider>
      </div>
    );
  });

  const StyledPopper = styled(Popper)({
    [`& .${autocompleteClasses.listbox}`]: {
      boxSizing: "border-box",
      "& ul": {
        padding: 0,
        margin: 0,
      },
    },
  });

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
    setSelectedJournals(journal);
  };

  const renderJournalOptions = () => {
    return (
      journalOptions && (
        <Autocomplete
          multiple
          options={journalOptions}
          getOptionLabel={(journal) => journal}
          defaultValue={selectedJournals && selectedJournals}
          disableListWrap
          PopperComponent={StyledPopper}
          ListboxComponent={ListboxComponent}
          onChange={(e, journal) => handleCheckJournal(e, journal)}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="standard"
              label="All Journals"
              placeholder="Selected"
            />
          )}
          renderOption={(props, option) => [props, option]}
          sx={{ width: "100%", alignSelf: "center" }}
        />
      )
    );
  };

  return (searchYet &&
    <Box sx={{ display: "flex", flexDirection: "column", ml: "1em" }}>
      <Typography variant="h6">Filter for Publications:</Typography>
      <Typography sx={{ my: "1em", color: "#0055B7" }}>Journal</Typography>
      {renderJournalOptions()}
    </Box>
  );
};

export default PublicationFilters;
