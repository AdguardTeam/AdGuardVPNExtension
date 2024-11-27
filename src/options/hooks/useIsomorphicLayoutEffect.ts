import { useEffect, useLayoutEffect } from 'react';

// FIXME: Add jsdoc

export const useIsomorphicLayoutEffect = typeof window !== 'undefined'
    ? useLayoutEffect
    : useEffect;
