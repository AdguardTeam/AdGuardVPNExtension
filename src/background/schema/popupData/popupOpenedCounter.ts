import * as v from 'valibot';

export const popupOpenedCounterStateScheme = v.strictObject({
    count: v.number(),
});

export type PopupOpenedCounterState = v.InferOutput<typeof popupOpenedCounterStateScheme>;

export const POPUP_OPENED_COUNTER_DEFAULTS: PopupOpenedCounterState = {
    count: 0,
};
