import { expect, test } from 'vitest';

import { renderComment } from './renderComment.js';

test('single line', () => {
    const comment = 'Hello';

    expect(renderComment([comment])).toEqual(`/** Hello */`);
});

test('multiple lines', () => {
    const comment = ['Hello', 'World'];

    expect(renderComment(comment)).toEqual(`/**\n * Hello\n * World\n */`);
});
