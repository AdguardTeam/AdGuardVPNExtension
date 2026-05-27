import { CancelledError } from './CancelledError';

/**
 * Serial queue that provides a method decorator for serialized execution,
 * plus `clear()` and `isLast()` for queue-aware control flow.
 *
 * All methods decorated with `decorator` execute one at a time in FIFO order.
 * Rejections propagate to the caller but do not block subsequent operations.
 */
export class SerializedQueue {
    private tail: Promise<void> = Promise.resolve();

    private pending = 0;

    private generation = 0;

    /**
     * Method decorator that adds calls to the serial queue.
     *
     * @returns Modified property descriptor with serialized execution.
     */
    public readonly decorator: MethodDecorator = (
        _target: object,
        _propertyKey: string | symbol,
        descriptor: PropertyDescriptor,
    ): PropertyDescriptor => {
        const original = descriptor.value;
        const queue = this;

        return {
            ...descriptor,
            value(this: unknown, ...args: unknown[]): Promise<unknown> {
                return queue.enqueue(() => original.apply(this, args));
            },
        };
    };

    /**
     * Cancels all pending (not yet started) operations in the queue.
     */
    public clear(): void {
        this.generation += 1;
        this.pending = 0;
        this.tail = Promise.resolve();
    }

    /**
     * Returns `true` if the currently running task is the last one in the queue.
     */
    public isLast(): boolean {
        return this.pending <= 1;
    }

    /**
     * Returns `true` if the queue has any pending or running tasks.
     */
    public isActive(): boolean {
        return this.pending > 0;
    }

    private enqueue<T>(fn: () => Promise<T>): Promise<T> {
        const capturedGen = this.generation;
        this.pending += 1;

        const task = this.tail.then(async (): Promise<T> => {
            if (capturedGen !== this.generation) {
                if (this.pending > 0) {
                    this.pending -= 1;
                }
                throw new CancelledError();
            }

            return fn();
        });

        this.tail = task.catch(() => {}).then(() => {
            if (capturedGen === this.generation && this.pending > 0) {
                this.pending -= 1;
            }
        });

        return task;
    }
}
