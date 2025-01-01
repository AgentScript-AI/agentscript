import { randomString } from '@nzyme/crypto-utils';

export function randomUid() {
    return randomString(12);
}
