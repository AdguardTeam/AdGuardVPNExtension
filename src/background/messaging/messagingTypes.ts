import { SocialAuthProvider } from '../../lib/constants';

export interface StartSocialAuthData {
    provider: SocialAuthProvider;
    marketingConsent: boolean;
}

export interface UserLookupData {
    email: string;
}
