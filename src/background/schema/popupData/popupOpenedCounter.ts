import zod from 'zod';

export const popupOpenedCounterStateScheme = zod.object({
    count: zod.number(),
}).strict();

export type PopupOpenedCounterState = zod.infer<typeof popupOpenedCounterStateScheme>;

export const POPUP_OPENED_COUNTER_DEFAULTS: PopupOpenedCounterState = {
    count: 0,
};
