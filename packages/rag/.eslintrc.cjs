module.exports = {
    root: true,
    extends: [require.resolve('@chorus/eslint/typescript')],
    parserOptions: {
        project: [
            `${__dirname}/tsconfig.json`,
            // TS config for configs
            `${__dirname}/tsconfig.config.json`,
        ],
    },
};
