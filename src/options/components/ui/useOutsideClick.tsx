import React, { useEffect } from 'react';

export const ESC_KEY_NAME = 'Escape';

/**
 * A hook that calls provided handler on outside click of referenced element
 * or ESC key pressed (https://github.com/AdguardTeam/AdGuardVPNExtension/issues/90)
 * @param ref
 * @param handler
 */
export const useOutsideClick = (
    ref: React.RefObject<HTMLDivElement>,
    handler: (event: MouseEvent | KeyboardEvent) => void,
) => {
    useEffect(
        () => {
            const listener = (event: MouseEvent | KeyboardEvent) => {
                if ((event instanceof KeyboardEvent && event.key === ESC_KEY_NAME)
                    || (ref.current && !ref.current.contains(event.target as Node))) {
                    handler(event);
                }
            };
            document.addEventListener('click', listener);
            document.addEventListener('keydown', listener);
            return () => {
                document.removeEventListener('click', listener);
                document.removeEventListener('keydown', listener);
            };
        },
        [ref, handler],
    );
};
