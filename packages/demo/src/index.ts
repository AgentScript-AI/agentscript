import { defineFunction, defineRuntime, executeWorkflow, inferWorkflow } from 'agentscript.ai';
import { AnthropicModel } from 'agentscript.ai/anthropic';
import * as s from 'agentscript.ai/schema';

import { loadEnvVariables } from '@nzyme/project-utils';

loadEnvVariables();

const add = defineFunction({
    description: 'Add two numbers',
    args: {
        a: s.number(),
        b: s.number(),
    },
    return: s.number(),
    handler: ({ args }) => args.a + args.b,
});

const multiply = defineFunction({
    description: 'Multiply two numbers',
    args: {
        a: s.number(),
        b: s.number(),
    },
    return: s.number(),
    handler: ({ args }) => args.a * args.b,
});

const divide = defineFunction({
    description: 'Divide two numbers',
    args: {
        a: s.number(),
        b: s.number(),
    },
    return: s.number(),
    handler: ({ args }) => args.a / args.b,
});

const square = defineFunction({
    description: 'Square a number',
    args: {
        a: s.number(),
    },
    return: s.number(),
    handler: ({ args }) => args.a * args.a,
});

const squareRoot = defineFunction({
    description: 'Square root of a number',
    args: {
        a: s.number(),
    },
    return: s.number(),
    handler: ({ args }) => Math.sqrt(args.a),
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
