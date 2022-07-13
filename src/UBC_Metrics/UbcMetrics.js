import * as React from "react";
import SearchIcon from '@mui/icons-material/Search';
import InputBase from '@mui/material/InputBase';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import {useParams} from "react-router-dom";
import ReactWordcloud from 'react-wordcloud';
import DoughnutChart from "./DoughnutChart";
import BarGraph from "./BarGraph";

import { API } from 'aws-amplify';

import {
    wordCloud,
    allPublicationsPerFacultyQuery,
} from '../graphql/queries';



const options = {
    colors: ["#23D2DC", "#2376DC", "#23DC89"],
    enableTooltip: false,
    deterministic: true,
    fontFamily: "Arial",
    fontSizes: [5, 60],
    fontStyle: "normal",
    fontWeight: "normal",
    padding: 1,
    rotations: 3,
    rotationAngles: [0, 0],
    scale: "sqrt",
    spiral: "archimedean"
};

export default function UbcMetrics(props){
    const [words, setWords] = useState([]);
    const [facultyList, setFacultyList] = useState([]);
    const [facultyPublicationsOverall, setFacultyPublicationsOverall] = useState([]);


    const wordCloudQuery = async () => {
        const wordCloudResult = await API.graphql({
            query: wordCloud
        });
        setWords(wordCloudResult.data.wordCloud);
    }
    const allPublicationsPerFacultyFunction = async () => {
        const queryResult = await API.graphql({
            query: allPublicationsPerFacultyQuery
        });

        let facList = [];
        let facOverallPubs = [];

        let result = queryResult.data.allPublicationsPerFacultyQuery;

        for(let i = 0; i<result.length; i++){
            facList.push(result[i].faculty);
            facOverallPubs.push(result[i].sum);
        }
        setFacultyList(facList);
        setFacultyPublicationsOverall(facOverallPubs);
    }

    useEffect(() => {
        wordCloudQuery();
        allPublicationsPerFacultyFunction();
    }, []);

    return(
        <div style={{ height: 500, width: "100%" }}>
            {/* <ReactWordcloud options={options} words={words} />
            <DoughnutChart labels={facultyList} data={facultyPublicationsOverall} title={"Pubs Graph"}/> */}
        </div>
    );
}