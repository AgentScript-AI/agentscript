import { defineInterface } from '@nzyme/ioc';

export type EnvVariables = Record<string, string | undefined>;

export const EnvVariables = defineInterface<EnvVariables>({
    name: 'EnvVariables',
});
