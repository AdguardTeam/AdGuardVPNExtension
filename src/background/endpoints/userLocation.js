import vpnProvider from '../providers/vpnProvider';
import log from '../../lib/logger';
import browserApi from '../browserApi';

const CURRENT_LOCATION = 'current.location';

const getCurrentLocationRemote = async () => {
    const MIDDLE_OF_EUROPE = { coordinates: [51.05, 13.73] }; // Chosen approximately
    let currentLocation;
    try {
        currentLocation = await vpnProvider.getCurrentLocation();
    } catch (e) {
        log.error(e.message);
    }

    // if current location wasn't received use predefined
    currentLocation = currentLocation || MIDDLE_OF_EUROPE;

    await browserApi.storage.set(CURRENT_LOCATION, currentLocation);

    return currentLocation;
};

const getCurrentLocation = async () => {
    const currentLocation = await browserApi.storage.get(CURRENT_LOCATION);
    if (!currentLocation) {
        // update current location information in background
        return getCurrentLocationRemote();
    }
    return currentLocation;
};

export default getCurrentLocation;
