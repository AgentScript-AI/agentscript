import type { HeapSerialized } from './heapTypes.js';

/**
 * Create a heap deserializer.
 * @param heap - Heap to deserialize.
 * @returns Heap deserializer.
 */
export function createHeapDeserializer(heap: HeapSerialized) {
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
        if (serialized === null) {
            heapMap.set(index, null);
            return null;
        }

        if (!Array.isArray(serialized)) {
            heapMap.set(index, serialized);
            return serialized;
        }

        switch (serialized[0]) {
            case 'arr': {
                const result: unknown[] = [];
                // set the result in the heap map for potential recursion
                heapMap.set(index, result);
                for (let i = 1; i < serialized.length; i++) {
                    result.push(get(serialized[i] as number));
                }

                return result;
            }

            case 'set': {
                const result = new Set<unknown>();
                // set the result in the heap map for potential recursion
                heapMap.set(index, result);
                for (let i = 1; i < serialized.length; i++) {
                    result.add(get(serialized[i] as number));
                }
                return result;
            }

            case 'obj': {
                const result: Record<string, unknown> = {};
                // set the result in the heap map for potential recursion
                heapMap.set(index, result);
                for (const [key, value] of Object.entries(serialized[1])) {
                    result[key] = get(value);
                }
                return result;
            }

            case 'bint': {
                return BigInt(serialized[1]);
            }

            case 'date': {
                return new Date(serialized[1]);
            }

            case 'sym': {
                return Symbol(serialized[1]);
            }
        }
    }
}
