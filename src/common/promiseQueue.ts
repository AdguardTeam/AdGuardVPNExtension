/**
 * FIFO queue that runs promise-returning operations one at a time.
 * Provides a method decorator for serialized execution.
 *
 * Decorate only async prototype methods. A decorated method must not call
 * another decorated method of the same queue and await it, otherwise it
 * deadlocks waiting for a task that cannot start.
 */
export class PromiseQueue {
    /**
     * Promise that resolves when all previously enqueued operations finish.
     */
    private tail: Promise<void> = Promise.resolve();

    /**
     * Method decorator that enqueues decorated method calls in FIFO order.
     * A rejected operation propagates its rejection to the caller but does
     * not block the following operations.
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
     * Enqueues an operation to run after all previously enqueued ones finish.
     * The returned promise settles with the operation result. A rejected
     * operation propagates its rejection to the caller but does not block
     * the following operations.
     *
     * @param operation Operation to run.
     *
     * @returns Operation result.
     */
    public enqueue<T>(operation: () => Promise<T>): Promise<T> {
        const result = this.tail.then(operation, operation);
        this.tail = result.then(
            () => undefined,
            () => undefined,
        );
        return result;
    }
}
