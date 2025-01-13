import type { Heap, HeapArray, HeapObject, HeapSet } from './heapTypes.js';

/**
 * Heap serializer.
 */
export type HeapSerializer = ReturnType<typeof createHeapSerializer>;

/**
 * Create a heap serializer.
 * @returns Heap serializer.
 */
export function createHeapSerializer() {
    const heap: Heap = [];
    const heapMap = new Map<unknown, number>();

    return {
        heap,
        push,
    };

    function push(value: unknown) {
        if (value === undefined) {
            return -1;
        }

        let index = heapMap.get(value);
        if (index !== undefined) {
            return index;
        } else {
            heapMap.set(value, heap.length);
            index = heap.length;
        }

        if (value === null) {
            heap.push(value);
            return index;
        }

        switch (typeof value) {
            case 'number':
            case 'string':
            case 'boolean':
                heap.push(value);
                break;
            case 'bigint':
                heap.push(['bint', value.toString()]);
                break;
            case 'symbol':
                if (value.description) {
                    heap.push(['sym', value.description]);
                } else {
                    heap.push(['sym']);
                }

                break;
            case 'object': {
                if (Array.isArray(value)) {
                    const serialized: HeapArray = ['arr'];
                    // push the array to the heap first for potential recursion
                    heap.push(serialized);
                    for (const item of value) {
                        serialized.push(push(item));
                    }
                } else if (value instanceof Set) {
                    const serialized: HeapSet = ['set'];
                    // push the set to the heap first for potential recursion
                    heap.push(serialized);
                    for (const item of value) {
                        serialized.push(push(item));
                    }
                } else if (value instanceof Date) {
                    heap.push(['date', value.toISOString()]);
                } else {
                    const obj: HeapObject = {};
                    // push the object to the heap first for potential recursion
                    heap.push(obj);

                    for (const [key, val] of Object.entries(value)) {
                        obj[key] = push(val);
                    }
                }

                break;
            }
            default:
                throw new Error(`Unsupported type: ${typeof value}`);
        }

        return index;
    }
}
