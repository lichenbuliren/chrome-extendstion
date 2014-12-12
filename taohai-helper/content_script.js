// init, get item list from background
var port = chrome.extension.connect({
    name: 'taoHai_buyer_helper'
});

var address = {}
if ($('#taohai-address-info').length > 0) {
    address = JSON.parse($('#taohai-address-info').val());
    port.postMessage({
        action: 'init-form-data',
        address: address
    });
}

// get message from background
chrome.extension.onConnect.addListener(function (port) {
    port.onMessage.addListener(function (msg) {
        if (msg.action == 'append') {
            var address = msg.address;
            for (var key in address) {
                $('#' + key).val(address[key]);
            }
        } else if (msg.action == 'append_order') {
            var order = msg.order;
            // TODO 填充对应的订单表单
            $('.order-list .order-no').each(function () {
                if ($(this).val() == '') {
                    $(this).val(order.order_no);
                }
            });

            $('.order-list .account').each(function () {
                if ($(this).val() == '') {
                    $(this).val(order.account);
                }
            });
        }
    });
});

chrome.extension.onRequest.addListener(function (request, sender, callback) {
    if (request.msg == '') {

    }
});