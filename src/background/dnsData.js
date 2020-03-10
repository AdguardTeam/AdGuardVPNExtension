const dnsList = [{
    id: 'default',
    title: 'Default',
    desc: 'Automatically use your own DNS servers when connected to the VPN',
    dns1: '0.0.0.0',
    dns2: '0.0.0.0',
}, {
    id: 'adguard-dns',
    title: 'AdGuard DNS',
    desc: 'Removes ads and protects your device from malware',
    dns1: '176.103.130.130',
    dns2: '176.103.130.131',
}, {
    id: 'google-dns',
    title: 'Google DNS',
    desc: 'Free alternative DNS service by Google',
    dns1: '8.8.8.8',
    dns2: '8.8.4.4',
}, {
    id: 'cloudflare-dns',
    title: 'Cloudflare DNS',
    desc: 'Free DNS service by Cloudflare',
    dns1: '1.1.1.1',
    dns2: '1.0.0.1',
}, {
    id: 'cisco-dns',
    title: 'Cisco OpenDNS',
    desc: 'DNS server that protects your device from malware',
    dns1: '208.67.222.222',
    dns2: '208.67.220.220',
}, {
    id: 'quad9-dns',
    title: 'Quad9',
    desc: 'Free alternative DNS service with protection from phishing and spyware',
    dns1: '9.9.9.9',
    dns2: '149.112.112.112',
}];

export default dnsList;
