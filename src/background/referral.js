import { nanoid } from 'nanoid';

// TODO replace referralLink and referralPartners with values from backend
const referralLink = `https://adguard-vpn.com/join/${nanoid()}`;
const referralPartners = 11;

export const referralData = {
    referralLink,
    referralPartners,
};
