import EndpointsPing from './EndpointsPing';
import websocketFactory from '../websocket/websocketFactory';
import credentials from '../../credentials';

const endpointsPing = new EndpointsPing({
    credentials,
    websocketFactory,
});

export default endpointsPing;
