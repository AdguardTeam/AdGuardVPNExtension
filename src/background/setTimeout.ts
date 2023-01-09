import { browserApi } from './browserApi';

// eslint-disable-next-line no-restricted-globals
export const setTimeout = browserApi.runtime.isManifestVersion2() ? window.setTimeout : self.setTimeout;
