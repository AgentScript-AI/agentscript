import { expect, it } from 'vitest';

import * as s from '@agentscript-ai/schema';

import { defineTool } from './defineTool.js';
import { defineToolModule } from './defineToolModule.js';
import { filterTools } from './filterTools.js';
import type { RuntimeModule } from '../agent/defineAgent.js';

// Define some test tools
const addTool = defineTool({
    description: 'Add two numbers',
    input: {
        a: s.number(),
        b: s.number(),
    },
    output: s.number(),
    handler: ({ input }) => {
        return input.a + input.b;
    },
});

const stringTool = defineTool({
    description: 'String operations',
    input: {
        text: s.string(),
    },
    output: s.string(),
    handler: ({ input }) => {
        return input.text.toUpperCase();
    },
});

const nestedTools = defineToolModule({
    math: {
        add: addTool,
        multiply: defineTool({
            input: {
                a: s.number(),
                b: s.number(),
            },
            output: s.number(),
            handler: ({ input }) => input.a * input.b,
        }),
    },
    string: {
        format: stringTool,
    },
});

it('should return empty object when no tools provided', () => {
    const result = filterTools({}, []);
    expect(result).toEqual({});
});

it('should return empty object when no tool names provided', () => {
    const result = filterTools(nestedTools, []);
    expect(result).toEqual({});
});

it('should filter single tool by path', () => {
    const result = filterTools(nestedTools, ['math.add']);
    expect(result).toEqual({
        math: {
            add: addTool,
        },
    });
});

it('should filter multiple tools by paths', () => {
    const result = filterTools(nestedTools, ['math.add', 'string.format']);
    expect(result).toEqual({
        math: {
            add: addTool,
        },
        string: {
            format: stringTool,
        },
    });
});

it('should handle non-existent paths gracefully', () => {
    const result = filterTools(nestedTools, ['math.subtract', 'string.format']);
    expect(result).toEqual({
        string: {
            format: stringTool,
        },
    });
});

it('should handle partial paths gracefully', () => {
    const result = filterTools(nestedTools, ['math']);
    expect(result).toEqual({
        math: {
            add: addTool,
            multiply: nestedTools.math.multiply,
        },
    });
});

it('should handle empty path segments', () => {
    const result = filterTools(nestedTools, ['math..add']);
    expect(result).toEqual({});
});

it('should handle undefined tools object', () => {
    const result = filterTools(undefined as unknown as RuntimeModule, ['math.add']);
    expect(result).toEqual({});
});
