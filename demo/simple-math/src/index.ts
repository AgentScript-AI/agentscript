import { loadEnvVariables } from '@nzyme/project-utils';

import {
    defineRuntime,
    defineTool,
    executeWorkflow,
    inferWorkflow,
    ToolDefinition,
} from 'agentscript-ai';
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
    add,
    multiply,
    divide,
    square,
    squareRoot,
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

console.log('workflow plan', workflow.plan);
console.log('workflow code', workflow.code);

const result = await executeWorkflow({ workflow });

console.log('workflow result', result);
console.log('workflow state', workflow.state);
