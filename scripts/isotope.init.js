var size_x = 200;
var size_y = 120;

// Post list (div)
var posts = $("<div />")
    .addClass("posts")
    .attr("id", "posts")
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
            .addClass("post")
            .width(size_x * size[0])
            .height(size_y * size[1])
            .appendTo(this);

        // Inner
        var pcdiv = $("<div />")
            .addClass("postcontent")
            .appendTo(pdiv);

        var pca = $("<a />")
            .addClass("postlink")
            .appendTo(pcdiv);

        // Inner link
        if (link !== undefined && link !== "") {
            pca.attr("href", link);

            pcdiv.hover(
                // Effect
                function() {
                    $(this).fadeTo(100, 0.8);
                },
                function() {
                    $(this).fadeTo(400, 1);
                }
            );
        }

        // Items
        if (date !== undefined && date !== "") {
            $("<p />")
                .text(date)
                .addClass("postdate")
                .appendTo(pca);
        }

        if (title !== undefined && title !== "") {
            $("<h3 />")
                .text(title)
                .addClass("posttitle")
                .appendTo(pca);
        }

        detail.appendTo(
            $("<div />")
                .addClass("postdetail")
                .appendTo(pca)
        );

        if (categories !== undefined && categories.length > 0) {
            pca.css("bottom", "28px");
            var cdiv = $("<div />")
                .addClass("postcategories")
                .appendTo(pcdiv);

            // To make a closure
            var ajaxicon = function(iconname, iconurl) {
                // Check if icon exists
                $.ajax({
                    type: "HEAD",
                    url: iconurl,
                    success: function() {
                        $("<img />")
                            .addClass("categoryicon")
                            .attr("src", iconurl)
                            .appendTo(cdiv);
                    },
                    error: function() {
                        $("<div />")
                            .addClass("categorytext")
                            .text(iconname)
                            .appendTo(cdiv);
                    }
                });
            }

            for (var item in categories) {
                ajaxicon(categories[item], "/icons/" + categories[item] + ".png");
            }
        }

        this.isotope("insert", pdiv);

        return this;
    }});
