import { type RefObject, useEffect, useState } from 'react';

export interface ElementRect {
    width: number
    height: number
    x: number
    y: number
}

export function useElementRect(
    ref: RefObject<HTMLElement>,
    key?: string,
    attach: boolean = true,
    attachOnBody: boolean = false,
) {
    const [rect, setRect] = useState<ElementRect>({
        width: 0,
        height: 0,
        x: 0,
        y: 0,
    });

    useEffect(() => {
        if (!ref.current) {
            return;
        }

        const element = ref.current;

        const onResize = () => {
            const rect = element.getBoundingClientRect();
            setRect({
                width: rect.width,
                height: rect.height,
                x: rect.x,
                y: rect.y,
            });
        };
        const observer = new ResizeObserver(onResize);

        onResize();
        window.addEventListener('resize', onResize);
        observer.observe(element);

        // eslint-disable-next-line consistent-return
        return () => {
            setRect({
                width: 0,
                height: 0,
                x: 0,
                y: 0,
            });
            window.removeEventListener('resize', onResize);
            observer.disconnect();
        };
    }, [ref]);

    useEffect(() => {
        if (!key || !ref.current || !attach) {
            return;
        }
        let element = ref.current;
        if (attachOnBody) {
            element = document.body;
        }

        element.style.setProperty(`--${key}-width`, `${rect.width}px`);
        element.style.setProperty(`--${key}-height`, `${rect.height}px`);
        element.style.setProperty(`--${key}-x`, `${rect.x}px`);
        element.style.setProperty(`--${key}-y`, `${rect.y}px`);

        // eslint-disable-next-line consistent-return
        return () => {
            element.style.removeProperty(`--${key}-width`);
            element.style.removeProperty(`--${key}-height`);
            element.style.removeProperty(`--${key}-x`);
            element.style.removeProperty(`--${key}-y`);
        };
    }, [key, rect, attach, attachOnBody]);

    return rect;
}
