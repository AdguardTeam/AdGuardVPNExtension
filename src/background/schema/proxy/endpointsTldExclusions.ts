import zod from 'zod';

export const endpointsTldExclusionsScheme = zod.object({
    endpointsTldExclusionsList: zod.string().array(),
}).strict();

export type EndpointsTldExclusionsState = zod.infer<typeof endpointsTldExclusionsScheme>;

export const ENDPOINTS_TLD_EXCLUSIONS_DEFAULTS: EndpointsTldExclusionsState = {
    endpointsTldExclusionsList: [],
};
