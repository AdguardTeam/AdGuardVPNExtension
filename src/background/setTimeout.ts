import { browserApi } from './browserApi';

const isMV2 = browserApi.runtime.isManifestVersion2();

// eslint-disable-next-line no-restricted-globals
export const setTimeoutImplemented = isMV2 ? window.setTimeout : self.setTimeout;

// eslint-disable-next-line no-restricted-globals
export const clearTimeoutImplemented = isMV2 ? window.clearTimeout : self.clearTimeout;
