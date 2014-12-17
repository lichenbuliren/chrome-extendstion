$(function() {
    var background = chrome.extension.getBackgroundPage();
    var screenshot, contentURL = '';

    // 填充表单
    $('#form-fill').on('click', function() {
        background.formFill();
    });

    $('#order-fill').on('click', function() {
        background.orderFill();
    });

    $('#screen-shot').on('click', function() {
        $('.loading').show();
        chrome.tabs.getSelected(null, function(tab) {
            sendScrollMessage(tab, function(dataURI) {
                ajax_upload(dataURI, function(url) {
                    console.log(dataURI);
                    storeOrderInfo(url, function(order) {
                        console.log(order);
                        $('.loading').hide();
                    });
                });
            });
        });
    });

    // 发送截图请求
    function sendScrollMessage(tab, callback) {
        contentURL = tab.url;
        screenshot = {};
        chrome.tabs.sendRequest(tab.id, {
            msg: 'scrollPage'
        }, function(dataURI) {
            var dataURI = screenshot.canvas.toDataURL();
            if (dataURI) {
                if (callback && typeof callback == 'function') {
                    callback(dataURI);
                }
            } else {
                console.error('dataURI is error');
            }
        });
    }

    chrome.extension.onRequest.addListener(function(request, sender, callback) {
        if (request.msg == 'capturePage') {
            capturePage(request, sender, callback);
        } else {
            console.error('Unknown message received from content script: ' + request.msg);
        }
    });

    // 又拍云图片上传
    function ajax_upload(data, callback) {
        $.ajax({
            type: 'POST',
            url: 'http://tools2.hai0.com:3000/api/upload',
            data: {
                base64Data: data
            },
            success: function(result) {
                if (result.code == 1) {
                    if (callback && typeof callback == 'function') {
                        callback(result.url);
                    }
                } else {
                    alert('截取图片上传失败，请重试！');
                    return false;
                }
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                console.log(textStatus);
                return false;
            }
        });
    }


    // 记录order info
    function storeOrderInfo(url, callback) {
        chrome.tabs.getSelected(null, function(tab) {
            chrome.tabs.sendRequest(tab.id, {
                msg: 'store-order-info',
                url: url
            }, function(order) {
                if (callback && typeof callback == 'function') {
                    callback(order);
                }
            });
        });
    }

    function capturePage(data, sender, callback) {
        var canvas;

        // $('bar').style.width = parseInt(data.complete * 100, 10) + '%';

        // Get window.devicePixelRatio from the page, not the popup
        var scale = data.devicePixelRatio && data.devicePixelRatio !== 1 ?
            1 / data.devicePixelRatio : 1;

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

        chrome.tabs.captureVisibleTab(
            null, {
                format: 'png',
                quality: 50
            },
            function(dataURI) {
                if (dataURI) {
                    var image = new Image();
                    image.onload = function() {
                        screenshot.ctx.drawImage(image, data.x, data.y);
                        callback(true);
                    };
                    image.src = dataURI;
                }
            });
    }
});
