// stats.proto would be converted to js object by webpack
// https://github.com/protobufjs/protobuf.js#using-generated-static-code
// see webpack proto-loader https://github.com/PermissionData/protobufjs-loader
import { PingMsg, ProtocolMsg } from './stats.proto';

// this code is an prove of evidence that work with proto is possible
const currentTime = Date.now();
const pingMsg = PingMsg.create({ requestTime: currentTime });
const protocolMsg = ProtocolMsg.create({ pingMsg });
const buffer = ProtocolMsg.encode(protocolMsg).finish();

const connectToStats = () => {
    // Create WebSocket connection.
    const socket = new WebSocket('ws://192.168.11.191:8182/user_metrics');

    socket.binaryType = 'arraybuffer';

    // Connection opened
    socket.addEventListener('open', (event) => {
        socket.send(buffer);
    });

    // Listen for messages
    socket.addEventListener('message', (event) => {
        const message = ProtocolMsg.decode(new Uint8Array(event.data));
        const messageObj = ProtocolMsg.toObject(message);
        const { pingMsg: { requestTime } } = messageObj;
        const receivedTime = Date.now();
        console.log(receivedTime - requestTime);
    });
};

export default connectToStats;
