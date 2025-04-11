/**
 * This file was automatically generated with protobufjs cli tool, see "pnpm compile-proto"
 */
/* eslint-disable */
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const WsPingMsg = $root.WsPingMsg = (() => {

    /**
     * Properties of a WsPingMsg.
     * @exports IWsPingMsg
     * @interface IWsPingMsg
     * @property {number|Long|null} [requestTime] WsPingMsg requestTime
     * @property {Uint8Array|null} [token] WsPingMsg token
     * @property {Uint8Array|null} [applicationId] WsPingMsg applicationId
     * @property {boolean|null} [ignoredHandshake] WsPingMsg ignoredHandshake
     */

    /**
     * Constructs a new WsPingMsg.
     * @exports WsPingMsg
     * @classdesc Represents a WsPingMsg.
     * @implements IWsPingMsg
     * @constructor
     * @param {IWsPingMsg=} [properties] Properties to set
     */
    function WsPingMsg(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * WsPingMsg requestTime.
     * @member {number|Long} requestTime
     * @memberof WsPingMsg
     * @instance
     */
    WsPingMsg.prototype.requestTime = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * WsPingMsg token.
     * @member {Uint8Array} token
     * @memberof WsPingMsg
     * @instance
     */
    WsPingMsg.prototype.token = $util.newBuffer([]);

    /**
     * WsPingMsg applicationId.
     * @member {Uint8Array} applicationId
     * @memberof WsPingMsg
     * @instance
     */
    WsPingMsg.prototype.applicationId = $util.newBuffer([]);

    /**
     * WsPingMsg ignoredHandshake.
     * @member {boolean} ignoredHandshake
     * @memberof WsPingMsg
     * @instance
     */
    WsPingMsg.prototype.ignoredHandshake = false;

    /**
     * Creates a new WsPingMsg instance using the specified properties.
     * @function create
     * @memberof WsPingMsg
     * @static
     * @param {IWsPingMsg=} [properties] Properties to set
     * @returns {WsPingMsg} WsPingMsg instance
     */
    WsPingMsg.create = function create(properties) {
        return new WsPingMsg(properties);
    };

    /**
     * Encodes the specified WsPingMsg message. Does not implicitly {@link WsPingMsg.verify|verify} messages.
     * @function encode
     * @memberof WsPingMsg
     * @static
     * @param {IWsPingMsg} message WsPingMsg message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    WsPingMsg.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.requestTime != null && message.hasOwnProperty("requestTime"))
            writer.uint32(/* id 1, wireType 0 =*/8).int64(message.requestTime);
        if (message.token != null && message.hasOwnProperty("token"))
            writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.token);
        if (message.applicationId != null && message.hasOwnProperty("applicationId"))
            writer.uint32(/* id 3, wireType 2 =*/26).bytes(message.applicationId);
        if (message.ignoredHandshake != null && message.hasOwnProperty("ignoredHandshake"))
            writer.uint32(/* id 4, wireType 0 =*/32).bool(message.ignoredHandshake);
        return writer;
    };

    /**
     * Encodes the specified WsPingMsg message, length delimited. Does not implicitly {@link WsPingMsg.verify|verify} messages.
     * @function encodeDelimited
     * @memberof WsPingMsg
     * @static
     * @param {IWsPingMsg} message WsPingMsg message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    WsPingMsg.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a WsPingMsg message from the specified reader or buffer.
     * @function decode
     * @memberof WsPingMsg
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {WsPingMsg} WsPingMsg
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    WsPingMsg.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.WsPingMsg();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.requestTime = reader.int64();
                break;
            case 2:
                message.token = reader.bytes();
                break;
            case 3:
                message.applicationId = reader.bytes();
                break;
            case 4:
                message.ignoredHandshake = reader.bool();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a WsPingMsg message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof WsPingMsg
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {WsPingMsg} WsPingMsg
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    WsPingMsg.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a WsPingMsg message.
     * @function verify
     * @memberof WsPingMsg
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    WsPingMsg.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.requestTime != null && message.hasOwnProperty("requestTime"))
            if (!$util.isInteger(message.requestTime) && !(message.requestTime && $util.isInteger(message.requestTime.low) && $util.isInteger(message.requestTime.high)))
                return "requestTime: integer|Long expected";
        if (message.token != null && message.hasOwnProperty("token"))
            if (!(message.token && typeof message.token.length === "number" || $util.isString(message.token)))
                return "token: buffer expected";
        if (message.applicationId != null && message.hasOwnProperty("applicationId"))
            if (!(message.applicationId && typeof message.applicationId.length === "number" || $util.isString(message.applicationId)))
                return "applicationId: buffer expected";
        if (message.ignoredHandshake != null && message.hasOwnProperty("ignoredHandshake"))
            if (typeof message.ignoredHandshake !== "boolean")
                return "ignoredHandshake: boolean expected";
        return null;
    };

    /**
     * Creates a WsPingMsg message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof WsPingMsg
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {WsPingMsg} WsPingMsg
     */
    WsPingMsg.fromObject = function fromObject(object) {
        if (object instanceof $root.WsPingMsg)
            return object;
        let message = new $root.WsPingMsg();
        if (object.requestTime != null)
            if ($util.Long)
                (message.requestTime = $util.Long.fromValue(object.requestTime)).unsigned = false;
            else if (typeof object.requestTime === "string")
                message.requestTime = parseInt(object.requestTime, 10);
            else if (typeof object.requestTime === "number")
                message.requestTime = object.requestTime;
            else if (typeof object.requestTime === "object")
                message.requestTime = new $util.LongBits(object.requestTime.low >>> 0, object.requestTime.high >>> 0).toNumber();
        if (object.token != null)
            if (typeof object.token === "string")
                $util.base64.decode(object.token, message.token = $util.newBuffer($util.base64.length(object.token)), 0);
            else if (object.token.length)
                message.token = object.token;
        if (object.applicationId != null)
            if (typeof object.applicationId === "string")
                $util.base64.decode(object.applicationId, message.applicationId = $util.newBuffer($util.base64.length(object.applicationId)), 0);
            else if (object.applicationId.length)
                message.applicationId = object.applicationId;
        if (object.ignoredHandshake != null)
            message.ignoredHandshake = Boolean(object.ignoredHandshake);
        return message;
    };

    /**
     * Creates a plain object from a WsPingMsg message. Also converts values to other types if specified.
     * @function toObject
     * @memberof WsPingMsg
     * @static
     * @param {WsPingMsg} message WsPingMsg
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    WsPingMsg.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.requestTime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.requestTime = options.longs === String ? "0" : 0;
            if (options.bytes === String)
                object.token = "";
            else {
                object.token = [];
                if (options.bytes !== Array)
                    object.token = $util.newBuffer(object.token);
            }
            if (options.bytes === String)
                object.applicationId = "";
            else {
                object.applicationId = [];
                if (options.bytes !== Array)
                    object.applicationId = $util.newBuffer(object.applicationId);
            }
            object.ignoredHandshake = false;
        }
        if (message.requestTime != null && message.hasOwnProperty("requestTime"))
            if (typeof message.requestTime === "number")
                object.requestTime = options.longs === String ? String(message.requestTime) : message.requestTime;
            else
                object.requestTime = options.longs === String ? $util.Long.prototype.toString.call(message.requestTime) : options.longs === Number ? new $util.LongBits(message.requestTime.low >>> 0, message.requestTime.high >>> 0).toNumber() : message.requestTime;
        if (message.token != null && message.hasOwnProperty("token"))
            object.token = options.bytes === String ? $util.base64.encode(message.token, 0, message.token.length) : options.bytes === Array ? Array.prototype.slice.call(message.token) : message.token;
        if (message.applicationId != null && message.hasOwnProperty("applicationId"))
            object.applicationId = options.bytes === String ? $util.base64.encode(message.applicationId, 0, message.applicationId.length) : options.bytes === Array ? Array.prototype.slice.call(message.applicationId) : message.applicationId;
        if (message.ignoredHandshake != null && message.hasOwnProperty("ignoredHandshake"))
            object.ignoredHandshake = message.ignoredHandshake;
        return object;
    };

    /**
     * Converts this WsPingMsg to JSON.
     * @function toJSON
     * @memberof WsPingMsg
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    WsPingMsg.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return WsPingMsg;
})();

export const WsConnectivityInfoMsg = $root.WsConnectivityInfoMsg = (() => {

    /**
     * Properties of a WsConnectivityInfoMsg.
     * @exports IWsConnectivityInfoMsg
     * @interface IWsConnectivityInfoMsg
     * @property {Uint8Array|null} [token] WsConnectivityInfoMsg token
     * @property {number|null} [mbytesDownloaded] WsConnectivityInfoMsg mbytesDownloaded
     * @property {number|null} [mbytesUploaded] WsConnectivityInfoMsg mbytesUploaded
     * @property {boolean|null} [refreshTokens] WsConnectivityInfoMsg refreshTokens
     * @property {number|null} [bytesDownloaded] WsConnectivityInfoMsg bytesDownloaded
     * @property {number|null} [bytesUploaded] WsConnectivityInfoMsg bytesUploaded
     */

    /**
     * Constructs a new WsConnectivityInfoMsg.
     * @exports WsConnectivityInfoMsg
     * @classdesc Represents a WsConnectivityInfoMsg.
     * @implements IWsConnectivityInfoMsg
     * @constructor
     * @param {IWsConnectivityInfoMsg=} [properties] Properties to set
     */
    function WsConnectivityInfoMsg(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * WsConnectivityInfoMsg token.
     * @member {Uint8Array} token
     * @memberof WsConnectivityInfoMsg
     * @instance
     */
    WsConnectivityInfoMsg.prototype.token = $util.newBuffer([]);

    /**
     * WsConnectivityInfoMsg mbytesDownloaded.
     * @member {number} mbytesDownloaded
     * @memberof WsConnectivityInfoMsg
     * @instance
     */
    WsConnectivityInfoMsg.prototype.mbytesDownloaded = 0;

    /**
     * WsConnectivityInfoMsg mbytesUploaded.
     * @member {number} mbytesUploaded
     * @memberof WsConnectivityInfoMsg
     * @instance
     */
    WsConnectivityInfoMsg.prototype.mbytesUploaded = 0;

    /**
     * WsConnectivityInfoMsg refreshTokens.
     * @member {boolean} refreshTokens
     * @memberof WsConnectivityInfoMsg
     * @instance
     */
    WsConnectivityInfoMsg.prototype.refreshTokens = false;

    /**
     * WsConnectivityInfoMsg bytesDownloaded.
     * @member {number} bytesDownloaded
     * @memberof WsConnectivityInfoMsg
     * @instance
     */
    WsConnectivityInfoMsg.prototype.bytesDownloaded = 0;

    /**
     * WsConnectivityInfoMsg bytesUploaded.
     * @member {number} bytesUploaded
     * @memberof WsConnectivityInfoMsg
     * @instance
     */
    WsConnectivityInfoMsg.prototype.bytesUploaded = 0;

    /**
     * Creates a new WsConnectivityInfoMsg instance using the specified properties.
     * @function create
     * @memberof WsConnectivityInfoMsg
     * @static
     * @param {IWsConnectivityInfoMsg=} [properties] Properties to set
     * @returns {WsConnectivityInfoMsg} WsConnectivityInfoMsg instance
     */
    WsConnectivityInfoMsg.create = function create(properties) {
        return new WsConnectivityInfoMsg(properties);
    };

    /**
     * Encodes the specified WsConnectivityInfoMsg message. Does not implicitly {@link WsConnectivityInfoMsg.verify|verify} messages.
     * @function encode
     * @memberof WsConnectivityInfoMsg
     * @static
     * @param {IWsConnectivityInfoMsg} message WsConnectivityInfoMsg message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    WsConnectivityInfoMsg.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.token != null && message.hasOwnProperty("token"))
            writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.token);
        if (message.mbytesDownloaded != null && message.hasOwnProperty("mbytesDownloaded"))
            writer.uint32(/* id 2, wireType 5 =*/21).float(message.mbytesDownloaded);
        if (message.mbytesUploaded != null && message.hasOwnProperty("mbytesUploaded"))
            writer.uint32(/* id 3, wireType 5 =*/29).float(message.mbytesUploaded);
        if (message.refreshTokens != null && message.hasOwnProperty("refreshTokens"))
            writer.uint32(/* id 6, wireType 0 =*/48).bool(message.refreshTokens);
        if (message.bytesDownloaded != null && message.hasOwnProperty("bytesDownloaded"))
            writer.uint32(/* id 7, wireType 5 =*/61).float(message.bytesDownloaded);
        if (message.bytesUploaded != null && message.hasOwnProperty("bytesUploaded"))
            writer.uint32(/* id 8, wireType 5 =*/69).float(message.bytesUploaded);
        return writer;
    };

    /**
     * Encodes the specified WsConnectivityInfoMsg message, length delimited. Does not implicitly {@link WsConnectivityInfoMsg.verify|verify} messages.
     * @function encodeDelimited
     * @memberof WsConnectivityInfoMsg
     * @static
     * @param {IWsConnectivityInfoMsg} message WsConnectivityInfoMsg message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    WsConnectivityInfoMsg.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a WsConnectivityInfoMsg message from the specified reader or buffer.
     * @function decode
     * @memberof WsConnectivityInfoMsg
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {WsConnectivityInfoMsg} WsConnectivityInfoMsg
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    WsConnectivityInfoMsg.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.WsConnectivityInfoMsg();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.token = reader.bytes();
                break;
            case 2:
                message.mbytesDownloaded = reader.float();
                break;
            case 3:
                message.mbytesUploaded = reader.float();
                break;
            case 6:
                message.refreshTokens = reader.bool();
                break;
            case 7:
                message.bytesDownloaded = reader.float();
                break;
            case 8:
                message.bytesUploaded = reader.float();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a WsConnectivityInfoMsg message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof WsConnectivityInfoMsg
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {WsConnectivityInfoMsg} WsConnectivityInfoMsg
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    WsConnectivityInfoMsg.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a WsConnectivityInfoMsg message.
     * @function verify
     * @memberof WsConnectivityInfoMsg
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    WsConnectivityInfoMsg.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.token != null && message.hasOwnProperty("token"))
            if (!(message.token && typeof message.token.length === "number" || $util.isString(message.token)))
                return "token: buffer expected";
        if (message.mbytesDownloaded != null && message.hasOwnProperty("mbytesDownloaded"))
            if (typeof message.mbytesDownloaded !== "number")
                return "mbytesDownloaded: number expected";
        if (message.mbytesUploaded != null && message.hasOwnProperty("mbytesUploaded"))
            if (typeof message.mbytesUploaded !== "number")
                return "mbytesUploaded: number expected";
        if (message.refreshTokens != null && message.hasOwnProperty("refreshTokens"))
            if (typeof message.refreshTokens !== "boolean")
                return "refreshTokens: boolean expected";
        if (message.bytesDownloaded != null && message.hasOwnProperty("bytesDownloaded"))
            if (typeof message.bytesDownloaded !== "number")
                return "bytesDownloaded: number expected";
        if (message.bytesUploaded != null && message.hasOwnProperty("bytesUploaded"))
            if (typeof message.bytesUploaded !== "number")
                return "bytesUploaded: number expected";
        return null;
    };

    /**
     * Creates a WsConnectivityInfoMsg message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof WsConnectivityInfoMsg
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {WsConnectivityInfoMsg} WsConnectivityInfoMsg
     */
    WsConnectivityInfoMsg.fromObject = function fromObject(object) {
        if (object instanceof $root.WsConnectivityInfoMsg)
            return object;
        let message = new $root.WsConnectivityInfoMsg();
        if (object.token != null)
            if (typeof object.token === "string")
                $util.base64.decode(object.token, message.token = $util.newBuffer($util.base64.length(object.token)), 0);
            else if (object.token.length)
                message.token = object.token;
        if (object.mbytesDownloaded != null)
            message.mbytesDownloaded = Number(object.mbytesDownloaded);
        if (object.mbytesUploaded != null)
            message.mbytesUploaded = Number(object.mbytesUploaded);
        if (object.refreshTokens != null)
            message.refreshTokens = Boolean(object.refreshTokens);
        if (object.bytesDownloaded != null)
            message.bytesDownloaded = Number(object.bytesDownloaded);
        if (object.bytesUploaded != null)
            message.bytesUploaded = Number(object.bytesUploaded);
        return message;
    };

    /**
     * Creates a plain object from a WsConnectivityInfoMsg message. Also converts values to other types if specified.
     * @function toObject
     * @memberof WsConnectivityInfoMsg
     * @static
     * @param {WsConnectivityInfoMsg} message WsConnectivityInfoMsg
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    WsConnectivityInfoMsg.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            if (options.bytes === String)
                object.token = "";
            else {
                object.token = [];
                if (options.bytes !== Array)
                    object.token = $util.newBuffer(object.token);
            }
            object.mbytesDownloaded = 0;
            object.mbytesUploaded = 0;
            object.refreshTokens = false;
            object.bytesDownloaded = 0;
            object.bytesUploaded = 0;
        }
        if (message.token != null && message.hasOwnProperty("token"))
            object.token = options.bytes === String ? $util.base64.encode(message.token, 0, message.token.length) : options.bytes === Array ? Array.prototype.slice.call(message.token) : message.token;
        if (message.mbytesDownloaded != null && message.hasOwnProperty("mbytesDownloaded"))
            object.mbytesDownloaded = options.json && !isFinite(message.mbytesDownloaded) ? String(message.mbytesDownloaded) : message.mbytesDownloaded;
        if (message.mbytesUploaded != null && message.hasOwnProperty("mbytesUploaded"))
            object.mbytesUploaded = options.json && !isFinite(message.mbytesUploaded) ? String(message.mbytesUploaded) : message.mbytesUploaded;
        if (message.refreshTokens != null && message.hasOwnProperty("refreshTokens"))
            object.refreshTokens = message.refreshTokens;
        if (message.bytesDownloaded != null && message.hasOwnProperty("bytesDownloaded"))
            object.bytesDownloaded = options.json && !isFinite(message.bytesDownloaded) ? String(message.bytesDownloaded) : message.bytesDownloaded;
        if (message.bytesUploaded != null && message.hasOwnProperty("bytesUploaded"))
            object.bytesUploaded = options.json && !isFinite(message.bytesUploaded) ? String(message.bytesUploaded) : message.bytesUploaded;
        return object;
    };

    /**
     * Converts this WsConnectivityInfoMsg to JSON.
     * @function toJSON
     * @memberof WsConnectivityInfoMsg
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    WsConnectivityInfoMsg.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return WsConnectivityInfoMsg;
})();

export const WsConnectivityErrorMsg = $root.WsConnectivityErrorMsg = (() => {

    /**
     * Properties of a WsConnectivityErrorMsg.
     * @exports IWsConnectivityErrorMsg
     * @interface IWsConnectivityErrorMsg
     * @property {string|null} [code] WsConnectivityErrorMsg code
     * @property {string|null} [payload] WsConnectivityErrorMsg payload
     */

    /**
     * Constructs a new WsConnectivityErrorMsg.
     * @exports WsConnectivityErrorMsg
     * @classdesc Represents a WsConnectivityErrorMsg.
     * @implements IWsConnectivityErrorMsg
     * @constructor
     * @param {IWsConnectivityErrorMsg=} [properties] Properties to set
     */
    function WsConnectivityErrorMsg(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * WsConnectivityErrorMsg code.
     * @member {string} code
     * @memberof WsConnectivityErrorMsg
     * @instance
     */
    WsConnectivityErrorMsg.prototype.code = "";

    /**
     * WsConnectivityErrorMsg payload.
     * @member {string} payload
     * @memberof WsConnectivityErrorMsg
     * @instance
     */
    WsConnectivityErrorMsg.prototype.payload = "";

    /**
     * Creates a new WsConnectivityErrorMsg instance using the specified properties.
     * @function create
     * @memberof WsConnectivityErrorMsg
     * @static
     * @param {IWsConnectivityErrorMsg=} [properties] Properties to set
     * @returns {WsConnectivityErrorMsg} WsConnectivityErrorMsg instance
     */
    WsConnectivityErrorMsg.create = function create(properties) {
        return new WsConnectivityErrorMsg(properties);
    };

    /**
     * Encodes the specified WsConnectivityErrorMsg message. Does not implicitly {@link WsConnectivityErrorMsg.verify|verify} messages.
     * @function encode
     * @memberof WsConnectivityErrorMsg
     * @static
     * @param {IWsConnectivityErrorMsg} message WsConnectivityErrorMsg message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    WsConnectivityErrorMsg.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.code != null && message.hasOwnProperty("code"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.code);
        if (message.payload != null && message.hasOwnProperty("payload"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.payload);
        return writer;
    };

    /**
     * Encodes the specified WsConnectivityErrorMsg message, length delimited. Does not implicitly {@link WsConnectivityErrorMsg.verify|verify} messages.
     * @function encodeDelimited
     * @memberof WsConnectivityErrorMsg
     * @static
     * @param {IWsConnectivityErrorMsg} message WsConnectivityErrorMsg message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    WsConnectivityErrorMsg.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a WsConnectivityErrorMsg message from the specified reader or buffer.
     * @function decode
     * @memberof WsConnectivityErrorMsg
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {WsConnectivityErrorMsg} WsConnectivityErrorMsg
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    WsConnectivityErrorMsg.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.WsConnectivityErrorMsg();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.code = reader.string();
                break;
            case 2:
                message.payload = reader.string();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a WsConnectivityErrorMsg message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof WsConnectivityErrorMsg
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {WsConnectivityErrorMsg} WsConnectivityErrorMsg
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    WsConnectivityErrorMsg.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a WsConnectivityErrorMsg message.
     * @function verify
     * @memberof WsConnectivityErrorMsg
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    WsConnectivityErrorMsg.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.code != null && message.hasOwnProperty("code"))
            if (!$util.isString(message.code))
                return "code: string expected";
        if (message.payload != null && message.hasOwnProperty("payload"))
            if (!$util.isString(message.payload))
                return "payload: string expected";
        return null;
    };

    /**
     * Creates a WsConnectivityErrorMsg message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof WsConnectivityErrorMsg
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {WsConnectivityErrorMsg} WsConnectivityErrorMsg
     */
    WsConnectivityErrorMsg.fromObject = function fromObject(object) {
        if (object instanceof $root.WsConnectivityErrorMsg)
            return object;
        let message = new $root.WsConnectivityErrorMsg();
        if (object.code != null)
            message.code = String(object.code);
        if (object.payload != null)
            message.payload = String(object.payload);
        return message;
    };

    /**
     * Creates a plain object from a WsConnectivityErrorMsg message. Also converts values to other types if specified.
     * @function toObject
     * @memberof WsConnectivityErrorMsg
     * @static
     * @param {WsConnectivityErrorMsg} message WsConnectivityErrorMsg
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    WsConnectivityErrorMsg.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.code = "";
            object.payload = "";
        }
        if (message.code != null && message.hasOwnProperty("code"))
            object.code = message.code;
        if (message.payload != null && message.hasOwnProperty("payload"))
            object.payload = message.payload;
        return object;
    };

    /**
     * Converts this WsConnectivityErrorMsg to JSON.
     * @function toJSON
     * @memberof WsConnectivityErrorMsg
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    WsConnectivityErrorMsg.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return WsConnectivityErrorMsg;
})();

export const WsSettingsMsg = $root.WsSettingsMsg = (() => {

    /**
     * Properties of a WsSettingsMsg.
     * @exports IWsSettingsMsg
     * @interface IWsSettingsMsg
     * @property {string|null} [dnsServer] WsSettingsMsg dnsServer
     */

    /**
     * Constructs a new WsSettingsMsg.
     * @exports WsSettingsMsg
     * @classdesc Represents a WsSettingsMsg.
     * @implements IWsSettingsMsg
     * @constructor
     * @param {IWsSettingsMsg=} [properties] Properties to set
     */
    function WsSettingsMsg(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * WsSettingsMsg dnsServer.
     * @member {string} dnsServer
     * @memberof WsSettingsMsg
     * @instance
     */
    WsSettingsMsg.prototype.dnsServer = "";

    /**
     * Creates a new WsSettingsMsg instance using the specified properties.
     * @function create
     * @memberof WsSettingsMsg
     * @static
     * @param {IWsSettingsMsg=} [properties] Properties to set
     * @returns {WsSettingsMsg} WsSettingsMsg instance
     */
    WsSettingsMsg.create = function create(properties) {
        return new WsSettingsMsg(properties);
    };

    /**
     * Encodes the specified WsSettingsMsg message. Does not implicitly {@link WsSettingsMsg.verify|verify} messages.
     * @function encode
     * @memberof WsSettingsMsg
     * @static
     * @param {IWsSettingsMsg} message WsSettingsMsg message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    WsSettingsMsg.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.dnsServer != null && message.hasOwnProperty("dnsServer"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.dnsServer);
        return writer;
    };

    /**
     * Encodes the specified WsSettingsMsg message, length delimited. Does not implicitly {@link WsSettingsMsg.verify|verify} messages.
     * @function encodeDelimited
     * @memberof WsSettingsMsg
     * @static
     * @param {IWsSettingsMsg} message WsSettingsMsg message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    WsSettingsMsg.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a WsSettingsMsg message from the specified reader or buffer.
     * @function decode
     * @memberof WsSettingsMsg
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {WsSettingsMsg} WsSettingsMsg
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    WsSettingsMsg.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.WsSettingsMsg();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.dnsServer = reader.string();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a WsSettingsMsg message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof WsSettingsMsg
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {WsSettingsMsg} WsSettingsMsg
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    WsSettingsMsg.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a WsSettingsMsg message.
     * @function verify
     * @memberof WsSettingsMsg
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    WsSettingsMsg.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.dnsServer != null && message.hasOwnProperty("dnsServer"))
            if (!$util.isString(message.dnsServer))
                return "dnsServer: string expected";
        return null;
    };

    /**
     * Creates a WsSettingsMsg message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof WsSettingsMsg
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {WsSettingsMsg} WsSettingsMsg
     */
    WsSettingsMsg.fromObject = function fromObject(object) {
        if (object instanceof $root.WsSettingsMsg)
            return object;
        let message = new $root.WsSettingsMsg();
        if (object.dnsServer != null)
            message.dnsServer = String(object.dnsServer);
        return message;
    };

    /**
     * Creates a plain object from a WsSettingsMsg message. Also converts values to other types if specified.
     * @function toObject
     * @memberof WsSettingsMsg
     * @static
     * @param {WsSettingsMsg} message WsSettingsMsg
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    WsSettingsMsg.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults)
            object.dnsServer = "";
        if (message.dnsServer != null && message.hasOwnProperty("dnsServer"))
            object.dnsServer = message.dnsServer;
        return object;
    };

    /**
     * Converts this WsSettingsMsg to JSON.
     * @function toJSON
     * @memberof WsSettingsMsg
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    WsSettingsMsg.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return WsSettingsMsg;
})();

export const WsConnectivityMsg = $root.WsConnectivityMsg = (() => {

    /**
     * Properties of a WsConnectivityMsg.
     * @exports IWsConnectivityMsg
     * @interface IWsConnectivityMsg
     * @property {IWsPingMsg|null} [pingMsg] WsConnectivityMsg pingMsg
     * @property {IWsConnectivityInfoMsg|null} [connectivityInfoMsg] WsConnectivityMsg connectivityInfoMsg
     * @property {IWsConnectivityErrorMsg|null} [connectivityErrorMsg] WsConnectivityMsg connectivityErrorMsg
     * @property {IWsSettingsMsg|null} [settingsMsg] WsConnectivityMsg settingsMsg
     */

    /**
     * Constructs a new WsConnectivityMsg.
     * @exports WsConnectivityMsg
     * @classdesc Represents a WsConnectivityMsg.
     * @implements IWsConnectivityMsg
     * @constructor
     * @param {IWsConnectivityMsg=} [properties] Properties to set
     */
    function WsConnectivityMsg(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * WsConnectivityMsg pingMsg.
     * @member {IWsPingMsg|null|undefined} pingMsg
     * @memberof WsConnectivityMsg
     * @instance
     */
    WsConnectivityMsg.prototype.pingMsg = null;

    /**
     * WsConnectivityMsg connectivityInfoMsg.
     * @member {IWsConnectivityInfoMsg|null|undefined} connectivityInfoMsg
     * @memberof WsConnectivityMsg
     * @instance
     */
    WsConnectivityMsg.prototype.connectivityInfoMsg = null;

    /**
     * WsConnectivityMsg connectivityErrorMsg.
     * @member {IWsConnectivityErrorMsg|null|undefined} connectivityErrorMsg
     * @memberof WsConnectivityMsg
     * @instance
     */
    WsConnectivityMsg.prototype.connectivityErrorMsg = null;

    /**
     * WsConnectivityMsg settingsMsg.
     * @member {IWsSettingsMsg|null|undefined} settingsMsg
     * @memberof WsConnectivityMsg
     * @instance
     */
    WsConnectivityMsg.prototype.settingsMsg = null;

    // OneOf field names bound to virtual getters and setters
    let $oneOfFields;

    /**
     * WsConnectivityMsg payload.
     * @member {"pingMsg"|"connectivityInfoMsg"|"connectivityErrorMsg"|"settingsMsg"|undefined} payload
     * @memberof WsConnectivityMsg
     * @instance
     */
    Object.defineProperty(WsConnectivityMsg.prototype, "payload", {
        get: $util.oneOfGetter($oneOfFields = ["pingMsg", "connectivityInfoMsg", "connectivityErrorMsg", "settingsMsg"]),
        set: $util.oneOfSetter($oneOfFields)
    });

    /**
     * Creates a new WsConnectivityMsg instance using the specified properties.
     * @function create
     * @memberof WsConnectivityMsg
     * @static
     * @param {IWsConnectivityMsg=} [properties] Properties to set
     * @returns {WsConnectivityMsg} WsConnectivityMsg instance
     */
    WsConnectivityMsg.create = function create(properties) {
        return new WsConnectivityMsg(properties);
    };

    /**
     * Encodes the specified WsConnectivityMsg message. Does not implicitly {@link WsConnectivityMsg.verify|verify} messages.
     * @function encode
     * @memberof WsConnectivityMsg
     * @static
     * @param {IWsConnectivityMsg} message WsConnectivityMsg message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    WsConnectivityMsg.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.pingMsg != null && message.hasOwnProperty("pingMsg"))
            $root.WsPingMsg.encode(message.pingMsg, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        if (message.connectivityInfoMsg != null && message.hasOwnProperty("connectivityInfoMsg"))
            $root.WsConnectivityInfoMsg.encode(message.connectivityInfoMsg, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
        if (message.connectivityErrorMsg != null && message.hasOwnProperty("connectivityErrorMsg"))
            $root.WsConnectivityErrorMsg.encode(message.connectivityErrorMsg, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
        if (message.settingsMsg != null && message.hasOwnProperty("settingsMsg"))
            $root.WsSettingsMsg.encode(message.settingsMsg, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified WsConnectivityMsg message, length delimited. Does not implicitly {@link WsConnectivityMsg.verify|verify} messages.
     * @function encodeDelimited
     * @memberof WsConnectivityMsg
     * @static
     * @param {IWsConnectivityMsg} message WsConnectivityMsg message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    WsConnectivityMsg.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a WsConnectivityMsg message from the specified reader or buffer.
     * @function decode
     * @memberof WsConnectivityMsg
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {WsConnectivityMsg} WsConnectivityMsg
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    WsConnectivityMsg.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.WsConnectivityMsg();
        while (reader.pos < end) {
            let tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.pingMsg = $root.WsPingMsg.decode(reader, reader.uint32());
                break;
            case 2:
                message.connectivityInfoMsg = $root.WsConnectivityInfoMsg.decode(reader, reader.uint32());
                break;
            case 3:
                message.connectivityErrorMsg = $root.WsConnectivityErrorMsg.decode(reader, reader.uint32());
                break;
            case 4:
                message.settingsMsg = $root.WsSettingsMsg.decode(reader, reader.uint32());
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a WsConnectivityMsg message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof WsConnectivityMsg
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {WsConnectivityMsg} WsConnectivityMsg
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    WsConnectivityMsg.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a WsConnectivityMsg message.
     * @function verify
     * @memberof WsConnectivityMsg
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    WsConnectivityMsg.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        let properties = {};
        if (message.pingMsg != null && message.hasOwnProperty("pingMsg")) {
            properties.payload = 1;
            {
                let error = $root.WsPingMsg.verify(message.pingMsg);
                if (error)
                    return "pingMsg." + error;
            }
        }
        if (message.connectivityInfoMsg != null && message.hasOwnProperty("connectivityInfoMsg")) {
            if (properties.payload === 1)
                return "payload: multiple values";
            properties.payload = 1;
            {
                let error = $root.WsConnectivityInfoMsg.verify(message.connectivityInfoMsg);
                if (error)
                    return "connectivityInfoMsg." + error;
            }
        }
        if (message.connectivityErrorMsg != null && message.hasOwnProperty("connectivityErrorMsg")) {
            if (properties.payload === 1)
                return "payload: multiple values";
            properties.payload = 1;
            {
                let error = $root.WsConnectivityErrorMsg.verify(message.connectivityErrorMsg);
                if (error)
                    return "connectivityErrorMsg." + error;
            }
        }
        if (message.settingsMsg != null && message.hasOwnProperty("settingsMsg")) {
            if (properties.payload === 1)
                return "payload: multiple values";
            properties.payload = 1;
            {
                let error = $root.WsSettingsMsg.verify(message.settingsMsg);
                if (error)
                    return "settingsMsg." + error;
            }
        }
        return null;
    };

    /**
     * Creates a WsConnectivityMsg message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof WsConnectivityMsg
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {WsConnectivityMsg} WsConnectivityMsg
     */
    WsConnectivityMsg.fromObject = function fromObject(object) {
        if (object instanceof $root.WsConnectivityMsg)
            return object;
        let message = new $root.WsConnectivityMsg();
        if (object.pingMsg != null) {
            if (typeof object.pingMsg !== "object")
                throw TypeError(".WsConnectivityMsg.pingMsg: object expected");
            message.pingMsg = $root.WsPingMsg.fromObject(object.pingMsg);
        }
        if (object.connectivityInfoMsg != null) {
            if (typeof object.connectivityInfoMsg !== "object")
                throw TypeError(".WsConnectivityMsg.connectivityInfoMsg: object expected");
            message.connectivityInfoMsg = $root.WsConnectivityInfoMsg.fromObject(object.connectivityInfoMsg);
        }
        if (object.connectivityErrorMsg != null) {
            if (typeof object.connectivityErrorMsg !== "object")
                throw TypeError(".WsConnectivityMsg.connectivityErrorMsg: object expected");
            message.connectivityErrorMsg = $root.WsConnectivityErrorMsg.fromObject(object.connectivityErrorMsg);
        }
        if (object.settingsMsg != null) {
            if (typeof object.settingsMsg !== "object")
                throw TypeError(".WsConnectivityMsg.settingsMsg: object expected");
            message.settingsMsg = $root.WsSettingsMsg.fromObject(object.settingsMsg);
        }
        return message;
    };

    /**
     * Creates a plain object from a WsConnectivityMsg message. Also converts values to other types if specified.
     * @function toObject
     * @memberof WsConnectivityMsg
     * @static
     * @param {WsConnectivityMsg} message WsConnectivityMsg
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    WsConnectivityMsg.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (message.pingMsg != null && message.hasOwnProperty("pingMsg")) {
            object.pingMsg = $root.WsPingMsg.toObject(message.pingMsg, options);
            if (options.oneofs)
                object.payload = "pingMsg";
        }
        if (message.connectivityInfoMsg != null && message.hasOwnProperty("connectivityInfoMsg")) {
            object.connectivityInfoMsg = $root.WsConnectivityInfoMsg.toObject(message.connectivityInfoMsg, options);
            if (options.oneofs)
                object.payload = "connectivityInfoMsg";
        }
        if (message.connectivityErrorMsg != null && message.hasOwnProperty("connectivityErrorMsg")) {
            object.connectivityErrorMsg = $root.WsConnectivityErrorMsg.toObject(message.connectivityErrorMsg, options);
            if (options.oneofs)
                object.payload = "connectivityErrorMsg";
        }
        if (message.settingsMsg != null && message.hasOwnProperty("settingsMsg")) {
            object.settingsMsg = $root.WsSettingsMsg.toObject(message.settingsMsg, options);
            if (options.oneofs)
                object.payload = "settingsMsg";
        }
        return object;
    };

    /**
     * Converts this WsConnectivityMsg to JSON.
     * @function toJSON
     * @memberof WsConnectivityMsg
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    WsConnectivityMsg.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return WsConnectivityMsg;
})();

export { $root as default };
