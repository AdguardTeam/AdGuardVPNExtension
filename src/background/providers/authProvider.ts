import {
    BAD_CREDENTIALS_CODE,
    REQUIRED_2FA_CODE,
    REQUIRED_EMAIL_CONFIRMATION_CODE,
} from '../../common/constants';
import { getForwarderUrl } from '../../common/helpers';
import { authApi } from '../api';
import { forwarder } from '../forwarder';
import { translator } from '../../common/translator';
import { FORWARDER_URL_QUERIES } from '../config';
import { SUPPORT_EMAIL } from '../constants';
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

/**
 * Uses {@link authApi} to request access token.
 *
 * @param credentials Credentials for authentication.
 *
 * @returns Auth access token data.
 * @throws Error if could not get access token.
 */
const getAccessToken = async (credentials: AuthCredentials): Promise<AuthAccessToken> => {
    const TOO_MANY_REQUESTS_CODE = 429;
    const INVALID_EMAIL_CONFIRMATION_CODE = 'confirmation_code_invalid';
    let accessTokenData;

    const errorsMap: ErrorsMap = {
        [REQUIRED_2FA_CODE]: translator.getMessage('authentication_error_2fa_required'),
        '2fa_invalid': translator.getMessage('authentication_error_2fa_invalid'),
        account_disabled: translator.getMessage('authentication_error_account_disabled'),
        account_locked: translator.getMessage('authentication_error_account_locked'),
        [BAD_CREDENTIALS_CODE]: translator.getMessage('authentication_error_wrong_credentials'),
        [TOO_MANY_REQUESTS_CODE]: translator.getMessage('authentication_too_many_requests'),
        // the value is not shown to users, so it is not translated
        [REQUIRED_EMAIL_CONFIRMATION_CODE]: REQUIRED_EMAIL_CONFIRMATION_CODE,
        [INVALID_EMAIL_CONFIRMATION_CODE]: translator.getMessage('confirm_email_code_invalid'),
        default: translator.getMessage('authentication_error_default'),
    };

    try {
        accessTokenData = await authApi.getAccessToken(credentials);
    } catch (e) {
        const errorStatusCode = e.status;
        let errorData;

        try {
            errorData = JSON.parse(e.message);
        } catch (e) {
            // if was unable to parse error message, e.g. network is disabled
            throw new Error(JSON.stringify({ error: errorsMap.default }));
        }

        const { error_code: errorCode, auth_id: authId }: {
            error_code: keyof typeof errorsMap,
            auth_id: string,
        } = errorData;

        if (errorCode === REQUIRED_EMAIL_CONFIRMATION_CODE) {
            // authId is required to request another code
            // so error should be shown in the popup if there is no authId
            if (!authId) {
                const error = translator.getMessage('confirm_email_no_auth_id_error_on_auth', {
                    support_email: SUPPORT_EMAIL,
                    a: (chunks: string) => `<a href="mailto:${SUPPORT_EMAIL}" target="_blank">${chunks}</a>`,
                });
                throw new Error(JSON.stringify({ status: errorCode, error }));
            }

            throw new Error(JSON.stringify({ status: errorCode, authId }));
        }

        if (errorCode === REQUIRED_2FA_CODE) {
            throw new Error(JSON.stringify({ status: errorCode }));
        }

        const error = errorsMap[errorCode] || errorsMap[errorStatusCode] || errorsMap.default;

        throw new Error(JSON.stringify({ error, status: errorCode }));
    }

    return accessTokenModel.fromRemoteToLocal(accessTokenData);
};

const register = async (credentials: AuthCredentials) => {
    const fieldsMap = {
        email: 'username',
    };

    const forwarderDomain = await forwarder.updateAndGetDomain();
    const compromisedPasswordUrl = getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.PASSWORD_COMPROMISED);

    const errorsMap = {
        'validation.not_empty': translator.getMessage('registration_error_not_empty'),
        'validation.not_valid': translator.getMessage('registration_error_not_valid'),
        'validation.min_length': translator.getMessage('registration_error_min_length'),
        'validation.compromised.password': translator.getMessage('registration_error_compromised_password', {
            a: (chunks: string[]) => (`<a href="${compromisedPasswordUrl}" target="_blank" class="link">${chunks}</a>`),
        }),
        'validation.unique_constraint': translator.getMessage('registration_error_unique_constraint'),
        // the value is not shown to users, so it is not translated
        [REQUIRED_EMAIL_CONFIRMATION_CODE]: REQUIRED_EMAIL_CONFIRMATION_CODE,
        default: translator.getMessage('registration_error_default'),
    };

    let accessTokenData;
    try {
        accessTokenData = await authApi.register(credentials);
        // send a request to 'oauth/token' to check if email confirmation is required
        accessTokenData = await authApi.getAccessToken(credentials);
    } catch (e) {
        let errorData;
        try {
            errorData = JSON.parse(e.message);
        } catch (e) {
            // if was unable to parse error message, e.g. network is disabled
            throw new Error(JSON.stringify({ error: errorsMap.default }));
        }

        const {
            error_code: errorCode,
            field,
            auth_id: authId,
        }: {
            error_code: keyof typeof errorsMap,
            field: keyof typeof fieldsMap
            auth_id: string,
        } = errorData;

        if (errorCode === REQUIRED_EMAIL_CONFIRMATION_CODE) {
            // authId is required to request another code
            // so error should be shown in the popup if there is no authId
            if (!authId) {
                const error = translator.getMessage('confirm_email_no_auth_id_error_on_register', {
                    support_email: SUPPORT_EMAIL,
                    a: (chunks: string) => `<a href="mailto:${SUPPORT_EMAIL}" target="_blank">${chunks}</a>`,
                });
                throw new Error(JSON.stringify({ status: errorCode, error }));
            }

            throw new Error(JSON.stringify({ status: errorCode, authId }));
        }

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

/**
 * Uses {@link authApi} to request another email confirmation code.
 *
 * @param authId Auth id.
 */
const resendEmailConfirmationCode = async (authId: string) => {
    await authApi.resendCode(authId);
};

export const authProvider = {
    getAccessToken,
    register,
    userLookup,
    resendEmailConfirmationCode,
};
