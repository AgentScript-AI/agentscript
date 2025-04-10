import { common, jsdoc, typescript, packageJson } from '@agentscript-ai/eslint';

export default [
    //
    ...common(),
    ...typescript(),
    ...jsdoc(),
    ...packageJson(),
];
