export type AuthCredentials = {
    username: string;
    password: string;
    twoFactor: string;
    marketingConsent: boolean;
    locale: string;
    clientId: string;
    appId: string;
};

export type RequestProps = {
    path: string;
    method: string;
};
