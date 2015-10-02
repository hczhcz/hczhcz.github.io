var username = "gblym";

$("#posts").post(
    "",
    [],
    "",
    "https://github.com/" + username,
    $("<img />")
        .addClass("bigicon")
        .attr("src", "/icons/GitHub_big.png"),
    [[1, 2]],
    true
);

$("#posts").post(
    "",
    ["RSS"],
    "",
    "/rss.xml",
    $("<img />")
        .addClass("midicon")
        .attr("src", "/icons/Feed_mid.png"),
    [[1, 1]],
    true
);

$("#posts").post(
    "",
    ["Atom"],
    "",
    "/atom.xml",
    $("<img />")
        .addClass("midicon")
        .attr("src", "/icons/Feed_mid.png"),
    [[1, 1]],
    true
);
