var iblast = 0; // 1->top 2->bottom

var ib = $("<img />")
    .addClass("img_bottom")
    .attr("id", "img_bottom")
    .attr("alt", "")
    .appendTo("body");

ib.attr("src", window.ibname);

var tbenable = false;

var tbupdate = function() {
    if (
        $(window).scrollTop() + $(window).height() === $(document).height()
        &&
        $(window).scrollTop() > 0
    ) {
        tbenable = true;
    }

    if (tbenable) {
        tb.cutfx().animate({
            "height": ib.height()
        }, 800, "easeOutBounce");
    } else {
        tb.cutfx().animate({
            "height": 0
        }, 800, "easeOutBounce");
    }
}

var tb = $("<div />")
    .addClass("div_bottom")
    .attr("id", "div_bottom")
    .appendTo("body");

$("<div />")
    .addClass("div_bottom_shadow")
    .attr("id", "div_bottom_shadow")
    .appendTo(tb);

var isbuttom = function() {
    return tbenable || $(window).scrollTop() + $(window).height() > $(document).height() - ib.height();
}

var oldw = 0;
var fixsize = function() {
    var neww = Math.max(
        Math.min(
            $(window).height() * 2,
            $(window).width()
        ), $(window).width() / 2
    );

    if (oldw !== neww || (ib.queue("fx").length == 0 && ib.width() !== neww)) {
        if (isbuttom()) {
            ib
                .cutfx()
                .animate({
                    width: neww,
                    bottom: 0
                });
        } else {
            ib
                .cutfx()
                .animate({
                    width: neww,
                    bottom: - neww / 9
                });
        }
        oldw = neww;
    }

    $("body").cutfx().animate({
        "padding-bottom": ib.height()
    });

    tbupdate();
}

var gotop = function() {
    if (iblast !== 1) {
        ib
            .cutfx()
            .animate({bottom: 0}, fixsize);
        iblast = 1;
    }
}

var gorun = function() {
    if (iblast !== 2 || ib.queue("fx").length === 0) {
        ib
            .cutfx()
            .animate({bottom: - ib.height() / 2}, fixsize)
            .animate({bottom: - ib.height() / 3}, fixsize);
        iblast = 2;
    }
}

var gobottom = function() {
    if (isbuttom()) {
        gotop();
    } else {
        gorun();
    }
}

var tboff = function() {
    tbenable = false;
    tbupdate();
    gobottom();
}

// Events
ib
    .mouseenter(gotop)
    .mouseleave(gobottom)
    .click(function() {
        tbenable = true;
        tbupdate();
    })
    .load(function() {
        // Start up animation
        gotop();
        gobottom();
    });

tb
    .mouseleave(tboff);

$("#base")
    .click(tboff);

$(window)
    .scroll(tboff)
    .resize(gobottom);

window.setInterval(fixsize, 1000);

// Skip if shift is held
var checkshift = function(event) {
    if (event.shiftKey || event.ctrlKey || event.altKey) {
        ib.css("pointer-events", "none");
    } else {
        ib.css("pointer-events", "auto");
    }
}

$(document)
    .keydown(checkshift)
    .keyup(checkshift);
