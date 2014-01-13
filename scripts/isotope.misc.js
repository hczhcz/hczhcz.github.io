var username = "hczhcz";

$("#posts").post(
    "",
    [],
    "",
    "https://github.com/" + username,
    $("<img />")
        .addClass("bigicon")
        .attr("src", "/icons/GitHub.png"),
    [[1, 2]]
);
