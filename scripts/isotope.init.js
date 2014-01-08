var size_x = 200;
var size_y = 160;

// Post list (div)
var posts = $("<div />")
    .attr("id", "posts")
    .attr("class", "posts")
    .isotope({
        layoutMode: "masonry",
        masonry: {
            columnWidth: size_x
        },
        isFitWidth: true,
        itemSelector: ".post",
        sortBy: "date",
        sortAscending: false,
        getSortData: {
            date: ".postdate"
        }
    })
    .appendTo("#content");

    // To add data
    jQuery.fn.extend({post: function(date, title, detail, sizes) {
        // Choose one from the size list
        var size = sizes[Math.floor(Math.random() * sizes.length)];

        // Outer
        var pdiv = $("<div />")
            .attr("class", "post")
            .width(size_x * size[0])
            .height(size_y * size[1])
            .appendTo(this);

        // Inner
        var pcdiv = $("<div />")
            .attr("class", "postcontent")
            .appendTo(pdiv);

        $("<p />")
            .text(date)
            .attr("class", "postdate")
            .appendTo(pcdiv);

        $("<p />")
            .text(title)
            .attr("class", "posttitle")
            .appendTo(pcdiv);

        var ddiv = $("<div />")
            .attr("class", "postdetail")
            .appendTo(pcdiv);

        detail.appendTo(ddiv);

        this.isotope("insert", pdiv);

        return this;
    }});
