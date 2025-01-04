# AgentScript framework

AgentScript is a unique open-source framework for building re-act AI agents.

## What is it?

Typical Re-act agent work like this:

1. Send to LLM a prompt with available tools
1. LLM sends back a tool call
1. Execute the tool and send back the result
1. LLM responds with another tool call
1. ...

Wouldn't be better if LLM just told you upfront what tools to use,
in which order and what to do with the results? \
LLMs are great at code generation, so maybe it could just write a code to express its plan!

AgentScript does exactly that: prompts an LLM to generate code (a subset of JS) and executes it in a dedicated runtime with resumability, state persistence and interactivity (human in the loop) baked in.

## How it works?

1. Define a runtime with tools and optionally input and output variables
1. Define a task to be executed (aka prompt)
1. AgentScript prompts LLM to genarate JS code
1. Code it not executed directly but parsed into an [AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree)
1. [AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree) is executed in a dedicated, safe runtime (interpreter). \
   No sandbox is needed - the generated code is not really running in Node.
1. Execution can be paused, serialized into a database and resumed later. \
   (like when a tool call requires human interaction or approval).

## Show me the code

Let's build an agent doing stuff with [Linear](https://linear.app).

```typescript
// Configure the language model
const llm = AnthropicModel({
    model: 'claude-3-5-sonnet-latest',
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// Configure the Linear client
const linear = LinearClient({
    apiKey: process.env.LINEAR_API_KEY,
});

// Define the runtime
const runtime = defineRuntime({
    // Define available tools.
    tools: {
        // Needed for date calculation
        addToDate,
        // Turns data into text
        summarizeData: summarizeData({ llm }),
        // The real deal
        linear: {
            searchIssues: searchIssues({ llm, linear }),
        },
    },
    // Define the expected output
    output: s.string(),
});

// Define a task for the agent
const prompt = 'Give me a progress update of tasks created in the last week';

// Let the LLM generate the AgentScript code
const workflow = await inferWorkflow({ runtime, llm, prompt });
```

LLM creates a plan:

> I'll help create a progress update for recent tasks. Here's the plan:
>
> 1. First, we'll search for all issues created in the last week
> 2. Then we'll take those issues and generate a summary that includes:
>     - How many tasks were created
>     - Their current status distribution
>     - Key highlights or patterns
> 3. Format it in a clear, concise way

...and generates AgentScript code:

```javascript
// Calculate the date from 7 days ago
const lastWeek = addToDate(new Date(), { days: -7 });

// Search for all issues created in the last week
const issues = linear.searchIssues({
    createdAfter: lastWeek,
    orderBy: 'createdAt',
});

// Create a summary of the issues found
result = summarizeData({
    data: issues,
    prompt: 'Create a progress update focusing on number of tasks created, their current status distribution, and any notable patterns. Format as a clear business update.',
});
```

Now execute the workflow:

```typescript
await executeWorkflow({ workflow });

// See the output
console.log(workflow.state.output);

// Check variables in the execution state
console.log(workflow.state.root.variables);
```

## How is it different from other frameworks?

Many products define agent as a fixed workflow. [TODO links] \
Thew work very nice for well defined tasks, but fall short when the task is ambiguous or not known beforehand.

Then we have a bunch of orchestration frameworks ([LangGraph](https://www.langchain.com/langgraph), [CrewAI](https://www.crewai.com/), [Inferable](https://www.inferable.ai/) among others). \
They provide architecture and make it easier to build classic re-act agents, where each tool call or decision point requires another LLM query. But this makes the LLM context grow quickly, is costly, slow and not flexible enough (try to implement a loop this way).

AgentScript takes a completely different approach. By making LLM express execution plan as code, agent can think more abstractly about the task and does not even need to know all the data to perform operations on it or make decisions.

Data is expressed as local variables and can be passed to tools, which can be normal deterministic functions, or LLM enabled ones, built using [LangChain](https://www.langchain.com/) or any other library.

## What about state management and human in the loop?

Because AgentScript works on AST, not really running the generated code, execution can be paused on each statement or a tool call. It can be serialized and put into a database, then retrieved and resumed from where it stopped.

Each tool would be able to store its state, wait for a user interaction, an event, or some time to pass. They will have built in interactivity and approval mechanism, so it will be easy to add human in the loop.

## State of development

Right now we have a working code generation and runtime supporting tools and most common JS statements.

Feel free to play with it by forking our demo repo. [TODO link]

## Roadmap

- Execution serialization and deserialization
- More JS features:
    - `if` statements,
    - `for` loops,
    - template literals
    - arrow functions
    - unary and binary operators
- Input variables
- Tool state
- Tool interactivity
- Observability and debugging
