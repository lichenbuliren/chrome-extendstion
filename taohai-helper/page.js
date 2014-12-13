function onMessage(request, sender, callback) {
	if (request.msg === 'scrollPage') {
		getPositions(callback);
	} else {
		console.error('Unknown message received from background: ' + request.msg);
	}
}

// 监听request事件
if (!window.hasScreenCapturePage) {
	window.hasScreenCapturePage = true;
	chrome.extension.onRequest.addListener(onMessage);
}


function max(nums) {
	return Math.max.apply(Math, nums.filter(function (x) {
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

	/** * /
	console.log('fullHeight', fullHeight, 'fullWidth', fullWidth);
	console.log('windowWidth', windowWidth, 'windowHeight', windowHeight);
	console.log('xDelta', xDelta, 'yDelta', yDelta);
	var arText = [];
	arrangements.forEach(function(x) { arText.push('['+x.join(',')+']'); });
	console.log('arrangements', arText.join(', '));
	/**/

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
		window.setTimeout(function () {
			// In case the below callback never returns, cleanup
			var cleanUpTimeout = window.setTimeout(cleanUp, 1250);
			chrome.extension.sendRequest(data, function (captured) {
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