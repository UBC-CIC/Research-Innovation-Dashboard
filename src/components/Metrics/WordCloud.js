import React, { useState, useEffect } from "react";
import ReactWordcloud from "react-wordcloud";
import { select } from "d3-selection";
import { Typography, Slider, Box, CircularProgress } from "@mui/material";
import { API } from "aws-amplify";
import { wordCloud } from "../../graphql/queries";

import "tippy.js/dist/tippy.css";
import "tippy.js/animations/scale.css";

function getCallback(callback) {
  return function (word, event) {
    const isActive = callback !== "onWordMouseOut";
    const element = event.target;
    const text = select(element);
    text.on("click", () => {
      if (isActive) {
        window.open(`${window.location.origin}/%20/%20/%20/${word.text}`);
      }
    });
  };
}

const WordCloud = () => {
  const [words, setWords] = useState();
  const currentYear = new Date().getFullYear();
  const [displayedDateRange, setDisplayedDateRange] = useState([
    1908,
    currentYear,
  ]);
  const [selectedDateRange, setSelectedDateRange] =
    useState(displayedDateRange);
  const [loading, setLoading] = useState(false);
  const options = {
    colors: ["#0055B7", "#40B4E5", "#97D4E9"],
    enableTooltip: true,
    deterministic: true,
    fontFamily: "Arial",
    fontSizes: [5, 60],
    fontStyle: "normal",
    fontWeight: "normal",
    padding: 1,
    rotations: 2,
    rotationAngles: [0, 0],
    scale: "sqrt",
    spiral: "archimedean",
    transitionDuration: 2,
  };

  const callbacks = {
    getWordTooltip: (word) =>
      `The word "${word.text}" appears ${word.value} times. Click to search for the keyword "${word.text}"`,
    onWordClick: getCallback("onWordClick"),
    onWordMouseOut: getCallback("onWordMouseOut"),
    onWordMouseOver: getCallback("onWordMouseOver"),
  };

  const wordCloudQuery = async () => {
    const wordCloudResult = await API.graphql({
      query: wordCloud,
      variables: { gte: selectedDateRange[0], lte: selectedDateRange[1] },
    });
    setWords(wordCloudResult.data.wordCloud);
  };

  useEffect(() => {
    setLoading(false);
  }, [words]);

  useEffect(() => {
    setLoading(true);
    selectedDateRange && wordCloudQuery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDateRange]);

  const handleChange = (event, newValue) => {
    setSelectedDateRange(newValue);
  };

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <Typography variant="h4" align="center">
        Top 100 Keywords for all Research
      </Typography>
      {!words ? (
        <CircularProgress sx={{ py: "5em" }} />
      ) : (
        displayedDateRange && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              mt: "2em",
              alignItems: "center",
              width: "100%",
            }}
          >
            <Box
              sx={{
                width: "30%",
                m: "1.5em 0 2em 0",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  justifyContent: "center",
                }}
              >
                <Typography>Date Range:&nbsp;</Typography>
                <Typography sx={{ color: "#0055B7", fontWeight: 700 }}>
                  {displayedDateRange[0]} - {displayedDateRange[1]}
                </Typography>
              </Box>
              <Slider
                getAriaLabel={() => "Date range"}
                value={displayedDateRange}
                onChange={(e, val) => setDisplayedDateRange(val)}
                onChangeCommitted={handleChange}
                valueLabelDisplay="auto"
                min={1908}
                max={currentYear}
              />
            </Box>
            {words.length === 0 ? (
              <Typography sx={{ my: "4em" }}>
                There is no data available for the current date range
              </Typography>
            ) : (
              <Box
                sx={{
                  height: "300px",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                }}
              >
                {loading ? (
                  <CircularProgress />
                ) : (
                  <ReactWordcloud
                    callbacks={callbacks}
                    options={options}
                    words={words}
                  />
                )}
              </Box>
            )}
          </Box>
        )
      )}
    </Box>
  );
};

export default WordCloud;
