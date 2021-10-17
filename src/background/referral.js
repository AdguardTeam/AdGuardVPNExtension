import { nanoid } from 'nanoid';

// TODO replace referralLink and referralPartners with values from backend
const referralLink = `https://adguard-vpn.com/join/${nanoid()}`;
const referralPartners = 5;

const referralPartnersLimit = 10;

export const referralData = {
    referralLink,
    referralPartners,
    referralPartnersLimit,
};
