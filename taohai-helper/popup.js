$(function () {
    var background = chrome.extension.getBackgroundPage();
    var screenshot, contentURL = '';

    // 发送滚动请求
    function sendScrollMessage(tab) {
        contentURL = tab.url;
        screenshot = {};
        chrome.tabs.sendRequest(tab.id, {
            msg: 'scrollPage'
        }, function () {
            // We're done taking snapshots of all parts of the window. Display
            // the resulting full screenshot image in a new browser tab.
            var dataURI = screenshot.canvas.toDataURL();
            ajax_upload(dataURI, storeOrderInfo);
        });
    }

    chrome.extension.onRequest.addListener(function (request, sender, callback) {
        if (request.msg === 'capturePage') {
            capturePage(request, sender, callback);
        } else {
            console.error('Unknown message received from content script: ' + request.msg);
        }
    });

    function capturePage(data, sender, callback) {
        var canvas;

        // Get window.devicePixelRatio from the page, not the popup
        var scale = data.devicePixelRatio && data.devicePixelRatio !== 1 ? 1 / data.devicePixelRatio : 1;

        if (!screenshot.canvas) {
            canvas = document.createElement('canvas');
            canvas.width = data.totalWidth;
            canvas.height = data.totalHeight;
            screenshot.canvas = canvas;
            screenshot.ctx = canvas.getContext('2d');

            // Scale to account for device pixel ratios greater than one. (On a
            // MacBook Pro with Retina display, window.devicePixelRatio = 2.)
            if (scale !== 1) {
                // TODO - create option to not scale? It's not clear if it's
                // better to scale down the image or to just draw it twice
                // as large.
                screenshot.ctx.scale(scale, scale);
            }
        }

        // if the canvas is scaled, then x- and y-positions have to make
        // up for it in the opposite direction
        if (scale !== 1) {
            data.x = data.x / scale;
            data.y = data.y / scale;
        }

        chrome.tabs.captureVisibleTab(null, {
            format: 'png',
            quality: 100
        }, function (dataURI) {
            if (dataURI) {
                var image = new Image();
                image.onload = function () {
                    screenshot.ctx.drawImage(image, data.x, data.y);
                    callback(true);
                };
                image.src = dataURI;
            }
        });
    }

    // 填充表单
    $('#form-fill').on('click', function () {
        background.formFill();
    });

    $('#screen-shot').on('click', function () {
        chrome.tabs.getSelected(null, function (tab) {
            chrome.tabs.executeScript(tab.id, {
                file: 'page.js'
            }, function () {
                sendScrollMessage(tab);
            });
        });
    });

    $('.order-fill').on('click', function () {
        background.orderFill();
    });

    // 又拍云图片上传
    function ajax_upload(data, callback) {
        $.ajax({
            type: 'POST',
            url: 'http://tools.hai0.com/api/upload',
            data: {
                base64Data: data
            },
            success: function (result) {
                if (result.code == 1) {
                    callback(result.url);
                } else {
                    alert('截取图片上传失败，请重试！');
                }
            }
        });
    }

    // 记录order info
    function storeOrderInfo(url) {
        chrome.tabs.getSelected(null, function (tab) {
            chrome.tabs.sendRequest(tab.id, {
                msg: 'storeOrderInfo'
            }, function (order) {
                order.url = url;
                background.storeOrderInfo(order);
            });
        });
    }
});