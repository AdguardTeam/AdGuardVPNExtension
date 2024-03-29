import React from 'react';

import { SkeletonEndpoint } from '../ui/SkeletonEndpoint';

/**
 * Component for the fastest locations skeleton, used when the fastest locations are loading.
 *
 * @returns Fastest locations skeleton component.
 */
export const FastestSkeleton = () => {
    return (
        <div className="endpoints__fastest-skeleton">
            <SkeletonEndpoint />
            <SkeletonEndpoint />
            <SkeletonEndpoint />
        </div>
    );
};
