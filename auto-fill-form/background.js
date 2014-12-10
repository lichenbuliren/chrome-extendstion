var storage = chrome.storage.local;

// page init
chrome.runtime.onConnect.addListener(function (port) {
    port.onMessage.addListener(function (msg) {
        if (msg.action == 'init') {
            storage.set({
                'address': msg.address
            });
        }
    });
});

function init() {
    var address = storage.get({
        'address': ''
    }, function (data) {
        postMessage('append', data.address);
    });
}

// setInterval(init, 0);

// post message to tab
function postMessage(action, address) {
    chrome.tabs.query({
        active: true,
        windowId: chrome.windows.WINDOW_ID_CURRENT
    }, function (tab) {
        var port = chrome.tabs.connect(tab[0].id, {
            name: 'taoHai_buyer_helper'
        });
        port.postMessage({
            action: action,
            address: address
        });
    });
}

// 
chrome.browserAction.onClicked.addListener(function (tab) {
    init();
});