import { type RefObject, useEffect } from 'react';

/**
 * Traps focus on given element.
 *
 * @param ref Element to which trap focus.
 * @param active Is focus trap active or not.
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
    ref: RefObject<T>,
    active: boolean,
) {
    useEffect(() => {
        const element = ref.current;

        if (!active || !element) {
            return;
        }

        // add any focusable HTML element you want to include to this string
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // If we had focus before, we should re-focus to element
        if (document.activeElement !== document.body) {
            if (firstElement instanceof HTMLElement) {
                firstElement.focus();
            }
        }

        const handleTabKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'Tab') {
                if (e.shiftKey && document.activeElement === firstElement) {
                    e.preventDefault();
                    if (lastElement instanceof HTMLElement) {
                        lastElement.focus();
                    }
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault();
                    if (firstElement instanceof HTMLElement) {
                        firstElement.focus();
                    }
                }
            }
        };

        element.addEventListener('keydown', handleTabKeyPress);

        // eslint-disable-next-line consistent-return
        return () => {
            element.removeEventListener('keydown', handleTabKeyPress);
        };
    }, [active]);
}
