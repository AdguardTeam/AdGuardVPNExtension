import React from 'react';

import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
} from 'vitest';
import { render, fireEvent } from '@testing-library/react';

const mockProfiles: Array<{ id: string; name: string }> = [];

vi.mock('../../../../../src/common/reactTranslator', () => ({
    reactTranslator: {
        getMessage: vi.fn((_key: string, params?: Record<string, unknown>) => {
            const profileName = (params as Record<string, string>)?.profile_name || '';
            return (
                <>
                    Applies to your
                    <b>{profileName}</b>
                    {' '}
                    profile
                </>
            );
        }),
    },
}));

vi.mock('../../../../../src/options/stores', () => {
    const React = require('react'); // eslint-disable-line global-require

    const store = {
        profilesStore: {
            get profiles(): Array<{ id: string; name: string }> {
                return mockProfiles;
            },
            get activeProfileId(): string {
                return 'profile-1';
            },
            getDisplayName: vi.fn((p: { id: string; name: string }) => p.name),
        },
    };

    return { rootStore: React.createContext(store) };
});

// eslint-disable-next-line import/first
import { ProfileHint } from '../../../../../src/options/components/ui/ProfileHint';

function renderHint(hintProps: { profileId?: string; onClick?: (id: string) => void } = {}): {
    container: HTMLElement;
} {
    const { container } = render(<ProfileHint profileId={hintProps.profileId} onClick={hintProps.onClick} />);
    return { container };
}

describe('ProfileHint', () => {
    beforeEach(() => {
        mockProfiles.length = 0;
        vi.clearAllMocks();
    });

    describe('visibility (null render)', () => {
        it('should return null when profiles list is empty', () => {
            const { container } = renderHint();
            expect(container.innerHTML).toBe('');
        });

        it('should return null when only one profile exists', () => {
            mockProfiles.push({ id: 'profile-1', name: 'Default' });
            const { container } = renderHint();
            expect(container.innerHTML).toBe('');
        });

        it('should return null when profileId does not match any profile', () => {
            mockProfiles.push(
                { id: 'profile-1', name: 'Default' },
                { id: 'profile-2', name: 'Work' },
            );
            const { container } = renderHint({ profileId: 'nonexistent' });
            expect(container.innerHTML).toBe('');
        });
    });

    describe('text content', () => {
        it('should render profile name in bold when profiles > 1', () => {
            mockProfiles.push(
                { id: 'profile-1', name: 'Default' },
                { id: 'profile-2', name: 'Work' },
            );
            const { container } = renderHint({ profileId: 'profile-2' });
            expect(container.textContent).toContain('Work');
            const boldEl = container.querySelector('b');
            expect(boldEl).not.toBeNull();
            expect(boldEl!.textContent).toBe('Work');
        });
    });

    describe('colour', () => {
        it('should render with profile-hint class when visible', () => {
            mockProfiles.push(
                { id: 'profile-1', name: 'Default' },
                { id: 'profile-2', name: 'Work' },
            );
            const { container } = renderHint({ profileId: 'profile-2' });
            const el = container.firstElementChild;
            expect(el).not.toBeNull();
            expect(el!.className).toContain('profile-hint');
        });
    });

    describe('element type', () => {
        it('should render as <div> when onClick is omitted', () => {
            mockProfiles.push(
                { id: 'profile-1', name: 'Default' },
                { id: 'profile-2', name: 'Work' },
            );
            const { container } = renderHint({ profileId: 'profile-2' });
            const el = container.firstElementChild;
            expect(el).not.toBeNull();
            expect(el!.tagName).toBe('DIV');
        });

        it('should render as <button> when onClick is provided', () => {
            mockProfiles.push(
                { id: 'profile-1', name: 'Default' },
                { id: 'profile-2', name: 'Work' },
            );
            const { container } = renderHint({
                profileId: 'profile-2',
                onClick: () => {},
            });
            const el = container.firstElementChild;
            expect(el).not.toBeNull();
            expect(el!.tagName).toBe('BUTTON');
        });

        it('should set type="button" on the button element', () => {
            mockProfiles.push(
                { id: 'profile-1', name: 'Default' },
                { id: 'profile-2', name: 'Work' },
            );
            const { container } = renderHint({
                profileId: 'profile-2',
                onClick: () => {},
            });
            const button = container.querySelector('button');
            expect(button).not.toBeNull();
            expect(button!.getAttribute('type')).toBe('button');
        });
    });

    describe('click behavior', () => {
        it('should fire onClick with resolved profileId on click', () => {
            const onClick = vi.fn();
            mockProfiles.push(
                { id: 'profile-1', name: 'Default' },
                { id: 'profile-2', name: 'Work' },
            );
            const { container } = renderHint({
                profileId: 'profile-2',
                onClick,
            });
            const button = container.querySelector('button');
            fireEvent.click(button!);
            expect(onClick).toHaveBeenCalledTimes(1);
            expect(onClick).toHaveBeenCalledWith('profile-2');
        });

        it('should fire onClick with activeProfileId when profileId is omitted', () => {
            const onClick = vi.fn();
            mockProfiles.push(
                { id: 'profile-1', name: 'Default' },
                { id: 'profile-2', name: 'Work' },
            );
            const { container } = renderHint({ onClick });
            const button = container.querySelector('button');
            fireEvent.click(button!);
            expect(onClick).toHaveBeenCalledWith('profile-1');
        });
    });
});
