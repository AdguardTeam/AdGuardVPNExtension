import { useEffect } from 'react';

/**
 * Source https://gist.github.com/gragland/81a678775c30edfdbb224243fc0d1ec4
 * @param ref
 * @param handler
 */
export const useOnClickOutside = (ref, handler) => {
    useEffect(
        () => {
            const listener = (event) => {
                // Do nothing if clicking ref's element or descendent elements
                if (!ref.current || ref.current.contains(event.target)) {
                    return;
                }

                handler(event);
            };

            document.addEventListener('mousedown', listener);
            document.addEventListener('touchstart', listener);

            return () => {
                document.removeEventListener('mousedown', listener);
                document.removeEventListener('touchstart', listener);
            };
        },

        [ref, handler],
    );
};
