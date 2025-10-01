import type React from 'react';
import { useEffect } from 'react';

/**
 * A hook that calls provided handler on focusin event.
 * https://github.com/AdguardTeam/AdGuardVPNExtension/issues/121.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Element/focusin_event}
 *
 * @param ref
 * @param handler
 */
export const useOutsideFocus = (
    ref: React.RefObject<HTMLDivElement>,
    handler: (event: Event) => void,
): void => {
    const listener = (event: Event): void => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
            handler(event);
        }
    };

    useEffect(
        () => {
            document.addEventListener('focusin', listener);
            return (): void => {
                document.removeEventListener('focusin', listener);
            };
        },
        [ref, handler],
    );
};
