import { useEffect } from 'react';

// FIXME: Add jsdoc

export function useCenteredView() {
    useEffect(() => {
        document.body.classList.add('centered-view');

        return () => {
            document.body.classList.remove('centered-view');
        };
    }, []);
}
