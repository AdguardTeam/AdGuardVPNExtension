/**
 * IMPORTANT:
 * Do not import inside this file other dependencies,
 * because imports of this file are also used in the popup
 * and redundant code from background may get into popup code
 */

/**
 * Enum which represents current web authentication state.
 */
export enum WebAuthState {
    /**
     * Idle state - waiting for user to start the web authentication flow.
     *
     * In this state web authentication screen will not be shown.
     */
    Idle = 'idle',

    /**
     * Loading state - web authentication flow is started and in progress.
     *
     * In this state web authentication screen will be shown **with loader**.
     */
    Loading = 'loading',

    /**
     * Failed state - web authentication flow is started but failed to complete.
     *
     * In this state web authentication screen will be shown **with error modal**.
     */
    Failed = 'failed',

    /**
     * FailedByUser state - web authentication flow is failed
     * because user closed or moved away from the web authentication tab.
     *
     * In this state web authentication screen will be shown **with error modal** but without support link.
     */
    FailedByUser = 'failedByUser',

    /**
     * Opened state - web authentication flow is started but nothing is happening currently,
     * and waiting for user to either reopen the flow or cancel it.
     *
     * In this state web authentication screen will be shown **without loader and error modal**.
     */
    Opened = 'opened',
}

/**
 * Enum which represents web authentication actions.
 */
export enum WebAuthAction {
    /**
     * Start the web authentication flow.
     */
    Start = 'start',

    /**
     * Reopen the web authentication flow.
     */
    Reopen = 'reopen',

    /**
     * Cancel the web authentication flow.
     */
    Cancel = 'cancel',

    /**
     * Dismiss the error modal shown when the web authentication flow fails.
     */
    DismissFailure = 'dismissFailure',

    /**
     * Emitted when the web authentication flow fails.
     */
    Fail = 'fail',

    /**
     * Emitted when the web authentication tab is closed or moved away.
     */
    TabModified = 'tabModified',

    /**
     * Emitted when the web authentication flow succeeds.
     */
    Succeed = 'succeed',
}
