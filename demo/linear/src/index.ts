import { defineRuntime, defineTool, executeWorkflow, inferWorkflow } from 'agentscript.ai';
import { AnthropicModel } from 'agentscript.ai/anthropic';
import * as s from 'agentscript.ai/schema';
import { summarizeData, addToDate } from 'agentscript.ai/tools';

import { LinearClient, searchIssues } from '@agentscript.ai/linear';

const llm = AnthropicModel({
    model: 'claude-3-5-sonnet-latest',
    apiKey: process.env.ANTHROPIC_API_KEY,
    maxTokens: 1024,
});

const linear = LinearClient({
    apiKey: process.env.LINEAR_API_KEY,
});

const runtime = defineRuntime({
    addToDate,
    summarizeData: summarizeData({ llm }),
    linear: {
        searchIssues: searchIssues({ llm, linear }),
    },
});

const workflow = await inferWorkflow({
    runtime,
    llm,
    prompt: 'Give me a progress update of tasks created in the last week',
});

await executeWorkflow({ workflow });

console.log('result', workflow.state.variables);
