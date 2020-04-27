# Permissions that the extension uses

- `proxy` - This is what the extension does.
- `contextMenus` - We use this to add a context menu items that allows enabling or disabling the VPN.
- `management` - We use this to provide an option to turn off another proxy-extension in one click.
- `notifications` - We use this to show a notification after a successful user authentication via social networks.
- `privacy` - We use this to provide the "Disable WebRTC" feature which is crucial to prevent websites from detecting user's real IP address.
- `storage`, `unlimitedStorage` - These permissions are required in order to store user settings
- `webRequest`, `webRequestBlocking` - We use these for two purposes. First, we have a webRequest listener that is listening for error events. We use it to detect non-routable (hosted in the LAN, for instance) domains and automatically add them to the list of exclusions. Also, we have an `onAuthRequired` handler that handles authentication for the endpoints that require it.
- `<all_urls>` - `<all_urls>` is necessary because otherwise `onAuthRequired` won't fire. Also, this is necessary for the non-routable domains detection feature.
