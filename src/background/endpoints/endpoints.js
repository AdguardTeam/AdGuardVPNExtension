import EndpointsService from './EndpointsService';
import browserApi from '../browserApi';
import { proxy } from '../proxy';
import credentials from '../credentials';
import connectivity from '../connectivity';
import vpnProvider from '../providers/vpnProvider';

const endpoints = new EndpointsService(
    browserApi,
    proxy,
    credentials,
    connectivity,
    vpnProvider
);

export default endpoints;
