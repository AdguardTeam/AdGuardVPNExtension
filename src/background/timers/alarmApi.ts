import browser from 'webextension-polyfill';

/**
 * Creates alarm
 * @param alarmName
 * @param delay in ms
 */
const createAlarm = (alarmName: string, delay: number): void => {
    browser.alarms.create(alarmName, { when: Date.now() + delay });
};

/**
 * Creates periodic alarm
 * @param alarmName
 * @param interval in minutes!
 */
const createPeriodicAlarm = (alarmName: string, interval: number): void => {
    browser.alarms.create(alarmName, { periodInMinutes: interval });
};

/**
 * Clears alarm timer by provided alarm name
 * @param alarmName
 */
const clearAlarm = async (alarmName: string): Promise<void> => {
    const alarm = await browser.alarms.get(alarmName);
    await browser.alarms.clear(alarm?.name);
};

/**
 * Executes callback on alarm fires
 * @param alarmName
 * @param callback
 */
const onAlarmFires = (alarmName: string, callback: () => void): void => {
    browser.alarms.onAlarm.addListener((alarm) => {
        if (alarm.name === alarmName) {
            callback();
        }
    });
};

export const alarmApi = {
    createAlarm,
    createPeriodicAlarm,
    clearAlarm,
    onAlarmFires,
};
