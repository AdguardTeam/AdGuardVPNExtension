import { authApi } from '../api';
import { translator } from '../../common/translator';
import { FORWARDER_DOMAIN } from '../config';
import type { AuthCredentials } from '../api/apiTypes';
import type { AuthAccessToken } from '../schema';

interface RemoteAccessTokenInterface {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
}

type ErrorsMap = {
    [key: string]: string;
};

const accessTokenModel = {
    fromRemoteToLocal: (remoteAccessToken: RemoteAccessTokenInterface): AuthAccessToken => {
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

const getAccessToken = async (credentials: AuthCredentials): Promise<AuthAccessToken> => {
    const TOO_MANY_REQUESTS_CODE = 429;
    let accessTokenData;

    const errorsMap: ErrorsMap = {
        '2fa_required': translator.getMessage('authentication_error_2fa_required'),
        '2fa_invalid': translator.getMessage('authentication_error_2fa_invalid'),
        account_disabled: translator.getMessage('authentication_error_account_disabled'),
        account_locked: translator.getMessage('authentication_error_account_locked'),
        bad_credentials: translator.getMessage('authentication_error_wrong_credentials'),
        [TOO_MANY_REQUESTS_CODE]: translator.getMessage('authentication_too_many_requests'),
        default: translator.getMessage('authentication_error_default'),
    };

    try {
        accessTokenData = await authApi.getAccessToken(credentials);
    } catch (e) {
        const errorStatusCode = e.status;
        let errorMessage;

        try {
            errorMessage = JSON.parse(e.message);
        } catch (e) {
            // if was unable to parse error message, e.g. network is disabled
            throw new Error(JSON.stringify({ error: errorsMap.default }));
        }

        const { error_code: errorCode }: { error_code: keyof typeof errorsMap } = errorMessage;

        if (errorCode === '2fa_required') {
            throw new Error(JSON.stringify({ status: errorCode }));
        }

        const error = errorsMap[errorCode] || errorsMap[errorStatusCode] || errorsMap.default;

        throw new Error(JSON.stringify({ error }));
    }

    return accessTokenModel.fromRemoteToLocal(accessTokenData);
};

const register = async (credentials: AuthCredentials) => {
    const fieldsMap = {
        email: 'username',
    };

    const errorsMap = {
        'validation.not_empty': translator.getMessage('registration_error_not_empty'),
        'validation.not_valid': translator.getMessage('registration_error_not_valid'),
        'validation.min_length': translator.getMessage('registration_error_min_length'),
        'validation.compromised.password': translator.getMessage('registration_error_compromised_password', {
            a: (chunks: string[]) => (`<a href="https://${FORWARDER_DOMAIN}/forward.html?action=haveibeenpwned&from=popup&app=vpn_extension" target="_blank" class="link">${chunks}</a>`),
        }),
        'validation.unique_constraint': translator.getMessage('registration_error_unique_constraint'),
        default: translator.getMessage('registration_error_default'),
    };

    let accessTokenData;
    try {
        accessTokenData = await authApi.register(credentials);
    } catch (e) {
        let errorMessage;
        try {
            errorMessage = JSON.parse(e.message);
        } catch (e) {
            // if was unable to parse error message, e.g. network is disabled
            throw new Error(JSON.stringify({ error: errorsMap.default }));
        }

        const {
            error_code: errorCode,
            field,
        }: {
            error_code: keyof typeof errorsMap,
            field: keyof typeof fieldsMap
        } = errorMessage;

        const extensionField = fieldsMap[field] || field;
        const error = errorsMap[errorCode] || errorsMap.default;
        throw new Error(JSON.stringify({ error, field: extensionField }));
    }

    return accessTokenModel.fromRemoteToLocal(accessTokenData);
};

const userLookup = async (email: string, appId: string) => {
    const { can_register: canRegister } = await authApi.userLookup(email, appId);
    return { canRegister };
};

export const authProvider = {
    getAccessToken,
    register,
    userLookup,
};
