import browserApi from '../browserApi';
import Exclusions from './Exclusions';
import proxy from '../proxy';
import { settings } from '../settings';

const exclusions = new Exclusions(browserApi, proxy, settings);

export default exclusions;
