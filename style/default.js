$(function(){
    $.backstretch([
        "bgimages/" + Math.floor(Math.random() * 20) + ".jpg"
    ]);

    $("#img_bottom").realshadow({
        followMouse: true,
        color: '255, 255, 255',
        type: 'drop'
    });
});
