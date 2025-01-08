import chalk from 'chalk';

import { LinearClient, searchIssues } from '@agentscript-ai/linear';
import { executeAgent, inferAgent } from 'agentscript-ai';
import { AnthropicModel } from 'agentscript-ai/anthropic';
import * as s from 'agentscript-ai/schema';
import { addToDate, summarizeData } from 'agentscript-ai/tools';

// Configure the language model
const llm = AnthropicModel({
    model: 'claude-3-5-sonnet-latest',
    apiKey: process.env.ANTHROPIC_API_KEY,
    maxTokens: 1024,
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
    summarizeData: summarizeData({ llm }),
    // The real deal
    linear: {
        searchIssues: searchIssues({ llm, linear }),
    },
};

// Define a task for the agent
const prompt = 'Give me a progress update of tasks created in the last week';

// Define the expected output
const output = s.string();

// Let the LLM infer the agent based on the prompt and runtime
const agent = await inferAgent({
    tools,
    output,
    llm,
    prompt,
});

// We have the agent ready, but it's not yet executed
console.log(chalk.green('Generated plan:'));
console.log(agent.plan);
console.log();

console.log(chalk.green('Generated code:'));
console.log(agent.script.code);
console.log();

// Now execute the agent
await executeAgent({ agent });

// We can now inspect the agent variables and output
console.log(chalk.green('Agent variables:'));
console.log(agent.state?.root.variables);
console.log();

console.log(chalk.green('Agent output:'));
console.log(agent.state?.output);
