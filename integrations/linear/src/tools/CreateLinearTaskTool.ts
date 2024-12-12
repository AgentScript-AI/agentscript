import { Chat, defineTool } from '@chorus/core';
import { z } from 'zod';

export type LinearTaskStatus = z.infer<typeof LinearTaskStatus>;
export const LinearTaskStatus = z.enum(['AWAITING_APPROVAL', 'CREATED', 'ERROR']);

export type LinearTaskInput = z.infer<typeof LinearTaskInput>;
export const LinearTaskInput = z.object({
    title: z.string().describe('Title of the task'),
    details: z
        .string()
        .describe(
            'Details of the task with as much detail as possible. ' +
                'Include the task details, all relevant information (like links, files, screenshots, etc), and expected outcome.',
        ),
});

export type LinearTaskOutput = z.infer<typeof LinearTaskOutput>;
export const LinearTaskOutput = z.object({
    status: LinearTaskStatus,
    error: z.string().optional().describe('Error message if the task failed'),
});

export const CreateLinearTaskTool = defineTool({
    name: 'create_linear_task',
    description:
        'Initialize creation of a task in Linear. ' +
        'Task is not created until approval. ' +
        'Approval is done in the channel, do not ask for approval here. ' +
        'Do not include task title or details in the output. ' +
        'Always check knowledge base before asking for more details.',
    input: LinearTaskInput,
    output: LinearTaskOutput,
    setup({ inject }) {
        const chat = inject(Chat);

        return async (input, state) => {
            const result: LinearTaskOutput = {
                status: 'AWAITING_APPROVAL',
            };

            const content = [
                //
                `# ${input.title}`,
                '---',
                input.details,
            ];

            await chat.postMessage({
                content: content.join('\n'),
                threadId: state.threadId,
                channelId: state.channelId,
            });

            return result;
        };
    },
});
