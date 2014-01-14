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
});
