import {
    describe,
    it,
    expect,
    vi,
} from 'vitest';

import { PromiseQueue } from '../../src/common/promiseQueue';

describe('PromiseQueue', () => {
    it('should run operations sequentially in FIFO order', async () => {
        const queue = new PromiseQueue();
        const order: string[] = [];
        let releaseFirst: () => void = () => {
            // overridden by the deferred promise below
        };

        const first = queue.enqueue(async () => {
            order.push('first');
            await new Promise<void>((resolve) => {
                releaseFirst = resolve;
            });
        });
        const second = queue.enqueue(async () => {
            order.push('second');
        });

        await vi.waitFor(() => expect(order).toEqual(['first']));
        expect(order).not.toContain('second');

        releaseFirst();
        await Promise.all([first, second]);

        expect(order).toEqual(['first', 'second']);
    });

    it('should return the operation result', async () => {
        const queue = new PromiseQueue();

        await expect(queue.enqueue(async () => 42)).resolves.toBe(42);
    });

    it('should not block subsequent operations when one rejects', async () => {
        const queue = new PromiseQueue();
        const order: string[] = [];

        const failing = queue.enqueue(async () => {
            order.push('failing');
            throw new Error('boom');
        });
        const next = queue.enqueue(async () => {
            order.push('next');
        });

        await expect(failing).rejects.toThrow('boom');
        await next;

        expect(order).toEqual(['failing', 'next']);
    });
});
