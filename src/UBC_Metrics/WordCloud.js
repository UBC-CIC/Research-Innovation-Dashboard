import React, { useState, useEffect } from "react";
import ReactWordcloud from "react-wordcloud";
import { select } from "d3-selection";
import { Typography, Slider, Box, CircularProgress } from "@mui/material";
import { API } from "aws-amplify";
import { wordCloud } from "../graphql/queries";

import "tippy.js/dist/tippy.css";
import "tippy.js/animations/scale.css";

function getCallback(callback) {
  return function (word, event) {
    const isActive = callback !== "onWordMouseOut";
    const element = event.target;
    const text = select(element);
    text.on("click", () => {
      if (isActive) {
        window.open(`${window.location.origin}/${word.text}`);
      }
    });
  };
}

const WordCloud = () => {
  const [words, setWords] = useState([]);
  const currentYear = new Date().getFullYear();
  const [dateRange, setDateRange] = useState([1908, currentYear]);
  const [loading, setLoading] = useState(false);
  const options = {
    colors: ["#23D2DC", "#2376DC", "#23DC89"],
    enableTooltip: true,
    deterministic: true,
    fontFamily: "Arial",
    fontSizes: [5, 60],
    fontStyle: "normal",
    fontWeight: "normal",
    padding: 1,
    rotations: 3,
    rotationAngles: [0, 0],
    scale: "sqrt",
    spiral: "archimedean",
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
      variables: { gte: dateRange[0], lte: dateRange[1] },
    });
    setWords(wordCloudResult.data.wordCloud);
  };

  useEffect(() => {
    setLoading(false);
  }, [words]);

  useEffect(() => {
    setLoading(true);
    dateRange && setTimeout(wordCloudQuery(), 700);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const handleChange = (event, newValue) => {
    setDateRange(newValue);
  };

  const valueText = (value) => {
    return `${value}°C`;
  };

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <Typography variant="h4" align="center">
        Top 100 Keywords In UBC Research
      </Typography>
      {words.length === 0 ? (
        <CircularProgress sx={{ py: "5em" }} />
      ) : (
        dateRange && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              pt: "2em",
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
                  {dateRange[0]} - {dateRange[1]}
                </Typography>
              </Box>
              <Slider
                getAriaLabel={() => "Date range"}
                value={dateRange}
                onChange={handleChange}
                valueLabelDisplay="auto"
                getAriaValueText={valueText}
                min={1908}
                max={currentYear}
              />
            </Box>
            <Box sx={{
              height: "300px",
              width: "100%",
              display: "flex",
              alignItems: "center",
              flexDirection: "row",
            }}>
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
          </Box>
        )
      )}
    </Box>
  );
};

export default WordCloud;
