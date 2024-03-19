const Graph = require("graphology").Graph;
const random = require('graphology-layout').random
const forceAtlas2 = require('graphology-layout-forceatlas2')
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3"); 
const { fromUtf8 } = require("@aws-sdk/util-utf8-node");

const client = new S3Client();

exports.handler = async (event) => {
    // Fetch data from S3
    const inputNodes = {
        "Bucket": process.env.GRAPH_BUCKET,
        "Key": "nodes.json"
    }
    
    const inputEdges = {
        "Bucket": process.env.GRAPH_BUCKET,
        "Key": "edges.json"
    }
    
    let command = new GetObjectCommand(inputNodes);
    const responseNodes = await client.send(command);
    const bodyStringNodes = JSON.parse(await responseNodes.Body.transformToString());
    
    command = new GetObjectCommand(inputEdges);
    const responseEdges = await client.send(command);
    const bodyStringEdges = JSON.parse(await responseEdges.Body.transformToString());
    
    // Create the graph
    const graph = Graph.from({
        attributes: {},
        nodes: bodyStringNodes,
        edges: bodyStringEdges
    })
    
    graph.forEachNode((key,attributes)=>{
            const numOfNeighbors = graph.neighbors(key).length
            const size = 3-20/(numOfNeighbors+9)
    
            if(size>0){
              graph.setNodeAttribute(key,'size',size)
            }
    })
    
    // Assign random coordinates to begin with
    random.assign(graph);
    forceAtlas2.assign(graph, {iterations: 100});
    
    // One way to get full nodes from the graphology class
    const nodes = JSON.parse(JSON.stringify(graph)).nodes
    
    const output = {
        "Bucket": process.env.GRAPH_BUCKET,
        "Key": "nodes.json",
        "Body": fromUtf8(JSON.stringify(nodes))
    }
    
    command = new PutObjectCommand(output)
    const responseOutput = await client.send(command);
    
    return "Upload to S3 successful!"
}
