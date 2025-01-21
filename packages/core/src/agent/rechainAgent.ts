import type { Agent } from './agentTypes.js';

/**
 * Rechains an agent.
 * @param agent - Agent to rechain.
 */
export function rechainAgent(agent: Agent) {
    const chain = agent.chain;

    if (chain && chain.length > 0) {
        for (let i = 1; i < chain.length; i++) {
            chain[i].root.parent = chain[i - 1].root;
        }

        agent.root.parent = chain[chain.length - 1].root;
    }
}
