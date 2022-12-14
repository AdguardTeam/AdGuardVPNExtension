import { format } from 'date-fns';
import { messenger } from '../lib/messenger';
import { log } from '../lib/logger';
import { MessageType } from '../lib/constants';

enum FileExtension {
    Txt = 'txt',
}

/**
 * Helper for creating a downloadable file
 */
export const exportData = async (content: string, fileExtension: FileExtension, appVersion: string) => {
    const currentTimeString = format(Date.now(), 'yyyyMMdd_HHmmss');
    const filename = `${currentTimeString}_adg_vpn_v${appVersion}.${fileExtension}`;
    const blob = new Blob([content]);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};

const getLogs = async () => {
    return messenger.sendMessage(MessageType.GET_LOGS);
};

const getAppVersion = async () => {
    return messenger.sendMessage(MessageType.GET_APP_VERSION);
};

export const exportLogs = async () => {
    try {
        const logs = await getLogs();
        const appVersion = await getAppVersion();
        await exportData(logs, FileExtension.Txt, appVersion);
    } catch (e: any) {
        log.error(e.message);
    }
};
