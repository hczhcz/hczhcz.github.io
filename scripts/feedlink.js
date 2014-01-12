$("<link />")
    .attr("rel", "alternate")
    .attr("type", "application/rss+xml")
    .attr("href", "/rss.xml")
    .appendTo($("head"));

$("<link />")
    .attr("rel", "alternate")
    .attr("type", "application/atom+xml")
    .attr("href", "/atom.xml")
    .appendTo($("head"));
