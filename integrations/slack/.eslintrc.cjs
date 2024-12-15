module.exports = {
    root: true,
    env: {
        node: true,
    },
    extends: [require.resolve('@chorus/eslint/typescript')],
    parserOptions: {
        project: `${__dirname}/tsconfig.json`,
    },
};
