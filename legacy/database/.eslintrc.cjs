module.exports = {
    root: true,
    extends: [require.resolve('@agentscript.ai/eslint/typescript')],
    parserOptions: {
        project: [
            `${__dirname}/tsconfig.json`,
            // tsconfig for config files
            `${__dirname}/tsconfig.config.json`,
        ],
    },
};
