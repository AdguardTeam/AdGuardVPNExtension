import browser from 'webextension-polyfill';
import Exclusions from './exclusions';
import { proxy } from '../proxy';
import settings from '../settings/settings';

const exclusions = new Exclusions(browser, proxy, settings);

export default exclusions;
