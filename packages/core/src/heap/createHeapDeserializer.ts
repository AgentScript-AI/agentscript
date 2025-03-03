import type { Heap } from './heapTypes.js';

/**
 * Heap deserializer.
 */
export type HeapDeserializer = ReturnType<typeof createHeapDeserializer>;

/**
 * Create a heap deserializer.
 * @param heap - Heap to deserialize.
 * @returns Heap deserializer.
 */
export function createHeapDeserializer(heap: Heap) {
    const heapMap = new Map<number, unknown>();

    return { get };

    function get(index: number) {
        if (index === -1) {
            return undefined;
        }

        return heapMap.get(index) ?? deserialize(index);
    }

    function deserialize(index: number) {
        const serialized = heap[index];

        if (!Array.isArray(serialized)) {
            heapMap.set(index, serialized);
            return serialized;
        }

        switch (serialized[0]) {
            case 'a': {
                const result: unknown[] = [];
                // set the result in the heap map for potential recursion
                heapMap.set(index, result);
                for (let i = 1; i < serialized.length; i++) {
                    result.push(get(serialized[i] as number));
                }

                return result;
            }

            case 'st': {
                const result = new Set<unknown>();
                // set the result in the heap map for potential recursion
                heapMap.set(index, result);
                for (let i = 1; i < serialized.length; i++) {
                    result.add(get(serialized[i] as number));
                }
                return result;
            }

            case 'o': {
                const result: Record<string, unknown> = {};
                // set the result in the heap map for potential recursion
                heapMap.set(index, result);
                for (let i = 1; i < serialized.length; i += 2) {
                    result[serialized[i] as string] = get(serialized[i + 1] as number);
                }
                return result;
            }

            case 'bi': {
                return BigInt(serialized[1]);
            }

            case 'd': {
                return new Date(serialized[1]);
            }

            case 'sm': {
                return Symbol(serialized[1]);
            }

            case 'r': {
                return new RegExp(serialized[1], serialized[2]);
            }
        }
    }
}
