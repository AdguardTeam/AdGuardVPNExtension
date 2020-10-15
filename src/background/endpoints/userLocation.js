import vpnProvider from '../providers/vpnProvider';
import { log } from '../../lib/logger';

/**
 * Class that determines user location and keeps it in the memory
 * Used to determine closest endpoint to the user location on extension start
 * and in order to sort endpoints by distance
 */
class UserLocation {
    // Chosen approximately
    MIDDLE_OF_EUROPE = { coordinates: [51.05, 13.73] };

    getCurrentLocationRemote = async () => {
        let newLocation;
        try {
            newLocation = await vpnProvider.getCurrentLocation();
        } catch (e) {
            log.error(e.message);
        }

        // if current location wasn't received use predefined
        this.currentLocation = newLocation || this.MIDDLE_OF_EUROPE;

        return this.currentLocation;
    };

    getCurrentLocation = async () => {
        if (this.currentLocation) {
            return this.currentLocation;
        }
        return this.getCurrentLocationRemote();
    }
}

const userLocation = new UserLocation();

export default userLocation;
