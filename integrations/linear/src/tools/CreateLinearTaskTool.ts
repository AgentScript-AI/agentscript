import * as z from 'zod';

import { Chat, ChatMessageInfo, defineTool, randomUid, toolChatAction } from '@chorus/core';
import { assert } from '@nzyme/utils';

import { LinearClient } from '../LinearClient.js';

export type CreateLinearTaskInput = z.infer<typeof CreateLinearTaskInput>;
export const CreateLinearTaskInput = z.object({
    title: z.string().describe('Title of the task'),
    details: z
        .string()
        .describe(
            'Details of the task with as much detail as possible. ' +
                'Include the task details, all relevant information and expected outcome. ' +
                'Include files, screenshots, etc. that are relevant to the task using markdown links in separate lines.',
        ),
});

export type CreateLinearTaskState = z.infer<typeof CreateLinearTaskState>;
export const CreateLinearTaskState = z.object({
    message: ChatMessageInfo,
    taskId: z.string().optional(),
});

export type CreateLinearTaskInteraction = z.infer<typeof CreateLinearTaskInteraction>;
export const CreateLinearTaskInteraction = z.object({
    action: z.enum(['CREATE_TASK', 'CANCEL']),
});

export const CreateLinearTaskTool = defineTool({
    name: 'create_linear_task',
    description:
        'Initialize creation of a task in Linear. ' +
        'Task is not created until approval. ' +
        'Approval is done in the channel, do not ask for approval here. ' +
        'Do not include task title or details in the output. ' +
        'Always check knowledge base before asking for more details.',
    input: CreateLinearTaskInput,
    state: CreateLinearTaskState,
    interaction: CreateLinearTaskInteraction,
    setup({ inject }) {
        const chat = inject(Chat);
        const linear = inject(LinearClient);

        return {
            async invoke({ input, call, agent }) {
                agent.events.push({
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

                const createTaskInteraction: CreateLinearTaskInteraction = {
                    action: 'CREATE_TASK',
                };

                const message = await chat.postMessage({
                    channelId: agent.channelId,
                    threadId: agent.threadId,
                    blocks: [
                        getMessageContent(input).join('\n'),
                        { type: 'divider' },
                        {
                            type: 'actions',
                            elements: [
                                {
                                    type: 'button',
                                    text: 'Create Linear Task',
                                    style: 'primary',
                                    ...toolChatAction({
                                        stateId: agent.id,
                                        call,
                                        params: createTaskInteraction,
                                    }),
                                },
                                {
                                    type: 'button',
                                    text: 'Cancel',
                                    action: 'cancel',
                                    value: 'cancel',
                                    style: 'danger',
                                },
                            ],
                        },
                    ],
                });

                return {
                    state: {
                        message,
                    },
                };
            },
            async interact({ input, state, interaction }) {
                if (interaction.action === 'CREATE_TASK') {
                    const teams = await linear.teams();

                    const result = await linear.createIssue({
                        title: input.title,
                        description: input.details,
                        teamId: teams.nodes[0].id,
                    });

                    const issue = await result.issue;
                    assert(issue, 'Issue not created');

                    await chat.updateMessage({
                        messageId: state.message.messageId,
                        channelId: state.message.channelId,
                        threadId: state.message.threadId,
                        blocks: [
                            getMessageContent(input).join('\n'),
                            { type: 'divider' },
                            `**Created task [${issue.identifier}](${issue.url}) 🎉**`,
                        ],
                    });
                }
            },
        };

        function getMessageContent(input: CreateLinearTaskInput) {
            return [
                //
                `# ${input.title}`,
                '---',
                input.details,
            ];
        }
    },
});
