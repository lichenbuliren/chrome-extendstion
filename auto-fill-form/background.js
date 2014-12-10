var storage = chrome.storage.local,
    screenshot = {};

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
        postMessage({
            action: 'append',
            address: data.address
        });
    });
}

// 截图函数
function capture(callback) {
    chrome.tabs.captureVisibleTab(null, {
        format: 'jpeg',
        quality: 100
    }, function (data) {
        screenshot.data = data;
        if (callback && typeof callback == 'function') {
            return callback(data);
        }
    });
}

// post message to tab
function postMessage(data) {
    chrome.tabs.query({
        active: true,
        windowId: chrome.windows.WINDOW_ID_CURRENT
    }, function (tab) {
        var port = chrome.tabs.connect(tab[0].id, {
            name: 'taoHai_buyer_helper'
        });
        port.postMessage(data);
    });
}

// 
chrome.browserAction.onClicked.addListener(function (tab) {
    init();
});