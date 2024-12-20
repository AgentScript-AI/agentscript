/* eslint-disable @typescript-eslint/no-namespace */

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

    /** Add a duration to a date. */
    export function addToDate(date: Date, duration: Duration): Date;
}

export declare namespace Core {
    export interface User {
        id: string;
        name: string;
    }

    export interface NewWorkflowParams {
        /** User to start interacting with. Use it when you need to interact with the user. */
        user?: User;
        /** The goal of the workflow. Write in detail what do you want to happen in the workflow. */
        goal: string;
        /** Any additional context that might help you. Put here all the variables you might need. */
        context: unknown;
    }

    /**
     * Start a new workflow with the user. Use it when you need to ask the user to do or provide something.
     * Whenever there is a need to do something that is not a simple task or requires an input from a different user, use this function.
     * Child workflow can peform all kind of tasks, so you can delegate any task to it. Don't do anything yourself when you delegate the task.
     * @returns Execution result summary. You should always use it to update the user about results of the workflow.
     */
    export function startNewWorkflow(params: NewWorkflowParams): Promise<string>;

    /** Replies to the user in chat. Use it whenever you want to say something. */
    export function replyToUser(message: string): Promise<void>;

    export interface SummarizeParams {
        /** Description of the report. Should describe what is the purpose of the report and expected result. */
        description: string;
        /** Data to build the report from. */
        data: unknown;
    }

    /**
     * Summarize a data of any type into a string.
     */
    export function summarizeAsString(params: SummarizeParams): Promise<string>;

    /**
     * Summarize a data of any type into a list.
     * Examples:
     * - Convert documents to a list of summaries.
     * - Convert tasks, documents, emails, etc. to a list of task updates.
     */
    export function summarizeAsList(params: SummarizeParams): Promise<object[]>;
}

export declare namespace Docs {
    export interface FindDocsParams {
        /** Query in natural language. Include all relevant search criteria. */
        query: string;
    }

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
     * Do not filter results later, put all the search criteria in the query.
     */
    export function searchTasks(query: string): Promise<Task[]>;

    export interface CreateTaskParams {
        title: string;
        details: string;
    }

    /** Create tasks. */
    export function createTasks(tasks: CreateTaskParams[]): Promise<Task[]>;

    export interface UpdateTasksStatusParams {
        /** Tasks to update. */
        tasks: Task[];
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
