import Whitelist from './whitelist';
import { proxy } from '../proxy';
import storage from '../storage';

const whitelist = new Whitelist(proxy, storage);

export default whitelist;
