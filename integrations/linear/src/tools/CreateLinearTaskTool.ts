import { Chat, defineTool, randomUid } from '@chorus/core';
import * as z from 'zod';

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

export type LinearTaskData = z.infer<typeof LinearTaskData>;
export const LinearTaskData = z.object({});

export const CreateLinearTaskTool = defineTool({
    name: 'create_linear_task',
    description:
        'Initialize creation of a task in Linear. ' +
        'Task is not created until approval. ' +
        'Approval is done in the channel, do not ask for approval here. ' +
        'Do not include task title or details in the output. ' +
        'Always check knowledge base before asking for more details.',
    input: LinearTaskInput,
    setup({ inject }) {
        const chat = inject(Chat);

        return async (input, { state, call }) => {
            state.events.push({
                type: 'TOOL_EVENT',
                timestamp: new Date(),
                uid: randomUid(),
                callId: call.uid,
                content: [
                    `You requested to create a task in Linear. It needs to be approved by the user before it is created.`,
                    `<TASK_TITLE>\n${input.title}\n</TASK_TITLE>`,
                    `<TASK_DETAILS>\n${input.details}\n</TASK_DETAILS>`,
                ].join('\n'),
            });

            const content = [
                //
                `# ${input.title}`,
                '---',
                input.details,
            ];

            await chat.postMessage({
                content: content.join('\n'),
                chatId: state.chatId,
                buttons: [
                    {
                        label: 'Create Linear Task',
                        action: 'create_linear_task',
                        value: 'create_linear_task',
                        style: 'primary',
                    },
                    {
                        label: 'Cancel',
                        action: 'cancel',
                        value: 'cancel',
                        style: 'danger',
                    },
                ],
            });
        };
    },
});
