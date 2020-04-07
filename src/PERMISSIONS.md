# Permissions description
- `activeTab` - This is necessary to get current tab information

- `contextMenus` - This is necessary to add context menu items, such as enable or disable vpn.

- `management` - This is necessary to give user ability to turn off other extension with proxy permissions.

- `notifications` - This is required to show notification after successful user authentication via social networks

- `privacy` - This is necessary to provide "Disable WebRTC" feature which is crucial to prevent websites from detecting user's real IP address

- `proxy` - This is what the extension does.

- `storage`, `unlimitedStorage` - This permissions are required in order to keep user settings

- `webRequest`, `webRequestBlocking` - These are used to handle errors happening with non-routable domains. Also they are necessary to use onAuthRequired (proxy requires authentication so there's that).

- `<all_urls>` - This is necessary because without it some requests do not appear in the webRequest.onAuthRequired event
