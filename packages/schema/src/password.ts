import { identity } from '@nzyme/utils';
import {
    type Schema,
    type SchemaOptions,
    type SchemaOptionsSimlify,
    type SchemaProto,
    defineSchema,
} from '@nzyme/zchema';

export type PasswordSchema<O extends SchemaOptions<string> = SchemaOptions<string>> = Schema<
    string,
    O
>;

const proto: SchemaProto<string> = {
    coerce: String,
    serialize: identity,
    check: value => typeof value === 'string',
    default: () => '',
};

type PasswordSchemaBase = {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    <O extends SchemaOptions<string> = {}>(
        options?: O & SchemaOptions<string>,
    ): PasswordSchema<SchemaOptionsSimlify<O>>;
};

export const password = defineSchema<PasswordSchemaBase>({
    name: 'password',
    proto: () => proto,
});
