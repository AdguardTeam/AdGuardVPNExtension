import EndpointsPingService from './EndpointsPingService';
import credentials from '../../credentials';
import websocketFactory from '../websocket/websocketFactory';

const endpointsPing = new EndpointsPingService(credentials, websocketFactory);

export default endpointsPing;
