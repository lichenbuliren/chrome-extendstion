// init, get item list from background
var port = chrome.runtime.connect({
    name: 'taoHai_buyer_helper'
});
var address = {}
if ($('#taohai-address-info').length > 0) {
    address = JSON.parse($('#taohai-address-info').val());
    port.postMessage({
        action: 'init',
        address: address
    });
}

// get message from background
chrome.runtime.onConnect.addListener(function (port) {
    port.onMessage.addListener(function (msg) {
        if (msg.action == 'append') {
            var address = msg.address;
            for (var key in address) {
                $('#' + key).val(address[key]);
            }
        }
    });
});