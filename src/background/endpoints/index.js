import EndpointsService from './EndpointsService';
import browserApi from '../browserApi';
import proxy from '../proxy';
import vpnProvider from '../providers/vpnProvider';
import connectivity from '../connectivity';
import credentials from '../credentials';

const endpoints = new EndpointsService({
    browserApi,
    connectivity,
    credentials,
    proxy,
    vpnProvider,
});

export default endpoints;
