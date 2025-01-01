/**
 * LLM message.
 */
export interface Message {
    /**
     * Role of the message.
     */
    role: 'user' | 'assistant';
    /**
     * Content of the message.
     */
    content: string;
}
