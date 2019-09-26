import {
    action, computed, observable,
} from 'mobx';

import bgProvider from '../../../lib/background-provider';

class VpnInfoStore {
    @observable vpnInfo = {
        bandwidthFreeMbits: null,
        premiumPromoEnabled: null,
        premiumPromoPage: null,
    };

    @action
    getVpnInfo = async () => {
        const vpnInfo = await bgProvider.vpn.getVpnInfo();
        this.setVpnInfo(vpnInfo);
    };

    @action
    setVpnInfo = (vpnInfo) => {
        if (!vpnInfo) {
            return;
        }
        this.vpnInfo = vpnInfo;
    };

    @computed
    get bandwidthFreeMbits() {
        return this.vpnInfo.bandwidthFreeMbits;
    }

    @computed
    get premiumPromoEnabled() {
        return this.vpnInfo.premiumPromoEnabled;
    }

    @computed
    get premiumPromoPage() {
        return this.vpnInfo.premiumPromoPage;
    }
}

export default VpnInfoStore;
