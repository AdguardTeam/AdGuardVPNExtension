import { useEffect } from 'react';

/**
 * Adds "centered-view" class to body when mounted
 * in order to center view inside of content wrapper.
 * Removes class when component is unmounted.
 */
export function useCenteredView() {
    useEffect(() => {
        document.body.classList.add('centered-view');

        return () => {
            document.body.classList.remove('centered-view');
        };
    }, []);
}
