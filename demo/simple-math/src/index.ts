import chalk from 'chalk';

import { defineTool, executeAgent, inferAgent } from 'agentscript-ai';
import { AnthropicModel } from 'agentscript-ai/anthropic';
import * as s from 'agentscript-ai/schema';

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

const llm = AnthropicModel({
    model: 'claude-3-5-sonnet-latest',
    apiKey: process.env.ANTHROPIC_API_KEY,
    maxTokens: 1024,
});

const tools = {
    add,
    multiply,
    divide,
    square,
    squareRoot,
};

const output = s.number();

const prompt = 'Calculate the square root of eight times two';

const agent = await inferAgent({
    llm,
    tools,
    output,
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
