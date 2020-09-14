import authApi from '../api/authApi';
import translator from '../../lib/translator/translator';

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
        '2fa_required': translator.translate('authentication_error_2fa_required'),
        '2fa_invalid': translator.translate('authentication_error_2fa_invalid'),
        account_disabled: translator.translate('authentication_error_account_disabled'),
        account_locked: translator.translate('authentication_error_account_locked'),
        bad_credentials: translator.translate('authentication_error_wrong_credentials'),
        default: translator.translate('authentication_error_default'),
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
        'validation.not_empty': translator.translate('registration_error_not_empty'),
        'validation.not_valid': translator.translate('registration_error_not_valid'),
        'validation.min_length': translator.translate('registration_error_min_length'),
        'validation.compromised.password': translator.translate('registration_error_compromised_password', {
            a: (chunks) => (`<a href="https://adguard-vpn.com/forward.html?action=haveibeenpwned&from=popup&app=vpn_extension" target="_blank" class="link">${chunks}</a>`),
        }),
        'validation.unique_constraint': translator.translate('registration_error_unique_constraint'),
        default: translator.translate('registration_error_default'),
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

const userLookup = async (email, appId) => {
    const { can_register: canRegister } = await authApi.userLookup(email, appId);
    return { canRegister };
};

export default {
    getAccessToken,
    register,
    userLookup,
};
