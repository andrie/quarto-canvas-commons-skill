// Expected project layout (see skills/motion-canvas-r-code/SKILL.md):
//   animations/src/lib                    symlink to skills/canvas-commons-library (styles, Database, pulse)
//   animations/src/components/RHighlighter.ts   copied from skills/motion-canvas-r-code/components/
//   animations/src/lezer-r.d.ts           copied from skills/motion-canvas-r-code/assets/
import {makeScene2D} from '@canvas-commons/2d';
import {createRef, waitFor, all, easeInCubic, easeOutCubic} from '@canvas-commons/core';
import {Rect, Txt, Line, Circle, Code, Layout} from '@canvas-commons/2d';
import {Posit, Colors} from '../lib/styles';
import {parser} from 'lezer-r';
import {Database} from '../lib/components/Database';
import {RHighlighter} from '../components/RHighlighter';
import {pulse} from '../lib/utils/pulse';


export default makeScene2D(function* (view) {
  // Create custom R highlighter with direct node type mapping
  const rHighlighter = new RHighlighter(parser, {
    default: Colors.TEXT,           // Base text color (Posit blue)
    identifier: Posit.orange,       // Variable names
    function: Colors.FUNCTION,      // Function names (yellow)
    keyword: Colors.KEYWORD,        // Keywords like 'function' (pink)
    string: Colors.STRING,          // Strings (green)
    comment: Colors.COMMENT,        // Comments (gray)
    operator: Posit.teal,          // Operators like <-, $ (teal)
    number: Colors.NUMBER,          // Numbers (blue)
  });

  // Create references for our elements
  const codeComponent = createRef<Code>();

  // Diagram elements
  const userText = createRef<Txt>();
  const appLayout = createRef<Layout>();
  const llmLayout = createRef<Layout>();

  // Database component
  const database = createRef<Database>();

  // Connection lines
  const userToApp = createRef<Line>();
  const appToData = createRef<Line>();
  const appToLlm = createRef<Line>();

  const rCode = `
library(shiny)
library(ellmer)

# Define UI
ui <- fluidPage(
  textInput("user_input", "Enter your question:"),
  actionButton("submit", "Submit"),
  textOutput("llm_response")
)

# Define server logic
server <- function(input, output) {
  observeEvent(input$submit, {
    # Connect to data source
    data <- read_data()

    # Use ellmer to query LLM
    response <- ellmer_query(
      prompt = input$user_input,
      context = data
    )
    
    # Display response
    output$llm_response <- renderText(response)
    
  })
}
`;

  // Add elements to view
  view.add(
    <>

      {/* Code component with custom R syntax highlighting */}
      <Code
        ref={codeComponent}
        highlighter={rHighlighter}
        code={rCode}
        fontSize={24}
        fontFamily="'JetBrains Mono', 'Fira Code', monospace"
        fill={Colors.TEXT}
        position={[-800, 50]}
        width={850}
        textAlign="left"
        anchorX={-1}
      />

      {/* User - no box, just text */}
      <Txt
        ref={userText}
        fontSize={63}
        fontFamily="Helvetica"
        fill={Posit.blue}
        text="User"
        position={[100, -100]}
      />

      {/* App layout - box with centered text */}
      <Layout
        ref={appLayout}
        position={[425, -100]}
        size={[270, 135]}
        alignItems={'center'}
        justifyContent={'center'}
      >
        <Rect
          width={270}
          height={135}
          fill="rgba(0,0,0,0)"
          stroke={Posit.blue}
          lineWidth={6.75}
        />
        <Txt
          fontSize={63}
          fontFamily="Helvetica"
          fill={Posit.blue}
          text="App"
        />
      </Layout>

      {/* LLM layout - box with centered text */}
      <Layout
        ref={llmLayout}
        position={[800, -100]}
        size={[270, 135]}
        alignItems={'center'}
        justifyContent={'center'}
      >
        <Rect
          width={270}
          height={135}
          fill="rgba(0,0,0,0)"
          stroke={Posit.blue}
          lineWidth={6.75}
        />
        <Txt
          fontSize={63}
          fontFamily="Helvetica"
          fill={Posit.blue}
          text="LLM"
        />
      </Layout>

      {/* Database component - 3D database cylinder */}
      <Database
        ref={database}
        size={[150, 150]}
        stroke={Posit.blue}
        lineWidth={6.75}
        position={[425, 150]}
      />

      {/* Connection lines - bidirectional like SVG */}
      <Line
        ref={userToApp}
        points={[
          () => userText().right(),
          () => appLayout().left()
        ]}
        stroke={Posit.blue}
        lineWidth={4.5}
        startArrow
        endArrow
        arrowSize={18}
      />

      <Line
        ref={appToLlm}
        points={[
          () => appLayout().right(),
          () => llmLayout().left()
        ]}
        stroke={Posit.blue}
        lineWidth={4.5}
        startArrow
        endArrow
        arrowSize={18}
      />

      <Line
        ref={appToData}
        points={[
          () => appLayout().bottom(),
          () => database().top()
        ]}
        stroke={Posit.blue}
        lineWidth={4.5}
        startArrow
        endArrow
        arrowSize={18}
      />
    </>
  );

  // Start with empty code
  yield* codeComponent().code('', 0);

  // Pulse the app and llm layouts
  // yield* pulse(appLayout(), {duration: 1});
  // yield* pulse(database(), {duration: 1});
  // yield* pulse(llmLayout(), {duration: 1});


  // Animate code appearing line by line

  // Split the R code into lines
  const lines = rCode.split('\n');
  let currentCode = '';

  // Reveal each line with 0.25 second delay
  for (let i = 0; i < lines.length; i++) {
    currentCode += (i > 0 ? '\n' : '') + lines[i];
    yield* codeComponent().code(currentCode, 0.2); // Quick transition
  }

});
