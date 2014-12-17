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
chrome.extension.onConnect.addListener(function(port) {
    port.onMessage.addListener(function(msg) {
        if (msg.action == 'append') {
            var address = msg.address;
            for (var key in address) {
                $('#' + key).val(address[key]);
            }
        } else if (msg.action == 'append_order') {
            var order = msg.order;
            // TODO 填充对应的订单表单
            $('.order-list .order-no').each(function() {
                if ($(this).val() == '') {
                    $(this).val(order.order_no);
                }
            });

            $('.order-list .account').each(function() {
                if ($(this).val() == '') {
                    $(this).val(order.account);
                }
            });

            $('.lnk-thumbnail').each(function() {
                var url = order.url;
                if ($(this).attr('href') == '') {
                    $(this).attr('href', url).children('.img-thumbnail').attr('src', url).show();
                }
            })
        }
    });
});

chrome.extension.onRequest.addListener(function(request, sender, callback) {
    if (request.msg == 'capturePage') {
        var imgObj = request.imgObj;
        // TODO  replace img src
        // _replaceLocalImg(imgObj, function () {
        //     console.log('replaced images');
        //     _html2canvas(callback);
        // });
        getPositions(callback);

    } else if (request.msg === 'store-order-info') {
        var order_no = $.trim($('.a-column.a-span7.a-spacing-top-mini').text().split('#')[1]),
            account = $.trim($('#nav-signin-text').text()),
            url = request.url;
        var order = {
            'account': account,
            'order_no': order_no,
            'url': url
        }
        port.postMessage({
            'action': 'store-order-info',
            'order': order
        });
        if (callback && typeof callback == 'function') {
            callback(order);
        }
    } else if (request.msg == 'replaceHttpsImg') {
        var imgStr = '';
        var count = $('.yo-critical-feature').length;
        $('.yo-critical-feature').each(function(index) {
            var _split = (index == (count - 1)) ? '' : ',';
            imgStr += $(this).attr('src') + _split;
        });
        if (callback && typeof callback == 'function') {
            callback(imgStr);
        }
        // _replaceHttpsImg(imgStr, callback);
    } else {
        console.error('Unknown message received from background: ' + request.msg);
    }
});

function _html2canvas(callback) {
    if ($('#orderDetails').length > 0) {
        html2canvas($('#orderDetails'), {
            useCORS: true,
            onrendered: function(canvas) {
                callback(canvas.toDataURL('image/png'));
            }
        });
    } else {
        callback(null);
    }
}

// 替换客户端图片src
function _replaceLocalImg(imgObj, callback) {
    $('.yo-critical-feature').each(function(index) {
        var _src = $(this).attr('src');
        var newSrc = imgObj[_src];
        $(this).after('<img src="' + newSrc + '">');
        $(this).remove();
    });
    if (callback && typeof callback == 'function') {
        callback();
    }
}

function max(nums) {
    return Math.max.apply(Math, nums.filter(function(x) {
        return x;
    }));
}

function getPositions(callback) {
    var body = document.body,
        widths = [
            document.documentElement.clientWidth,
            document.body.scrollWidth,
            document.documentElement.scrollWidth,
            document.body.offsetWidth,
            document.documentElement.offsetWidth
        ],
        heights = [
            document.documentElement.clientHeight,
            document.body.scrollHeight,
            document.documentElement.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.offsetHeight
        ],
        // 最大宽度
        fullWidth = max(widths),
        // 页面内容高度
        fullHeight = max(heights),
        // 可视区域宽度
        windowWidth = window.innerWidth,
        // 可是区域高度
        windowHeight = window.innerHeight,
        // 原始的滚动X轴位置
        originalX = window.scrollX,
        // 原始的Y轴滚动位置
        originalY = window.scrollY,
        originalOverflowStyle = document.documentElement.style.overflow,
        arrangements = [],
        // pad the vertical scrolling to try to deal with
        // sticky headers, 250 is an arbitrary size
        scrollPad = 200,
        yDelta = windowHeight - (windowHeight > scrollPad ? scrollPad : 0),
        xDelta = windowWidth,
        yPos = fullHeight - windowHeight,
        xPos,
        numArrangements;

    // During zooming, there can be weird off-by-1 types of things...
    if (fullWidth <= xDelta + 1) {
        fullWidth = xDelta;
    }

    // Disable all scrollbars. We'll restore the scrollbar state when we're done
    // taking the screenshots.
    document.documentElement.style.overflow = 'hidden';

    while (yPos > -yDelta) {
        xPos = 0;
        while (xPos < fullWidth) {
            arrangements.push([xPos, yPos]);
            xPos += xDelta;
        }
        yPos -= yDelta;
    }

    numArrangements = arrangements.length;

    function cleanUp() {
        document.documentElement.style.overflow = originalOverflowStyle;
        window.scrollTo(originalX, originalY);
    }

    (function processArrangements() {
        if (!arrangements.length) {
            cleanUp();
            if (callback) {
                callback();
            }
            return;
        }

        var next = arrangements.shift(),
            x = next[0],
            y = next[1];

        window.scrollTo(x, y);

        var data = {
            msg: 'capturePage',
            x: window.scrollX,
            y: window.scrollY,
            complete: (numArrangements - arrangements.length) / numArrangements,
            totalWidth: fullWidth,
            totalHeight: fullHeight,
            devicePixelRatio: window.devicePixelRatio
        };

        // Need to wait for things to settle
        window.setTimeout(function() {
            // In case the below callback never returns, cleanup
            var cleanUpTimeout = window.setTimeout(cleanUp, 1250);
            chrome.extension.sendRequest(data, function(captured) {
                window.clearTimeout(cleanUpTimeout);
                if (captured) {
                    // Move on to capture next arrangement.
                    processArrangements();
                } else {
                    cleanUp();
                }
            });
        }, 150);
    })();
}
