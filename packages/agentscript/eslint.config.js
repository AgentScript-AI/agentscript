import { common, jsdoc, packageJson, typescript } from '@agentscript-ai/eslint';

export default [
    //
    ...common(),
    ...typescript(),
    ...jsdoc(),
    ...packageJson(),
];
