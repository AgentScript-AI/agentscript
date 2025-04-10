const s = require('@agentscript-ai/serializer');

// Simple smoke test to verify the package can be required
if (!s) throw new Error('Package failed to load');
