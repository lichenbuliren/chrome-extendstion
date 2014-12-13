// init, get item list from background
// 通过port来建立长连接通信
var port = chrome.extension.connect({
    name: 'auto-fill-form'
});

// get form data
var address = {};
// 这里根据页面的dom元素来判断是否是需要保存表单数据的页面
// 如有有需要可以根据自身情况判断
if ($('#taohai-address-info').length > 0) {
    // 作为测试，我这里把所有的表单字段以JSON格式的字串存储在一个隐藏域中
    address = JSON.parse($('#taohai-address-info').val());
    port.postMessage({
        action: 'init-form-data',
        address: address
    });
}

// get message from background
// 监听connect事件，如果有通过port.postMessage传递过来的消息就会被扑捉到
chrome.extension.onConnect.addListener(function (port) {
    port.onMessage.addListener(function (msg) {
        if (msg.action == 'append') {
            // TODO fill the form you need
            var address = msg.address;
            for (var key in address) {
                $('#' + key).val(address[key]);
            }
        }
    });
});