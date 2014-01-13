// Extension of jQuery

jQuery.fn.extend({
    random: function() {
        return this.eq(Math.floor(Math.random() * this.length));
    },
    cutfx: function() {
        if (this.queue("fx").length > 1) {
            this.queue("fx", new Array(this.queue("fx")[0]));
        }
        return this;
    }
});

// Style

$(function() {
    // Background image

    $.backstretch([window.bgname]);

    // Bottom image

    var ib = $("<img />")
        .addClass("img_bottom")
        .attr("id", "img_bottom")
        .attr("alt", "")
        .appendTo("body");

    var iblast = 0; // 1->top 2->bottom

    ib.attr("src", window.ibname);

    var oldw = 0;
    var fixsize = function() {
        var neww = Math.max(
            Math.min(
                $(window).height() * 2,
                $(window).width()
            ), $(window).width() / 2
        );

        if (oldw !== neww) {
            ib.animate({
                width: neww,
                bottom: - neww / 9
            });
            oldw = neww;
        }
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
        if (
            $(window).scrollTop() + $(window).height() > $(document).height() - 32
        ) {
            gotop();
        } else {
            gorun();
        }
    }

    // Events
    ib
        .mouseenter(gotop)
        .mouseleave(gobottom)
        .load(function() {
        // Start up animation
            gotop();
            gobottom();
        });

    $(window)
        .scroll(gobottom)
        .resize(gobottom);

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
});
