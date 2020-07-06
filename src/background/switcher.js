import proxy from './proxy';
import credentials from './credentials';
import { locationsService } from './endpoints/locationsService';
import connectivity from './connectivity';
import { connectivityService } from './connectivity/connectivityService/connectivityFSM';
import { EVENT } from './connectivity/connectivityService/connectivityConstants';

export const turnOnProxy = async () => {
    console.log('turnOnProxy');
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
        console.log(e.message);
        connectivityService.send(EVENT.CONNECTION_FAIL);
    }
};

export const turnOffProxy = () => {
    connectivity.endpointConnectivity.stop();
};
