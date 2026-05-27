import {
    describe,
    beforeEach,
    it,
    expect,
    vi,
} from 'vitest';

import { CancelledError } from '../../../src/background/profiles/CancelledError';
import { SerializedQueue } from '../../../src/background/profiles/serializedQueue';

/**
 * Creates a promise that can be resolved/rejected externally.
 */
function deferred<T = void>() {
    let resolve!: (value: T) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

/**
 * Helper class that decorates a method with the queue's decorator.
 */
function createRunner(queue: SerializedQueue) {
    const { decorator: serialized } = queue;

    class Runner {
        @serialized
        public static run(fn: () => Promise<unknown>): Promise<unknown> {
            return fn();
        }
    }

    return Runner;
}

describe('SerializedQueue', () => {
    let queue: SerializedQueue;

    beforeEach(() => {
        queue = new SerializedQueue();
    });

    // ---- FIFO order ----

    it('executes tasks in FIFO order', async () => {
        const Runner = createRunner(queue);
        const order: number[] = [];

        const d1 = deferred();
        const d2 = deferred();
        const d3 = deferred();

        const p1 = Runner.run(async () => { await d1.promise; order.push(1); });
        const p2 = Runner.run(async () => { await d2.promise; order.push(2); });
        const p3 = Runner.run(async () => { await d3.promise; order.push(3); });

        d1.resolve();
        await p1;

        d2.resolve();
        await p2;

        d3.resolve();
        await p3;

        expect(order).toEqual([1, 2, 3]);
    });

    it('waits for the previous task before starting the next', async () => {
        const Runner = createRunner(queue);
        const d1 = deferred();
        let secondStarted = false;

        Runner.run(() => d1.promise);
        const p2 = Runner.run(async () => { secondStarted = true; });

        // Flush microtasks — second task should still be blocked.
        await Promise.resolve();
        expect(secondStarted).toBe(false);

        d1.resolve();
        await p2;
        expect(secondStarted).toBe(true);
    });

    // ---- isLast / isActive ----

    it('isLast() returns true when only one task is queued', async () => {
        const Runner = createRunner(queue);
        const d1 = deferred();
        let lastDuringRun = false;

        const p1 = Runner.run(async () => {
            await d1.promise;
            lastDuringRun = queue.isLast();
        });

        d1.resolve();
        await p1;
        expect(lastDuringRun).toBe(true);
    });

    it('isLast() returns false when multiple tasks are queued', async () => {
        const Runner = createRunner(queue);
        const d1 = deferred();
        let lastDuringRun = false;

        Runner.run(async () => {
            await d1.promise;
            lastDuringRun = queue.isLast();
        });
        Runner.run(async () => {});

        d1.resolve();
        // Wait for both to finish.
        await new Promise((r) => { setTimeout(r, 0); });
        expect(lastDuringRun).toBe(false);
    });

    it('isActive() is true while tasks are running', async () => {
        const Runner = createRunner(queue);
        const d1 = deferred();

        expect(queue.isActive()).toBe(false);

        const p1 = Runner.run(() => d1.promise);

        expect(queue.isActive()).toBe(true);

        d1.resolve();
        await p1;
        // Wait for pending counter decrement (happens in tail .then chain).
        await Promise.resolve();
        await Promise.resolve();
        expect(queue.isActive()).toBe(false);
    });

    // ---- Error isolation ----

    it('rejection in one task does not block subsequent tasks', async () => {
        const Runner = createRunner(queue);
        const error = new Error('boom');

        const p1 = Runner.run(() => Promise.reject(error));
        const p2 = Runner.run(async () => 'ok');

        await expect(p1).rejects.toThrow('boom');
        await expect(p2).resolves.toBe('ok');
    });

    // ---- clear() ----

    it('clear() rejects pending tasks with CancelledError', async () => {
        const Runner = createRunner(queue);
        const d1 = deferred();
        const spy = vi.fn();

        const p1 = Runner.run(() => d1.promise);
        const p2 = Runner.run(spy);

        // Let p1's task body start executing (pass the generation check).
        await Promise.resolve();

        queue.clear();
        d1.resolve();

        const [r1, r2] = await Promise.allSettled([p1, p2]);

        expect(r1.status).toBe('fulfilled');
        expect(r2.status).toBe('rejected');
        expect((r2 as PromiseRejectedResult).reason).toBeInstanceOf(CancelledError);
        expect(spy).not.toHaveBeenCalled();
    });

    it('clear() does not cancel the currently running task', async () => {
        const Runner = createRunner(queue);
        const d1 = deferred();
        const spy = vi.fn();

        const p1 = Runner.run(async () => {
            await d1.promise;
            spy();
            return 'done';
        });

        // Let the task start.
        await Promise.resolve();

        queue.clear();
        d1.resolve();

        // The already-running function body still executes.
        await expect(p1).resolves.toBe('done');
        expect(spy).toHaveBeenCalledOnce();
    });

    // ---- Generation counter ----

    it('stale tasks after clear() do not corrupt the pending counter', async () => {
        const Runner = createRunner(queue);
        const d1 = deferred();

        Runner.run(() => d1.promise);
        const p2 = Runner.run(async () => {});
        p2.catch(() => {});

        queue.clear();
        d1.resolve();

        // Let everything settle.
        await new Promise((r) => { setTimeout(r, 0); });

        // pending should be 0 — stale decrements must be ignored.
        expect(queue.isActive()).toBe(false);
    });

    it('new tasks enqueued after clear() execute normally', async () => {
        const Runner = createRunner(queue);
        const d1 = deferred();

        const p1 = Runner.run(() => d1.promise);
        p1.catch(() => {});
        queue.clear();

        d1.resolve();
        await new Promise((r) => { setTimeout(r, 0); });

        const result = await Runner.run(async () => 'after-clear');
        expect(result).toBe('after-clear');
        // Let the tail chain decrement pending.
        await new Promise((r) => { setTimeout(r, 0); });
        expect(queue.isActive()).toBe(false);
    });
});
