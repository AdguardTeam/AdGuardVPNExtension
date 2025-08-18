import { BAD_CREDENTIALS_CODE } from '../../common/constants';
import { authApi } from '../api';
import { translator } from '../../common/translator';
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
        account_disabled: translator.getMessage('authentication_error_account_disabled'),
        account_locked: translator.getMessage('authentication_error_account_locked'),
        [BAD_CREDENTIALS_CODE]: translator.getMessage('authentication_error_wrong_credentials'),
        [TOO_MANY_REQUESTS_CODE]: translator.getMessage('authentication_too_many_requests'),
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

        const { error_code: errorCode }: {
            error_code: keyof typeof errorsMap,
            auth_id: string,
        } = errorData;

        const error = errorsMap[errorCode] || errorsMap[errorStatusCode] || errorsMap.default;

        throw new Error(JSON.stringify({ error, status: errorCode }));
    }

    return accessTokenModel.fromRemoteToLocal(accessTokenData);
};

const userLookup = async (email: string, appId: string) => {
    const { can_register: canRegister } = await authApi.userLookup(email, appId);
    return { canRegister };
};

export const authProvider = {
    getAccessToken,
    userLookup,
};
