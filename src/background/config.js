// https://bit.adguard.com/projects/ADGUARD/repos/adguard-account-service/browse
export const ACCOUNT_API_URL = 'https://account.adguard.com/api/1.0';

// https://bit.adguard.com/projects/ADGUARD/repos/adguard-vpn-backend-service/browse
export const VPN_API_URL = 'https://backend.adguard.io/api/v1';

// https://bit.adguard.com/projects/ADGUARD/repos/adguard-auth-service/browse
export const AUTH_API_URL = 'https://auth.adguard.com';

// Websocket
export const WS_API_URL_TEMPLATE = 'wss://{{host}}:8443/user_metrics';

// Auth section
export const AUTH_ACCESS_TOKEN_KEY = 'auth.access.token';
export const AUTH_CLIENT_ID = 'adguard-vpn-extension';
export const AUTH_BASE_URL = 'https://auth.adguard.com/oauth/authorize';
export const AUTH_REDIRECT_URI = 'https://auth.adguard.com/oauth.html';
export const PASSWORD_RECOVERY_URL = 'https://adguard.com/forward.html?action=recovery_password&from=popup&app=vpn_extension';

// Privacy and EULA
export const PRIVACY_URL = 'https://adguard.com/forward.html?action=privacy&from=popup&app=vpn_extension';
export const EULA_URL = 'https://adguard.com/forward.html?action=eula&from=popup&app=vpn_extension';

// Commercial
export const BUY_LICENSE_URL = 'https://adguard.com/forward.html?action=buy_license&from=popup&app=vpn_extension';
export const OTHER_PRODUCTS_URL = 'https://adguard.com/forward.html?action=other_products&from=popup&app=vpn_extension';
export const POPUP_STORE_URL = 'https://adguard.com/forward.html?action=store&from=popup&app=vpn_extension';
