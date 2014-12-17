$(function () {
    var background = chrome.extension.getBackgroundPage();
    var screenshot, contentURL = '';


    chrome.extension.onRequest.addListener(function (request, sender, callabck) {
        if (request.msg == 'replaceHttpsImg') {
            var imgStr = request.imgStr;
            console.log(imgStr);
        }
    });
    // 填充表单
    $('#form-fill').on('click', function () {
        background.formFill();
    });

    $('#order-fill').on('click', function () {
        background.orderFill();
    });

    $('#screen-shot').on('click', function () {
        chrome.tabs.getSelected(null, function (tab) {
            // 替换amazon跨域图片
            replaceHttpsImg(tab, function (data) {
                console.log(data);
                ajax_replaceHttpsImg(data, function (imgObj) {
                    sendCaptureMessage(tab, imgObj, storeOrderInfo(function() {
                        ajax_removeTempImg(data);
                    }));

                });
            });
        });
    });

    // 替换https图片
    function replaceHttpsImg(tab, callback) {
        chrome.tabs.sendRequest(tab.id, {
            msg: 'replaceHttpsImg'
        }, function (dataArr) {
            callback(dataArr);
        });
    }

    // 发送截图请求
    function sendCaptureMessage(tab, data, callback) {
        chrome.tabs.sendRequest(tab.id, {
            msg: 'capturePage',
            imgObj: data
        }, function (dataURI) {
            console.log(dataURI);
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

    /**
     * 通过node服务，获取跨域图片，替换成本地图片
     * @param  str 需要替换的链接字符串，以','分割
     * @param  {Function} callback [description]
     * @return {[type]}            [description]
     */
    function ajax_replaceHttpsImg(imgStr, callback) {
        $.ajax({
            type: 'POST',
            url: 'http://localhost:3000/api/replaceHttpsImg',
            data: {
                str: $.trim(imgStr)
            },
            crossDomain: true,
            success: function (data) {
                console.log(data);
                if (data.code == 1) {
                    var imgObj = data.imgObj;
                    // TODO replace local img src 
                    if (callback && typeof callback == 'function') {
                        callback(imgObj);
                    }
                } else {
                    console.log('_replaceHttpsImg failure');
                }
            }
        });
    };


    // 删除临时文件
    function ajax_removeTempImg(data) {

    }

    // 记录order info
    function storeOrderInfo(url, callback) {
        chrome.tabs.getSelected(null, function (tab) {
            chrome.tabs.sendRequest(tab.id, {
                msg: 'store-order-info',
                url: url
            }, function (order) {
                if (callback && typeof callback == 'function') {
                    callback();
                }
                console.log(order);
            });
        });
    }
});