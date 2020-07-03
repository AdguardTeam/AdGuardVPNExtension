import proxy from './proxy';
import credentials from './credentials';
import connectivity from './connectivity';
import { locationsService } from './endpoints/locationsService';
import { connectivityService, TRANSITION } from './connectivity/connectivityFSM';

export const turnOnProxy = async () => {
    try {
        const selectedLocation = await locationsService.getSelectedLocation();
        const selectedEndpoint = await locationsService.getEndpointByLocation(selectedLocation);

        if (selectedEndpoint) {
            await proxy.setCurrentEndpoint(selectedEndpoint, selectedLocation);
        }

        const accessCredentials = await credentials.getAccessCredentials();

        const { domainName } = await proxy.setAccessPrefix(
            accessCredentials.credentialsHash,
            accessCredentials.credentials
        );

        connectivity.endpointConnectivity.setCredentials(
            domainName,
            accessCredentials.token,
            accessCredentials.credentialsHash
        );

        connectivity.endpointConnectivity.start();
    } catch (e) {
        connectivityService.send(TRANSITION.CONNECTION_FAIL);
    }
};

export const turnOffProxy = () => {
    connectivity.endpointConnectivity.stop();
};
