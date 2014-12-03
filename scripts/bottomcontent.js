var buttombox = $("<div />")
    .addClass("buttom_inner")
    .appendTo("#div_bottom");

$("<div />")
    .addClass("filters")
    .attr("id", "filters")
    .isotope({
        isOriginLeft: false,
        layoutMode: "fitRows",
        itemSelector: ".button",
        sortBy: "tag",
        sortAscending: true,
        getSortData: {
            tag: function(item) {
                return $(item).text();
            }
        }
    })
    .appendTo(buttombox);

$("<div />")
    .addClass("links")
    .attr("id", "links")
    .isotope({
        layoutMode: "fitRows",
        itemSelector: ".button2",
        sortBy: "tag",
        sortAscending: true,
        getSortData: {
            tag: function(item) {
                return $(item).text();
            }
        }
    })
    .appendTo(buttombox);

$("<h1 />")
    .addClass("bgtext1")
    .text("Filters")
    .appendTo("#div_bottom");

$("<h1 />")
    .addClass("bgtext2")
    .text("Links")
    .appendTo("#div_bottom");

$(function () {
    function addLink(text, link) {
        var linkdiv = $("<div />")
            .text(text)
            .addClass("button2")
            .click(function () {
                location.href = link;
            })
            .appendTo("#links");

        $("#links").isotope("insert", linkdiv);
    }

    addLink("Azard", "http://azard.me/");
    addLink("breeswish", "https://breeswish.org/blog/");
    addLink("飞龙", "http://www.flygon.net/");
    addLink("测测", "http://gaocegege.com/Blog/");
    addLink("Kim Leo", "http://blog.kimleo.net/");
    addLink("neutronest", "http://www.dc-fpml.org/");
    addLink("Tim", "http://wuzhiwei.net/");
    addLink("zacks", "http://scriptogr.am/zacks/");
    addLink("Z-Shang", "http://z-shang.github.io/");
    addLink("左晗君", "http://35d6a7.lofter.com/");
})
