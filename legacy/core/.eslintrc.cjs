module.exports = {
    root: true,
    extends: [require.resolve('@agentscript.ai/eslint/typescript')],
    parserOptions: {
        project: [
            `${__dirname}/tsconfig.json`,
            // TS config for configs
            `${__dirname}/tsconfig.config.json`,
        ],
    },
};
