import { useEffect } from 'react';

function setBodyLockedState(locked: boolean) {
    if (locked) {
        document.body.classList.add('locked');
    } else {
        document.body.classList.remove('locked');
    }
}

/**
 * Adds "locked" class to body when mounted
 * in order to center view inside of content wrapper.
 * Removes class when component is unmounted.
 * This class locks scrolling to entire body.
 */
export function useLockBody(locked: boolean) {
    useEffect(() => {
        setBodyLockedState(locked);

        return () => {
            setBodyLockedState(false);
        };
    }, [locked]);
}
