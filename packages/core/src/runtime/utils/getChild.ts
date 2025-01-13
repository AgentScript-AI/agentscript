import type { AstNode } from '../../parser/astTypes.js';

/**
 * Get the child of a node.
 * @param node - Node to get the child from.
 * @param index - Index of the child to get.
 * @returns Child of the node.
 */
export function getChild(node: AstNode, index: number): AstNode | undefined {
    switch (node.type) {
        case 'var':
            return index === 0 ? node.value : undefined;

        case 'assign':
            switch (index) {
                case 0:
                    return node.right;
                case 1:
                    return node.left;
                default:
                    return undefined;
            }

        case 'arr':
            return node.items[index];

        case 'obj':
            return node.props[index]?.value;

        case 'call':
            return node.args[index];

        case 'new':
            return node.args[index];

        default:
            return undefined;
    }
}
