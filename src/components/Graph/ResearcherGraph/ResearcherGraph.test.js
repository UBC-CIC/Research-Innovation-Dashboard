import {render,screen} from '@testing-library/react';
import {GraphStatusMessage, SidePanel} from './ResearcherGraph';
jest.mock("./helpers/DepthSelection", ()=> () => {  
  return <mock-depthselection data-testid="depthselection" />;
});

describe('GraphStatusMessage', ()=>{
    test('Loading state displays spinner and messaging', () => {
        const progress = 10;
        const state= "loading";
        render(<GraphStatusMessage state={state} progress={progress}/>);
    
        expect(screen.queryByText('Graph loading in progress...')).not.toBeNull();
        expect(screen.queryByText('This might take a moment')).not.toBeNull();
        expect(screen.queryByRole("progressbar").getAttribute("aria-valuenow")).toEqual(progress.toString());
        expect(screen.queryByText(progress.toString()+"%")).not.toBeNull();
    });
    
    test('Empty state displays messaging and no spinner', () => {
        const progress = 90;
        const state= "empty";
        render(<GraphStatusMessage state={state} progress={progress}/>);
    
        expect(screen.queryByText('No results found')).not.toBeNull();
        expect(screen.queryByText("Change the graph's filters to view more data.")).not.toBeNull();
        expect(screen.queryByRole("progressbar")).toBeNull;
        expect(screen.queryByText(progress.toString()+"%")).toBeNull();
    });
});
describe('SidePanel', ()=>{

  const selectedResearcher = {
    department: 'Dept1',
    email: 'test@email.com',
    faculty: 'Faculty1',
    firstName: 'John',
    id: '34234256',
    keywords: 'math, AI',
    lastName: 'Smith',
    rank: 'Prof'
  }
  test('Legend shows all faculty option when no faculties filtered',()=>{
    const facultyOptions = ["Faculty1","Faculty2","Faculty3"];
    const facultiesFiltered = [];
    render(<SidePanel selectedNode={null} selectedEdge={null}
        facultyOptions={facultyOptions} currentlyAppliedFaculties={facultiesFiltered}
        selectedResearcher={null} similarResearchers={null} 
        edgeResearcherOne={null} edgeResearcherTwo={null} sharedPublications={null}/>);

    expect(screen.queryByText('Graph Legend')).not.toBeNull(); //legend shown
    facultyOptions.forEach((faculty)=>{
        expect(screen.queryByText(faculty)).not.toBeNull(); //every faculty is shown 
    })
  })

  test('Legend only shows applied faculties when faculties filtered',()=>{
    const facultyOptions = ["Faculty1","Faculty2","Faculty3"];
    const facultiesFiltered = ["Faculty2"];
    render(<SidePanel selectedNode={null} selectedEdge={null}
        facultyOptions={facultyOptions} currentlyAppliedFaculties={facultiesFiltered}
        selectedResearcher={null} similarResearchers={null} 
        edgeResearcherOne={null} edgeResearcherTwo={null} sharedPublications={null}/>);

    expect(screen.queryByText('Graph Legend')).not.toBeNull(); //legend shown
    facultyOptions.forEach((faculty)=>{
      if(facultiesFiltered.includes(faculty)){
        expect(screen.queryByText(faculty)).not.toBeNull(); 
      } else {
        expect(screen.queryByText(faculty)).toBeNull(); 
      }
    })
  })
  
  test('No node or edge selected', () => {
    render(<SidePanel selectedNode={null} selectedEdge={null}
        facultyOptions={["Faculty1"]} currentlyAppliedFaculties={[]}
        selectedResearcher={null} similarResearchers={null} 
        edgeResearcherOne={null} edgeResearcherTwo={null} sharedPublications={null}/>);

    expect(screen.queryByText('Graph Legend')).not.toBeNull(); //legend shown
    expect(screen.queryByText('Similar Researchers')).toBeNull(); //Similar connections not shown
    expect(screen.queryByRole("button",{expanded:true})).toHaveTextContent('Graph Details');  //graph details is shown and expanded
    expect(screen.queryByText('Click on a node to view more information about the researcher')).not.toBeNull(); //graph details has message    
  });

  describe('In NodeSelection mode', ()=>{
      
    test('Correct accordions shown', () => {
        render(<SidePanel selectedNode={'34234256'} selectedEdge={null}
            facultyOptions={["Faculty1"]} currentlyAppliedFaculties={[]}
            selectedResearcher={null} similarResearchers={null} 
            edgeResearcherOne={null} edgeResearcherTwo={null} sharedPublications={null}/>);
        
        expect(screen.queryByText('Graph Legend')).not.toBeNull(); //legend shown
        expect(screen.queryByText('Similar Researchers')).not.toBeNull(); //Similar connections shown
        expect(screen.queryByRole("button",{expanded:true})).toHaveTextContent('Graph Details');  //graph details is shown and expanded
    });

    test('if selected researcher info is null spinner shown', () => {
        render(<SidePanel selectedNode={'34234256'} selectedEdge={null}
            facultyOptions={["Faculty1"]} currentlyAppliedFaculties={[]}
            selectedResearcher={null} similarResearchers={null} 
            edgeResearcherOne={null} edgeResearcherTwo={null} sharedPublications={null}/>);
        
        expect(screen.queryAllByRole("progressbar")).toHaveLength(1);     
    });

    test('if selected researcher information exists, it is shown', () => {
      
      const { queryByTestId } = render(<SidePanel selectedNode={'34234256'} selectedEdge={null}
                      facultyOptions={["Faculty2"]} currentlyAppliedFaculties={[]}
                      selectedResearcher={selectedResearcher} similarResearchers={null} 
                      edgeResearcherOne={null} edgeResearcherTwo={null} sharedPublications={null}/>);

      expect(screen.queryByText(selectedResearcher.firstName + " "+ selectedResearcher.lastName)).not.toBeNull(); //Name shown
      expect(screen.queryByText(selectedResearcher.rank)).not.toBeNull(); //Rank shown
      expect(screen.queryByText(selectedResearcher.faculty)).not.toBeNull(); //faculty shown
      expect(screen.queryByText(selectedResearcher.department)).not.toBeNull(); //department shown
      expect(screen.queryByText(selectedResearcher.id)).not.toBeNull(); //id shown
      expect(screen.queryByText(selectedResearcher.email)).not.toBeNull(); //email shown
      expect(queryByTestId('depthselection')).toBeInTheDocument(); //depth selection shown
    });

    test('if no similar researchers show messaging', () => {
      const similarResearchers =[]
      render(<SidePanel selectedNode={'34234256'} selectedEdge={null}
                      facultyOptions={["Faculty2"]} currentlyAppliedFaculties={[]}
                      selectedResearcher={selectedResearcher} similarResearchers={similarResearchers} 
                      edgeResearcherOne={null} edgeResearcherTwo={null} sharedPublications={null}/>);

      expect(screen.queryByText('No potential connections found.')).not.toBeNull();
      
    });

    test('if similar researchers is null spinner shown', () => {
      const similarResearchers = null;
      const {queryByTestId } = render(<SidePanel selectedNode={'34234256'} selectedEdge={null}
                      facultyOptions={["Faculty2"]} currentlyAppliedFaculties={[]}
                      selectedResearcher={selectedResearcher} similarResearchers={similarResearchers} 
                      edgeResearcherOne={null} edgeResearcherTwo={null} sharedPublications={null}/>);
      expect(queryByTestId('progressSpinner')).toBeInTheDocument(); 
    });

    test('if similar researchers exist, they are shown', () => {
      const similarResearchers =[
        {
          firstName:"Jane",
          lastName:"Smith",
          id:'38479283',
          faculty:'Faculty3',
          sharedKeywords: ['AI','Genetics','boats','waves','sound']
        },{
          firstName:"George",
          lastName:"Green",
          id:'38479453',
          faculty:'Faculty4',
          sharedKeywords: ['AI','lens','light','waves','camera','colors']},
      ];
      render(<SidePanel selectedNode={'34234256'} selectedEdge={null}
                      facultyOptions={["Faculty2"]} currentlyAppliedFaculties={[]}
                      selectedResearcher={selectedResearcher} similarResearchers={similarResearchers} 
                      edgeResearcherOne={null} edgeResearcherTwo={null} sharedPublications={null}/>);
      
      similarResearchers.forEach((researcher)=>{
      expect(screen.queryByText(researcher.firstName + " "+ researcher.lastName)).not.toBeNull(); //Name shown
      expect(screen.queryByText(researcher.faculty)).not.toBeNull(); //Name shown
      expect(screen.queryByText(`Keywords shared (${researcher.sharedKeywords.length}):`)).not.toBeNull(); //Name shown
      expect(screen.queryByText(researcher.sharedKeywords.join(", "))).not.toBeNull(); //Name shown
    });
    });
  });
  describe('In EdgeSelection mode', ()=>{

      const selectedResearcherTwo = {
        department: 'Dept2',
        email: 'test@email.com',
        faculty: 'Faculty2',
        firstName: 'Joe',
        id: '34244256',
        keywords: 'math, AI',
        lastName: 'Reed',
        rank: 'Prof'
      }

      test('Correct accordions shown', () => {
        render(<SidePanel selectedNode={'34234256'} selectedEdge={'34234256&&34244256'}
            facultyOptions={["Faculty1"]} currentlyAppliedFaculties={[]}
            selectedResearcher={selectedResearcher} similarResearchers={[]} 
            edgeResearcherOne={selectedResearcher} edgeResearcherTwo={selectedResearcherTwo} sharedPublications={[]}/>);
        
        expect(screen.queryByText('Graph Legend')).not.toBeNull(); //legend shown
        expect(screen.queryByText('Similar Researchers')).toBeNull(); //Similar connections not shown
        expect(screen.queryByRole("button",{expanded:true})).toHaveTextContent('Graph Details');  //graph details is shown and expanded
      });

      test('No sharedPublication yet (waiting for api response), displays spinner', () => {
        const sharedPublications = []
        render(<SidePanel selectedNode={'34234256'} selectedEdge={'34234256&&34244256'}
            facultyOptions={["Faculty1"]} currentlyAppliedFaculties={[]}
            selectedResearcher={selectedResearcher} similarResearchers={[]} 
            edgeResearcherOne={selectedResearcher} edgeResearcherTwo={selectedResearcherTwo} sharedPublications={sharedPublications}/>);
      
        expect(screen.queryAllByRole("progressbar")).toHaveLength(1);       
      });

      test('if sharedPublication exist, they are shown', () => {
        const sharedPublications = [
          {authors: 'J. Smith, J.Reed',
          journal: 'Science Journal',
          link:'www.google.com',
          title: 'A very good publication',
          yearPublished: '2018',
          },
          {authors: 'J. Smith, J.Reed',
          journal: 'Science Journal 2',
          link:'www.google.com',
          title: 'Another very good publication',
          yearPublished: '2019',
          },
          ]
        render(<SidePanel selectedNode={'34234256'} selectedEdge={'34234256&&34244256'}
            facultyOptions={["Faculty1"]} currentlyAppliedFaculties={[]}
            selectedResearcher={selectedResearcher} similarResearchers={[]} 
            edgeResearcherOne={selectedResearcher} edgeResearcherTwo={selectedResearcherTwo} sharedPublications={sharedPublications}/>);
        
        expect(screen.queryByText(selectedResearcher.firstName + " " + selectedResearcher.lastName +" &")).not.toBeNull();
        expect(screen.queryByText(selectedResearcherTwo.firstName + " " + selectedResearcherTwo.lastName)).not.toBeNull();
        expect(screen.queryByText(`Shared Publications (${sharedPublications.length})`)).not.toBeNull();
        
        sharedPublications.forEach((publication)=>{
          expect(screen.queryByText(publication.title)).not.toBeNull(); 
        });   
      });
  });
});
