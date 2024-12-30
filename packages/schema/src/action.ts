import { identity } from '@nzyme/utils';
import type {
    Schema,
    SchemaOptions,
    SchemaOptionsSimlify,
    SchemaProto,
    SchemaValue,
} from '@nzyme/zchema';
import { defineSchema } from '@nzyme/zchema';

declare const ACTION_SYMBOL: unique symbol;

export interface Action<P extends Schema = Schema, R extends Schema = Schema> {
    action: string;
    params: SchemaValue<P>;
    // This is just a marker to preserve result type
    [ACTION_SYMBOL]: R;
}

export type ActionSchema<O extends SchemaOptions<Action> = SchemaOptions<Action>> = Schema<
    Action,
    O
>;

const proto: SchemaProto<Action> = {
    coerce: (value: unknown) => {
        const action = {
            action: (value as Action).action || '',
            params: (value as Action).params,
        };

        return action as Action;
    },
    serialize: identity,
    check(value): value is Action {
        return (
            value != null &&
            typeof value === 'object' &&
            'action' in value &&
            typeof value.action === 'string' &&
            'params' in value
        );
    },
    default: () => ({ action: '', params: null }) as Action,
};

type ActionSchemaBase = {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    <O extends SchemaOptions<Action> = {}>(
        options?: O & SchemaOptions<Action>,
    ): ActionSchema<SchemaOptionsSimlify<O>>;
};

export const action = defineSchema<ActionSchemaBase>({
    name: 'action',
    proto: () => proto,
});
