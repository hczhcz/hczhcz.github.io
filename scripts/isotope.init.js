var size_x = 200;
var size_y = 120;

var hastagprefix = "hastag";

var tagset = {};
var tagmode = {};

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
                var date = $(item).find(".postdate");
                if (date.length > 0) {
                    return date.text();
                } else {
                    return $("#posts").find(".postdate").random().text();
                }
            },
            title: function(item) {
                var title = $(item).find(".posttitle");
                if (title.length > 0) {
                    return title.text();
                } else {
                    return $("#posts").find(".posttitle").random().text();
                }
            }
        }
    })
    .appendTo("#content");

// To add data
jQuery.fn.extend({post: function(date, tags, title, link, detail, sizes, highlight) {
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
        .addClass(highlight ? "postcontentx" : "postcontent")
        .appendTo(pdiv);

    var pca = $("<a />")
        .addClass("postlink")
        .appendTo(pcdiv);

    var addtag = function(tagname, pdiv) {
        if (!tagset[tagname]) {
            var filterdiv = $("<div />")
                .text(tagname)
                .addClass("button")
                .click(function() {
                    var thistag = $(this).text();
                    if(tagmode[thistag] === 1) {
                        tagmode[thistag] = 2;
                        $(this).fadeTo(100, 0.6);
                    } else if (tagmode[thistag] === 2) {
                        tagmode[thistag] = 0;
                        $(this).fadeTo(100, 1);
                    } else {
                        tagmode[thistag] = 1;
                        $(this).fadeTo(100, 0.8);
                    }

                    posts.isotope({
                        filter: function() {
                            for (var item in tagmode) {
                                var hastag = $(this).hasClass(hastagprefix + item);
                                if (tagmode[item] === 1 && !hastag) {
                                    return false;
                                } else if (tagmode[item] === 2 && hastag) {
                                    return false;
                                }
                            }

                            return true;
                        }
                    });
                })
                .appendTo("#filters");

            $("#filters").isotope("insert", filterdiv);
        }

        pdiv.addClass(hastagprefix + tagname);

        tagset[tagname] = true;
    }

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

        // addtag(date.substr(0, 7), pdiv);
        addtag(date.substr(0, 4), pdiv);
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

    if (tags !== undefined && tags.length > 0) {
        pca.css("bottom", "28px");
        var cdiv = $("<div />")
            .addClass("posttags")
            .appendTo(pcdiv);

        // To make a closure
        var ajaxicon = function(iconname, iconurl) {
            // Check if icon exists
            $.ajax({
                type: "HEAD",
                url: iconurl,
                success: function() {
                    $("<img />")
                        .addClass("tagicon")
                        .attr("src", iconurl)
                        .appendTo(cdiv);
                },
                error: function() {
                    $("<div />")
                        .addClass("tagtext")
                        .text(iconname)
                        .appendTo(cdiv);
                }
            });
        }

        for (var item in tags) {
            ajaxicon(tags[item], "/icons/" + tags[item] + ".png");

            addtag(tags[item], pdiv);
        }
    }

    this.isotope("insert", pdiv);

    return this;
}});
