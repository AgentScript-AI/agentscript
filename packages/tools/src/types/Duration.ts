import * as s from '@agentscript.ai/schema';

/**
 * Duration type.
 */
export type Duration = s.Infer<typeof Duration>;

/**
 * Duration type schema.
 */
export const Duration = s.object({
    props: {
        years: s.number({ optional: true }),
        months: s.number({ optional: true }),
        days: s.number({ optional: true }),
        hours: s.number({ optional: true }),
        minutes: s.number({ optional: true }),
        seconds: s.number({ optional: true }),
    },
});
