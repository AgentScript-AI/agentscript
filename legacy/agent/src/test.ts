/* eslint-disable @typescript-eslint/no-namespace */

declare type JSONSchema<T> = T;

import { z } from 'zod';

export declare namespace Utils {
    /** Group an array by a given property. */
    export function groupBy<T>(array: T[], property: keyof T): T[][];

    export interface Duration {
        /** How many years to add or subtract from now. */
        years?: number;
        /** How many months to add or subtract from now. */
        months?: number;
        /** How many days to add or subtract from now. */
        days?: number;
        /** How many hours to add or subtract from now. */
        hours?: number;
        /** How many minutes to add or subtract from now. */
        minutes?: number;
        /** How many seconds to add or subtract from now. */
        seconds?: number;
    }
    export const Duration: z.ZodType<Duration>;

    /** Add a duration to a date. */
    export function addToDate(date: Date, duration: Duration): Date;
}

export declare namespace Core {
    export const User: z.ZodType<User>;
    export interface User {
        id: string;
        name: string;
    }

    export interface NewWorkflowParams<TResult = unknown> {
        /** User to start interacting with. Use it when you need to interact with the user. */
        user?: User;
        /** The goal of the workflow. Write in detail what do you want to happen in the workflow. */
        goal: string;
        /** Any additional context that might help you. Put here all the variables you might need. */
        context: unknown;
        /** Expected result of the workflow. Provide only if you expect a specific result. */
        expectedResult?: z.ZodType<TResult>;
    }

    /**
     * Start a new workflow with the user. Use it when you need to ask the user to do or provide something.
     * Whenever there is a need to do something that is not a simple task or requires an input from a different user, use this function.
     * Child workflow can peform all kind of tasks, so you can delegate any task to it. Don't do anything yourself when you delegate the task.
     * @returns Execution result. You should always use it to update the user about results of the workflow.
     */
    export function startNewWorkflow<TResult = unknown>(
        params: NewWorkflowParams<TResult>,
    ): Promise<TResult>;

    /** Replies to the user in chat. Use it whenever you want to say something. */
    export function replyToUser(message: string): Promise<void>;

    export interface SummarizeParams<T = unknown> {
        /** Description of the report. Should describe what is the purpose of the report. */
        description: string;
        /** Data to build the report from. */
        data: unknown[];
        /**
         * Expected result of the report.
         * If you don't provide it, the type will be inferred from the data.
         * Provide only if you expect a specific type.
         */
        expectedResult?: z.ZodType<T>;
    }

    /**
     * Summarize a data of any type into a different type.
     * Use it when you need to want to convert a data to a different type.
     * Examples:
     * - Convert a list of documents to a list of summaries.
     * - Convert tasks, documents, emails, etc. to a list of task updates.
     */
    export function summarize<T = unknown>(params: SummarizeParams<T>): Promise<T[]>;
}

export declare namespace Docs {
    export interface FindDocsParams {
        /** Query in natural language. Include all relevant search criteria. */
        query: string;
    }

    export const Document: z.ZodType<Document>;
    export interface Document {
        id: string;
        type: string;
        title: string;
        url: string;
        metadata: Record<string, unknown>;
        content: string;
        createdAt: Date;
        createdBy?: Core.User;
        updatedAt: Date;
    }

    export function findDocs(params: FindDocsParams): Promise<Document[]>;
}

export declare namespace Linear {
    export type TaskStatus = 'ARCHIVED' | 'TODO' | 'IN_PROGRESS' | 'DONE';
    export const TaskStatus: z.ZodType<TaskStatus>;

    export const Task: z.ZodType<Task>;
    export interface Task {
        id: string;
        title: string;
        details: string;
        createdAt: Date;
        createdBy: Core.User;
        assignee?: Core.User;
        status: TaskStatus;
    }

    /**
     * Search for tasks using a natural language query.
     * Do not filter results later, only use the query.
     */
    export function searchTasks(query: string): Promise<Task[]>;

    export interface CreateTaskParams {
        title: string;
        details: string;
    }
    export const CreateTaskParams: z.ZodType<CreateTaskParams>;

    /** Create tasks. */
    export function createTasks(tasks: CreateTaskParams[]): Promise<Task[]>;

    export interface UpdateTasksStatusParams {
        /** Tasks to update. You can provide either tasks or their ids. */
        tasks: Task[] | string[];
        /**
         * Statuses to set.
         * If you provide more than one user will be asked to choose from them.
         * Defaults to all statuses.
         */
        statuses?: TaskStatus[];
    }

    /**
     * Request updating status of Linear tasks. Request must be first approved by the user.
     * @returns The tasks that were approved and updated.
     */
    export function updateTasksStatus(params: UpdateTasksStatusParams): Promise<Task[]>;
}
