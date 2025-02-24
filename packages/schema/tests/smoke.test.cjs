const p = require('@agentscript-ai/schema');

// Simple smoke test to verify the package can be required
if (!p) throw new Error('Package failed to load');
