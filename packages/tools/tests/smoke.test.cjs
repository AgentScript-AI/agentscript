const p = require('@agentscript-ai/tools');

// Simple smoke test to verify the package can be required
if (!p) throw new Error('Package failed to load');
