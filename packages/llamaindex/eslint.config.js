import { common, jsdoc, typescript } from '@agentscript-ai/eslint';

export default [
    //
    ...common(),
    ...typescript(),
    ...jsdoc(),
];
