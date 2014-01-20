var username = "hczhcz";

$("#posts").post(
    "",
    [],
    "",
    "https://github.com/" + username,
    $("<img />")
        .addClass("bigicon")
        .attr("src", "/icons/GitHub_big.png"),
    [[1, 2]]
);

$("#posts").post(
    "",
    ["RSS"],
    "",
    "/rss.xml",
    $("<img />")
        .addClass("bigicon")
        .attr("src", "/icons/Feed_big.png"),
    [[1, 2]]
);

$("#posts").post(
    "",
    ["Atom"],
    "",
    "/atom.xml",
    $("<img />")
        .addClass("bigicon")
        .attr("src", "/icons/Feed_big.png"),
    [[1, 2]]
);
