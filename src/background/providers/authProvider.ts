import { authApi } from '../api';

const userLookup = async (email: string, appId: string) => {
    const { can_register: canRegister } = await authApi.userLookup(email, appId);
    return { canRegister };
};

export const authProvider = {
    userLookup,
};
