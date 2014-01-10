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
            date: function(item) {
                date = $(item).find(".postdate").text();
                if (date !== "" && date !== undefined) {
                    return date;
                } else {
                    return $("#posts").find(".postdate").random().text();
                }
            },
            title: function(item) {
                title = $(item).find(".posttitle").text();
                if (title !== "" && title !== undefined) {
                    return title;
                } else {
                    return $("#posts").find(".posttitle").random().text();
                }
            }
        }
    })
    .appendTo("#content");

    // To add data
    jQuery.fn.extend({post: function(date, categories, title, link, detail, sizes) {
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
        }

        if (title !== "" && title !== undefined) {
            $("<h3 />")
                .text(title)
                .attr("class", "posttitle")
                .appendTo(pcdiv);
        }

        var ddiv = detail.appendTo(
            $("<div />")
                .attr("class", "postdetail")
                .appendTo(pcdiv)
        );

        if (categories !== [] && categories !== undefined) {
            $("<p />")
                .text(categories)
                .attr("class", "postcategories")
                .appendTo(ddiv);
        }

        this.isotope("insert", pdiv);

        return this;
    }});
