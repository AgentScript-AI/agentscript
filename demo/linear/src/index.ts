import chalk from 'chalk';

import { LinearClient, searchIssues } from '@agentscript-ai/linear';
import { defineRuntime, executeWorkflow, inferWorkflow } from 'agentscript-ai';
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

// Define the runtime
const runtime = defineRuntime({
    // We'll use a few tools to help us
    tools: {
        addToDate,
        summarizeData: summarizeData({ llm }),
        // Put the Linear client in nested module
        linear: {
            searchIssues: searchIssues({ llm, linear }),
        },
    },
    // Define the expected output
    output: s.string(),
});

const prompt = 'Give me a progress update of tasks created in the last week';

// Let the LLM infer the workflow based on the prompt and runtime
const workflow = await inferWorkflow({
    runtime,
    llm,
    prompt,
});

// We have the workflow ready, but it's not yet executed
console.log(chalk.green('Generated plan:'));
console.log(workflow.plan);
console.log();

console.log(chalk.green('Generated code:'));
console.log(workflow.script.code);
console.log();

// Now execute the workflow
await executeWorkflow({ workflow });

// We can now inspect the workflow variables and output
console.log(chalk.green('Workflow variables:'));
console.log(workflow.state?.root.variables);
console.log();

console.log(chalk.green('Workflow output:'));
console.log(workflow.state?.output);
