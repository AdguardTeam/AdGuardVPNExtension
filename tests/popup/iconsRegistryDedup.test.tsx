import React from 'react';

import {
    describe,
    it,
    expect,
    vi,
} from 'vitest';
import { render } from '@testing-library/react';

// Shared store context used by both screens (only the fields they read).
vi.mock('../../src/popup/stores', () => {
    const React = require('react'); // eslint-disable-line global-require
    const store = {
        settingsStore: { canBeExcluded: false },
        vpnStore: {
            forceUpdateLocations: vi.fn(),
            setLocations: vi.fn(),
        },
    };
    return { rootStore: React.createContext(store) };
});

vi.mock('../../src/common/reactTranslator', () => ({
    reactTranslator: { getMessage: vi.fn((key: string) => key) },
}));

vi.mock('../../src/common/is-locations-number-acceptable', () => ({
    isLocationsNumberAcceptable: vi.fn(() => false),
}));

// Mock the shared skeleton chrome so the test focuses on the Icons sprite.
vi.mock('../../src/popup/components/ui/SkeletonHeader', () => ({
    SkeletonHeader: () => null,
}));
vi.mock('../../src/popup/components/ui/SkeletonEndpoint', () => ({
    SkeletonEndpoint: () => null,
}));
vi.mock('../../src/popup/components/Settings/BackgroundAnimation', () => ({
    BackgroundAnimation: () => null,
}));

// eslint-disable-next-line import/first
import { Icons } from '../../src/common/components/Icons';
// eslint-disable-next-line import/first
import { SkeletonLoading } from '../../src/popup/components/SkeletonLoading/SkeletonLoading';
// eslint-disable-next-line import/first
import { NoLocationsError } from '../../src/popup/components/NoLocationsError/NoLocationsError';

/**
 * The Icons registry renders a single hidden <svg className="hidden"> sprite.
 * Counting these nodes lets the test assert the sprite is rendered exactly
 * once.
 */
const ICONS_SPRITE = 'svg.hidden';

describe('popup Icons registry deduplication', () => {
    it('SkeletonLoading does not render its own Icons sprite (lifted to App)', () => {
        const { container } = render(<SkeletonLoading />);

        expect(container.querySelectorAll(ICONS_SPRITE)).toHaveLength(0);
    });

    it('NoLocationsError does not render its own Icons sprite (lifted to App)', () => {
        const { container } = render(<NoLocationsError />);

        expect(container.querySelectorAll(ICONS_SPRITE)).toHaveLength(0);
    });

    it('composing a screen with the top-level Icons renders the sprite exactly once', () => {
        const { container } = render(
            <>
                <NoLocationsError />
                <Icons />
            </>,
        );

        expect(container.querySelectorAll(ICONS_SPRITE)).toHaveLength(1);
    });
});
