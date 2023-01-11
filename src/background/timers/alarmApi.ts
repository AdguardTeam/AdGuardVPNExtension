import browser from 'webextension-polyfill';

/**
 * Creates alarm
 * delay in ms
 */
const createAlarm = (alarmName: string, delay: number) => {
    browser.alarms.create(alarmName, { when: Date.now() + delay });
};

/**
 * Creates periodic alarm
 * interval in minutes!
 */
const createPeriodicAlarm = (alarmName: string, interval: number) => {
    browser.alarms.create(alarmName, { periodInMinutes: interval });
};

/**
 * Clears alarm timer by provided alarm name
 */
const clearAlarm = async (alarmName: string) => {
    const alarm = await browser.alarms.get(alarmName);
    await browser.alarms.clear(alarm?.name);
};

/**
 * Executes callback on alarm fires
 */
const onAlarmFires = (alarmName: string, callback: () => void) => {
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
