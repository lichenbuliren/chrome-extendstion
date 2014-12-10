$(function () {
    var background = chrome.extension.getBackgroundPage();

    $('#screen-shot').on('click', function () {
        $('html,body').animate({
            scrollTop: 0
        }, 0);
        background.capture(function (data) {

        });

        function ajax_upload(data) {
            $.ajax({
                type: 'POST',
                url: 'http://tools.hai0.com/api/upload',
                data: {
                    base64Data: data
                },
                success: function (result) {
                    console.log(result);
                }
            })
        }
    });
});