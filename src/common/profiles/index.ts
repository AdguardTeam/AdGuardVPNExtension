export {
    DEFAULT_PROFILE_ID,
    MAX_PROFILES_COUNT,
    MAX_PROFILE_NAME_LENGTH,
    ProfileNameValidationResult,
    type ProfileOperationResponse,
    isDefaultProfileId,
    getProfileDisplayName,
    validateProfileName,
} from './constants';

export {
    type ProfileDnsData,
    type ProfileLocationData,
    type ProfileExclusionsDataMap,
    type ProfilesStateStripped,
    type ProfilesOptionsData,
    type ActiveProfileChangedPayload,
} from './types';

export {
    profileSwitchMachine,
    ProfileSwitchState,
    ProfileSwitchEvent,
} from './profileSwitchMachine';

export { ProfileSwitchTracker } from './ProfileSwitchTracker';
