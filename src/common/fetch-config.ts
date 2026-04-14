// this variable is located in separate file to avoid side effects
// which are caused by importing it to different places
export const fetchConfig = {
    adapter: 'fetch' as const,
};
