import React, { useState, useEffect } from "react";
import Joyride from 'react-joyride';

export default function Tutorial(props) {

    const [state, setState] = useState({
        steps: [
        ]
    });
    const [spotlightClicks, setSpotlightClicks] = useState(true);
    const [styles, setStyles] = useState({options:{primaryColor: '#1976d2'}})
    const [stepIndex, setStepIndex] = useState(0);
    const [spotlightPadding, setSpotlightPadding] = useState(0);

    //On page load get the faculties
    useEffect(() => {
        setState({
        steps: [
            {
                content: <h2>Welcome to the Knowledge Graph Tour</h2>,
                locale: { skip: <strong aria-label="skip">SKIP</strong> },
                placement: 'center',
                target: 'body',
            },
            {
                // locale: { skip: <strong aria-label="skip">SKIP</strong> },
                target: '#sidePanel',
                content: 'This section shows information on the graph. Click on the Graph Legend to learn about what the colors on the graph mean.',
                placement: "right-start",
            },
            {
                // locale: { skip: <strong aria-label="skip">SKIP</strong> },
                target: '#graph',
                content: "This is the Knowledge Graph Component. Click on a node in the graph to continue.",
            },
            {
                // locale: { skip: <strong aria-label="skip">SKIP</strong> },
                target: '#sidePanel',
                content: "After clicking on a node the researchers information is filled in on the side panel.",
                placement: "right-start",
            },
            {
                // locale: { skip: <strong aria-label="skip">SKIP</strong> },
                target: '#graph',
                content: "You can also learn about how researchers are connected. Click on a second researcher node to continue."
            },
            {
                // locale: { skip: <strong aria-label="skip">SKIP</strong> },
                target: '#sidePanel',
                content: "After clicking on a second researcher node the edge information is filled in on the side panel.",
                placement: "right-start",
            },
            {
                // locale: { skip: <strong aria-label="skip">SKIP</strong> },
                target: '#search-bar',
                content: "You can also select nodes by searching for researchers by name in the search bar.",
            },
            {
                // locale: { skip: <strong aria-label="skip">SKIP</strong> },
                target: '#filter-graph-button',
                content: "Finally you can filter the graph by faculty and researcher keywords. You can filter by a single keyword or by multiple keywords. To filter by multiple keywords enter in a comma separated list of keywords.",
            },
        ],
        })
        let firstTime = window.localStorage.getItem('firstTime');
        if(firstTime != "true") {
            props.setRun(true);
            console.log("hi")
            window.localStorage.setItem('firstTime', "true");            
        }
    }, [])

    useEffect(() => {
        console.log(stepIndex);
    }, [stepIndex])

    useEffect(() => {
        if(stepIndex == 2 && props.selectedNode && props.run){
            setTimeout(() => {
                setStepIndex(stepIndex+1)
            }, 1500);
        }
    }, [props.selectedNode])

    useEffect(() => {
        if(stepIndex == 4 && props.selectedEdge && props.run){
            setTimeout(() => {
                setStepIndex(stepIndex+1)
            }, 1500);
        }
    }, [props.selectedEdge])

    useEffect(() => {
        if(stepIndex == 7 && props.openFacultyFiltersDialog && props.run){
            setStepIndex(stepIndex+1);
        }
    }, [props.openFacultyFiltersDialog])

    function handleJoyrideCallback(CallBackProps) {
        const { action, index, status, type } = CallBackProps;

        console.log(action);
        console.log(index);
        console.log(status);
        console.log(type);

        if (index == 2 || index == 4) {
            setStyles({
                buttonNext: {
                    display: 'none',
                },
                options:{
                    primaryColor: '#1976d2',
                }
            })
        }
        else {
            setStyles({options:{primaryColor: '#1976d2'}})
        }

        if(index == 6) {
            props.setSelectedNode(null);
            props.setSelectedEdge(null);
        }

        if(action === "skip" || action === "close" || type == "tour:end") {
            setStepIndex(0);
            props.setRun(false);
        }
        else if(action === "next" && type == "step:after") {
            setStepIndex(index + 1);
        }
        else if(action === "prev" && type == "step:after") {
            console.log("prev here")
            setStepIndex(index -1);
        }
    }

    return (
        <Joyride steps={state.steps} run={props.run} 
            stepIndex={stepIndex} callback={handleJoyrideCallback}
            showProgress={true} showSkipButton={true}
            continuous={true} spotlightClicks={spotlightClicks}
            hideCloseButton={true} disableCloseOnEsc={true}
            styles={styles} spotlightPadding={spotlightPadding}
            />
    );
}