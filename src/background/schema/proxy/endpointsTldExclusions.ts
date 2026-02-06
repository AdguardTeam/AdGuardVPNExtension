import * as v from 'valibot';

export const endpointsTldExclusionsScheme = v.strictObject({
    endpointsTldExclusionsList: v.array(v.string()),
});

export type EndpointsTldExclusionsState = v.InferOutput<typeof endpointsTldExclusionsScheme>;

export const ENDPOINTS_TLD_EXCLUSIONS_DEFAULTS: EndpointsTldExclusionsState = {
    endpointsTldExclusionsList: [],
};
