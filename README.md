<div>
  <h1>AgentScript SDK: build AI agents that think in code</h1>
</div>

<div >
  <a href="https://www.npmjs.com/package/agentscript-ai"><img alt="CodeCov" src="https://img.shields.io/npm/v/agentscript-ai?style=for-the-badge&color=red"></a>&nbsp;
  <a href="https://agentscript.ai"><img src="https://img.shields.io/badge/website-agentscript%2Eai-blue?style=for-the-badge&color=orange" alt="Website"></a><br/>
  <a href="https://agentscript.ai/docs"><img src="https://img.shields.io/badge/docs-learn_more-blue?style=for-the-badge&color=blue" alt="Docs"></a>&nbsp;
  <a href="https://discord.gg/hEYMnj62DT"><img src="https://img.shields.io/badge/Discord-Join%20Us-purple?logo=discord&logoColor=white&style=for-the-badge" alt="Join our Discord community"></a>
  <br/>  <br/>
</div>

AgentScript is a unique open-source SDK for building AI agents.

```
npm install agentscript-ai
```

Check out a short demo video:

[![AgentScript demo video](https://img.youtube.com/vi/b3MlCpBoxNM/0.jpg)](https://www.youtube.com/watch?v=b3MlCpBoxNM)

See also our [examples repo](https://github.com/AgentScript-AI/examples/tree/main).

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
   No sandbox is needed - the generated code is not running directly in Node.
1. Execution can be paused, serialized into a database and resumed later. \
   (like when a tool call requires human interaction or approval).

## Show me the code

Let's build an agent doing stuff with [Linear](https://linear.app). \
You can see full example [here](https://github.com/AgentScript-AI/examples/tree/main/linear).

```typescript
// Configure the language model
const model = AnthropicModel({
    model: 'claude-3-5-sonnet-latest',
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// Configure the Linear client
const linear = LinearClient({
    apiKey: process.env.LINEAR_API_KEY,
});

// Define available tools.
const tools = {
    // Needed for date calculation
    addToDate,
    // Turns data into text
    summarizeData: summarizeData({ model }),
    // The real deal
    linear: {
        searchIssues: searchIssues({ model, linear }),
    },
};

// Define a task for the agent
const prompt = 'Give me a progress update of tasks created in the last week';

// Define the expected output
const output = s.string();

// Let the LLM generate the AgentScript code
const agent = await inferAgent({
    tools,
    output,
    model,
    prompt,
});
```

By running `inferAgent` we call LLM with the following prompt, consisting of all available tools:

<div style="padding: 6px 16px; border-left: 3px solid #aaaaaa99;">

You answer using programming language called AgentScript. It's a subset of JavaScript with following limitations:

- can't use regexes
- can't use complex computation
- can only use predefined functions and nothing else
- ...

First explain your plan step by step in non-technical way. Do not reference code, or functions.\
Then create a valid AgentScript code. \
Don't wrap code in a function.\
Don't explain the code later.

```typescript
export type Duration = {
    years?: number;
    months?: number;
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
};

/** Add a duration to a date. */
export function addToDate(date: Date, duration: Duration): Date;

export type SummarizeDataParams = {
    /** The data to summarize. Can be in any format. */
    data: unknown;
    /**
     * The prompt to use to summarize the data.
     * Describe the expected outcome.
     */
    prompt: string;
};

/** Summarize any data */
export function summarizeData(params: SummarizeDataParams): string;

declare namespace linear {
    export type Issue = {
        id: string;
        url: string;
        title: string;
        description?: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    };

    /**
     * Search for issues using a natural language query.
     * Do not filter results later, put all the search criteria in the query.
     * @param query - Descriptive query in object format.
     */
    export function searchIssues(query: unknown): Issue[];
}

/** You must put the result of the task here. */
let result: string;
```

</div>

\
LLM responds with a plan:

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
// NOTE: this is real code generated by LLM.
// it's not executed but parsed into AST and runs in a specialized runtime.

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

Now execute the agent:

```typescript
await executeAgent({ agent });

// See the output
console.log(agent.output);

// Check variables in the execution state
console.log(agent.root.variables);
```

## How is it different?

Many products define agent as a fixed workflow (for example [Glide](https://www.glideapps.com/)). \
They work very nice for well defined tasks, but fall short when the task is ambiguous or not known beforehand.

Then we have a bunch of orchestration frameworks ([LangGraph](https://www.langchain.com/langgraph), [CrewAI](https://www.crewai.com/), [Inferable](https://www.inferable.ai/) among others). \
They provide architecture and make it easier to build classic re-act agents, where each tool call or decision point requires another LLM query. But this makes the LLM context grow quickly, is costly, slow and not flexible enough (try to implement a loop this way).

AgentScript takes a completely different approach. By making LLM express execution plan as code, agent can think more abstractly about the task and does not even need to know all the data to perform operations on it or make decisions. Just like a developer writing an app does not need to know all the data it would use - they can write code working on dynamic data by using `if` statements and loops.

Data is expressed as local variables and can be passed to tools, which can be normal deterministic functions, or LLM enabled ones, built using [LangChain](https://www.langchain.com/) or any other library.

## What about state management and human in the loop?

Because AgentScript works on AST, not really running the generated code, execution can be paused on each statement or a tool call. It can be serialized and put into a database, then retrieved and resumed from where it stopped.

Each tool would be able to store its state, wait for a user interaction, an event, or some time to pass. They will have built in interactivity and approval mechanism, so it will be easy to add human in the loop.

## State of development

Right now we have a working code generation and runtime supporting tools and most common JS statements.

Feel free to play with it by forking our [examples repo](https://github.com/AgentScript-AI/examples/tree/main).

## How to Join the Community

AgentScript is an open-source project, and we welcome contributions from everyone.

- [Join our Discord server](https://discord.gg/hEYMnj62DT) - talk to us!
- [See Github Issues](https://github.com/AgentScript-AI/agentscript/issues) - check out what we're working on, post your ideas!

## Current roadmap

- More JS features:
    - `if` statements,
    - template literals
    - arrow functions
    - unary operators
- Input variables
- Observability and debugging
