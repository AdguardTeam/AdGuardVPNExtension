import authApi from '../api/authApi';

const getAccessToken = async (credentials) => {
    let accessTokenData;

    try {
        accessTokenData = await authApi.getAccessToken(credentials);
    } catch (e) {
        const {
            error,
            error_description: errorDescription,
            error_code: errorCode,
        } = JSON.parse(e.message);

        if (errorCode === '2fa_required') {
            throw new Error(JSON.stringify({ status: errorCode }));
        }

        throw new Error(JSON.stringify({ error, errorCode, errorDescription }));
    }

    const {
        access_token: accessToken,
        expires_in: expiresIn,
        token_type: tokenType,
        scope,
    } = accessTokenData;

    return {
        accessToken,
        expiresIn,
        tokenType,
        scope,
    };
};

export default {
    getAccessToken,
};
