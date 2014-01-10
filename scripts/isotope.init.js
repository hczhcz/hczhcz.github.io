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
                if (date !== undefined && date !== "") {
                    return date;
                } else {
                    return $("#posts").find(".postdate").random().text();
                }
            },
            title: function(item) {
                title = $(item).find(".posttitle").text();
                if (title !== undefined && title !== "") {
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
        if (link !== undefined && link !== "") {
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
        if (date !== undefined && date !== "") {
            $("<p />")
                .text(date)
                .attr("class", "postdate")
                .appendTo(pcdiv);
        }

        if (title !== undefined && title !== "") {
            $("<h3 />")
                .text(title)
                .attr("class", "posttitle")
                .appendTo(pcdiv);
        }

        detail.appendTo(
            $("<div />")
                .attr("class", "postdetail")
                .appendTo(pcdiv)
        );

        if (categories !== undefined && categories.length > 0) {
            pcdiv.css("bottom", "34px");
            var cdiv = $("<div />")
                .attr("class", "postcategories")
                .appendTo(pdiv);

            for (var item in categories) {
                $("<img />")
                    .attr("class", "categoryicon")
                    .attr("src", "/icons/" + categories[item] + ".png")
                    .attr("alt", categories[item])
                    .appendTo(cdiv);
            }
        }

        this.isotope("insert", pdiv);

        return this;
    }});
