/**
 * This service is for managing the extension state.
 * The state is stored in session storage in order to
 * quickly restore it after the service worker wakes up.
 */
import { browserApi } from './browserApi';
import { StateStorageMV2, StateStorageMV3 } from './stateStorage';

// FIXME: remove
export const sessionState = browserApi.runtime.isManifestVersion2()
    ? new StateStorageMV2()
    : new StateStorageMV3();
