module.exports = {
    root: true,
    env: {
        node: true,
    },
    extends: [require.resolve('@agentscript.ai/eslint/typescript')],
    parserOptions: {
        project: `${__dirname}/tsconfig.json`,
    },
};
