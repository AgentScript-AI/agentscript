import { loadEnvVariables } from '@nzyme/project-utils';
import chalk from 'chalk';

import { defineRuntime, defineTool, executeWorkflow, inferWorkflow } from 'agentscript-ai';
import { AnthropicModel } from 'agentscript-ai/anthropic';
import * as s from 'agentscript-ai/schema';

loadEnvVariables();

const add = defineTool({
    description: 'Add two numbers',
    input: {
        a: s.number(),
        b: s.number(),
    },
    output: s.number(),
    handler: ({ input }) => input.a + input.b,
});

const multiply = defineTool({
    description: 'Multiply two numbers',
    input: {
        a: s.number(),
        b: s.number(),
    },
    output: s.number(),
    handler: ({ input }) => input.a * input.b,
});

const divide = defineTool({
    description: 'Divide two numbers',
    input: {
        a: s.number(),
        b: s.number(),
    },
    output: s.number(),
    handler: ({ input }) => input.a / input.b,
});

const square = defineTool({
    description: 'Square a number',
    input: {
        a: s.number(),
    },
    output: s.number(),
    handler: ({ input }) => input.a * input.a,
});

const squareRoot = defineTool({
    description: 'Square root of a number',
    input: {
        a: s.number(),
    },
    output: s.number(),
    handler: ({ input }) => Math.sqrt(input.a),
});

const runtime = defineRuntime({
    tools: {
        add,
        multiply,
        divide,
        square,
        squareRoot,
    },
});

const llm = AnthropicModel({
    model: 'claude-3-5-sonnet-latest',
    apiKey: process.env.ANTHROPIC_API_KEY,
    maxTokens: 1024,
});

const workflow = await inferWorkflow({
    runtime,
    llm,
    prompt: 'Calculate the square root of 16',
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
