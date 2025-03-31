import { browserApi } from '../browserApi';

import { SavedLocations } from './SavedLocations';

export const savedLocations = new SavedLocations({
    storage: browserApi.storage,
});
