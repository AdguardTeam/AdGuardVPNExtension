import vpnProvider from '../providers/vpnProvider';
import log from '../../lib/logger';


class UserLocation {
    MIDDLE_OF_EUROPE = { coordinates: [51.05, 13.73] }; // Chosen approximately

    getCurrentLocationRemote = async () => {
        let newLocation = {};
        try {
            newLocation = await vpnProvider.getCurrentLocation();
        } catch (e) {
            log.error(e.message);
        }

        // if current location wasn't received use predefined
        this.currentLocation = newLocation || this.MIDDLE_OF_EUROPE;

        return this.currentLocation;
    };

    getCurrentLocation = async () => this.currentLocation || this.getCurrentLocationRemote();
}

const userLocation = new UserLocation();

export default userLocation;
