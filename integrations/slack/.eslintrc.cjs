module.exports = {
    root: true,
    env: {
        node: true,
    },
    extends: [require.resolve('@toyclub/eslint/typescript')],
    parserOptions: {
        project: `${__dirname}/tsconfig.json`,
    },
};
