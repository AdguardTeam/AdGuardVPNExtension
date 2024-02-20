// TODO: use internal axios fetch adapter after they release it instead of @vespaiach/axios-fetch-adapter
// https://github.com/axios/axios/pull/5146
import fetchAdapter from '@vespaiach/axios-fetch-adapter';

// this variable is located in separate file to avoid side effects
// which are caused by importing it to different places
export const fetchConfig = {
    adapter: fetchAdapter,
};
