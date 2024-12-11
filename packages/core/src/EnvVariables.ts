import { defineInjectable } from '@nzyme/ioc';

export type EnvVariables = Record<string, string | undefined>;

export const EnvVariables = defineInjectable<EnvVariables>({
    name: 'EnvVariables',
});
