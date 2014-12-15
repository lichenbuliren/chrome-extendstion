$(function () {
    var background = chrome.extension.getBackgroundPage();
    var screenshot, contentURL = '';

    // 填充表单
    $('#form-fill').on('click', function () {
        background.formFill();
    });

    $('#order-fill').on('click', function () {
        background.orderFill();
    });

    $('#screen-shot').on('click', function () {
        chrome.tabs.getSelected(null, function (tab) {
            sendCaptureMessage(tab, storeOrderInfo);
        });
    });

    // 发送滚动请求
    function sendCaptureMessage(tab, callback) {
        contentURL = tab.url;
        screenshot = {};
        chrome.tabs.sendRequest(tab.id, {
            msg: 'capturePage'
        }, function (dataURI) {
            if (dataURI) {
                if (callback && typeof callback == 'function') {
                    ajax_upload(dataURI, callback);
                }
            } else {
                console.error('dataURI is error');
            }
        });
    }

    // 又拍云图片上传
    function ajax_upload(data, callback) {
        $.ajax({
            type: 'POST',
            url: 'http://tools2.hai0.com/api/upload',
            data: {
                base64Data: data
            },
            success: function (result) {
                if (result.code == 1) {
                    if (callback && typeof callback == 'function') {
                        callback(result.url);
                    }
                } else {
                    alert('截取图片上传失败，请重试！');
                    return false;
                }
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                console.log(textStatus);
                return false;
            }
        });
    }

    // 记录order info
    function storeOrderInfo(url) {
        chrome.tabs.getSelected(null, function (tab) {
            chrome.tabs.sendRequest(tab.id, {
                msg: 'store-order-info',
                url: url
            }, function (order) {
                console.log(order);
            });
        });
    }
});