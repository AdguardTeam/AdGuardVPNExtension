import { type PropsWithChildren, type ReactPortal as RP } from 'react';
import { createPortal } from 'react-dom';

export function ReactPortal({ children }: PropsWithChildren): RP {
    return createPortal(children, document.body);
}
