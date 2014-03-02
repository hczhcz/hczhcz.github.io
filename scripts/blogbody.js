var bloghl = false;

$(".blog").click(function () {
    if (bloghl) {
        $(this).css({
            "background-color": "rgba(255, 255, 255, 0.6)"
        });
    } else {
        $(this).css({
            "background-color": "rgba(255, 255, 255, 0.8)"
        });
    }
    bloghl = !bloghl;
});
