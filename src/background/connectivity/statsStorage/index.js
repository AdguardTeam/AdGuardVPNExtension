import browserApi from '../../browserApi';
import StatsStorage from './StatsStorage';

const statsStorage = new StatsStorage(browserApi.storage);

export default statsStorage;
