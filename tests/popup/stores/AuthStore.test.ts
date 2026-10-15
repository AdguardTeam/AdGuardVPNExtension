import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
} from 'vitest';

const setFlag = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock('../../../src/common/messenger', () => ({ messenger: { setFlag } }));

// eslint-disable-next-line import/first
import { AuthStore } from '../../../src/popup/stores/AuthStore';
// eslint-disable-next-line import/first
import { FLAGS_FIELDS } from '../../../src/common/constants';
// eslint-disable-next-line import/first
import { type RootStore } from '../../../src/popup/stores/RootStore';

const makeStore = (): AuthStore => new AuthStore({} as unknown as RootStore);

/**
 * Seeds auth flags so the show-upgrade-screen observable is initialized.
 *
 * @param store Auth store to initialize.
 * @param overrides Flag values that override the defaults.
 */
const seedFlags = (store: AuthStore, overrides: Record<string, boolean> = {}): void => {
    store.setFlagsStorageData({
        [FLAGS_FIELDS.IS_NEW_USER]: true,
        [FLAGS_FIELDS.SHOW_NEWSLETTER]: false,
        [FLAGS_FIELDS.SHOW_ONBOARDING]: false,
        [FLAGS_FIELDS.SHOW_UPGRADE_SCREEN]: true,
        [FLAGS_FIELDS.SHOULD_SHOW_RATE_MODAL]: false,
        ...overrides,
    });
};

describe('AuthStore.setShowUpgradeScreen', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('hiding the upgrade screen persists the hidden state', async () => {
        const store = makeStore();
        await store.setShowUpgradeScreen(false);

        expect(setFlag).toHaveBeenCalledWith(FLAGS_FIELDS.SHOW_UPGRADE_SCREEN, false);
    });

    it('shows the upgrade screen when enabled', async () => {
        const store = makeStore();
        await store.setShowUpgradeScreen(true);

        expect(setFlag).toHaveBeenCalledWith(FLAGS_FIELDS.SHOW_UPGRADE_SCREEN, true);
    });

    it('persists when the flag is already enabled', async () => {
        const store = makeStore();
        seedFlags(store);

        await store.setShowUpgradeScreen(true);

        expect(setFlag).toHaveBeenCalledWith(FLAGS_FIELDS.SHOW_UPGRADE_SCREEN, true);
    });

    it('persists when the flag is already hidden', async () => {
        const store = makeStore();
        seedFlags(store, { [FLAGS_FIELDS.SHOW_UPGRADE_SCREEN]: false });

        await store.setShowUpgradeScreen(false);

        expect(setFlag).toHaveBeenCalledWith(FLAGS_FIELDS.SHOW_UPGRADE_SCREEN, false);
    });

    it('resets forced rendering before propagating a storage error and keeps the local flag stale', async () => {
        let rejectStorageWrite: (reason: Error) => void = () => {};
        setFlag.mockImplementationOnce(() => new Promise<void>((_, reject) => {
            rejectStorageWrite = reject;
        }));

        const store = makeStore();
        seedFlags(store);
        store.setForceShowUpgradeScreen(true);

        const pending = store.setShowUpgradeScreen(false);

        // The in-memory upgrade flag remains true until the storage write succeeds.
        expect(store.renderUpgradeScreen).toBe(true);

        rejectStorageWrite(new Error('storage unavailable'));
        await expect(pending).rejects.toThrow('storage unavailable');

        // Turning off the force flag leaves the stale in-memory upgrade flag visible.
        store.setForceShowUpgradeScreen(false);
        expect(store.renderUpgradeScreen).toBe(true);
    });

    it('clears the forced upgrade screen when hiding it', async () => {
        const store = makeStore();
        seedFlags(store);
        store.setForceShowUpgradeScreen(true);
        expect(store.renderUpgradeScreen).toBe(true);

        await store.setShowUpgradeScreen(false);

        expect(store.renderUpgradeScreen).toBe(false);
    });
});
