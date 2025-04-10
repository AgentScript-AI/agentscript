import { common, jsdoc, packageJson, typescript } from '@agentscript-ai/eslint';

export default [
    //
    ...common(),
    ...typescript({
        project: ['./tsconfig.json', './tsconfig.tests.json'],
    }),
    ...jsdoc(),
    ...packageJson(),
];
