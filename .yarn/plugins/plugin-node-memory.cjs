module.exports = {
    name: `plugin-node-memory`,
    factory: require => ({
        hooks: {
            setupScriptEnvironment(project, scriptEnv) {
                scriptEnv.NODE_OPTIONS = `--max-old-space-size=8192`;
            },
        },
    }),
};
