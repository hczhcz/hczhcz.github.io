var size_x = 200;
var size_y = 120;

// Post list (div)
var posts = $("<div />")
    .attr("id", "posts")
    .attr("class", "posts")
    .isotope({
        layoutMode: "masonry",
        masonry: {
            columnWidth: size_x,
            isFitWidth: true
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
    jQuery.fn.extend({post: function(date, title, link, detail, sizes) {
        // Choose one from the size list
        var size = sizes[Math.floor(Math.random() * sizes.length)];

        // Outer
        var pdiv = $("<div />")
            .attr("class", "post")
            .width(size_x * size[0])
            .height(size_y * size[1])
            .appendTo(this);

        // Inner
        if (link !== "" && link !== undefined) {
            var pcdiv = $("<a />")
                .attr("class", "postcontent")
                .attr("href", link)
                .hover(
                    // Effect
                    function() {
                        $(this).fadeTo(100, 0.8);
                    },
                    function() {
                        $(this).fadeTo(400, 1);
                    }
                )
                .appendTo(pdiv);
        } else {
            var pcdiv = $("<a />")
                .attr("class", "postcontent")
                .appendTo(pdiv);
        }

        // Items
        if (date !== "" && date !== undefined) {
            $("<p />")
                .text(date)
                .attr("class", "postdate")
                .appendTo(pcdiv);
        } else {
            $("<input />")
                .text(this.find(".postdate").random().text())
                .attr("type", "hidden")
                .attr("class", "postdate")
                .appendTo(pcdiv);
        }

        if (title !== "" && title !== undefined) {
            $("<h3 />")
                .text(title)
                .attr("class", "posttitle")
                .appendTo(pcdiv);
        } else {
            $("<input />")
                .text(this.find("#posttitle").random().text())
                .attr("type", "hidden")
                .attr("class", "posttitle")
                .appendTo(pcdiv);
        }

        detail.appendTo(
            $("<div />")
                .attr("class", "postdetail")
                .appendTo(pcdiv)
        );

        this.isotope("insert", pdiv);

        return this;
    }});
