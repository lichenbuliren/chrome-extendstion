var storage = chrome.storage.local;

// page init
chrome.extension.onConnect.addListener(function (port) {
    port.onMessage.addListener(function (msg) {
        if (msg.action == 'init-form-data') {
            storage.set({
                'address': msg.address
            });
        }
    });
});

// 填充表单
function formFill() {
    var address = storage.get({
        'address': ''
    }, function (data) {
        postMessage({
            action: 'append',
            address: data.address
        });
    });
}

// post message to tab
function postMessage(data) {
    chrome.tabs.query({
        active: true,
        windowId: chrome.windows.WINDOW_ID_CURRENT
    }, function (tab) {
        var port = chrome.tabs.connect(tab[0].id, {
            name: 'auto-fill-form'
        });
        port.postMessage(data);
    });
}

// 在background.js里面监听browser-icon点击事件
chrome.browserAction.onClicked.addListener(function (tab) {
    formFill();
});