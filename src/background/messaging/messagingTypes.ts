import { type SocialAuthProvider } from '../../common/constants';

export interface StartSocialAuthData {
    provider: SocialAuthProvider;
    marketingConsent: boolean;
}
