import { expect, test } from 'vitest';

import { joinLines } from '@agentscript-ai/utils';

import { renderComment } from './renderComment.js';
import { createRenderContext } from './renderContext.js';

test('single line', () => {
    const comment = 'Hello';
    const ctx = createRenderContext();
    const code = renderComment([comment], ctx);

    expect(code).toEqual(`/** Hello */`);
});

test('multiple lines', () => {
    const comment = ['Hello', 'World'];
    const ctx = createRenderContext();
    const code = renderComment(comment, ctx);

    expect(code).toEqual(
        joinLines([
            //
            '/**',
            ' * Hello',
            ' * World',
            ' */',
        ]),
    );
});
