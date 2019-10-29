import browser from 'webextension-polyfill';
import authApi from '../api/authApi';

const accessTokenModel = {
    fromRemoteToLocal: (remoteAccessToken) => {
        const {
            access_token: accessToken,
            expires_in: expiresIn,
            scope,
            token_type: tokenType,
        } = remoteAccessToken;

        return {
            accessToken,
            expiresIn,
            scope,
            tokenType,
        };
    },
};

const getAccessToken = async (credentials) => {
    let accessTokenData;

    const errorsMap = {
        '2fa_required': browser.i18n.getMessage('authentication_error_2fa_required'),
        '2fa_invalid': browser.i18n.getMessage('authentication_error_2fa_invalid'),
        account_disabled: browser.i18n.getMessage('authentication_error_account_disabled'),
        account_locked: browser.i18n.getMessage('authentication_error_account_locked'),
        bad_credentials: browser.i18n.getMessage('authentication_error_bad_credentials'),
        default: browser.i18n.getMessage('authentication_error_default'),
    };

    try {
        accessTokenData = await authApi.getAccessToken(credentials);
    } catch (e) {
        const {
            error_code: errorCode,
        } = JSON.parse(e.message);

        if (errorCode === '2fa_required') {
            throw new Error(JSON.stringify({ status: errorCode }));
        }

        const error = errorsMap[errorCode] || errorsMap.default;

        throw new Error(JSON.stringify({ error }));
    }

    return accessTokenModel.fromRemoteToLocal(accessTokenData);
};

const register = async (credentials) => {
    const fieldsMap = {
        email: 'username',
    };

    const errorsMap = {
        'validation.not_empty': browser.i18n.getMessage('registration_error_not_empty'),
        'validation.not_valid': browser.i18n.getMessage('registration_error_not_valid'),
        'validation.min_length': browser.i18n.getMessage('registration_error_min_length'),
        'validation.compromised.password': browser.i18n.getMessage('registration_error_compromised_password'),
        'validation.unique_constraint': browser.i18n.getMessage('registration_error_unique_constraint'),
        default: browser.i18n.getMessage('registration_error_default'),
    };

    let accessTokenData;
    try {
        accessTokenData = await authApi.register(credentials);
    } catch (e) {
        const {
            error_code: errorCode,
            field,
        } = JSON.parse(e.message);

        const extensionField = fieldsMap[field] || field;
        const error = errorsMap[errorCode] || errorsMap.default;
        throw new Error(JSON.stringify({ error, field: extensionField }));
    }

    return accessTokenModel.fromRemoteToLocal(accessTokenData);
};

export default {
    getAccessToken,
    register,
};
