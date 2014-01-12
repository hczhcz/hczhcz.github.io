var username = "hczhcz";

$("#posts").post(
    "",
    [],
    "",
    "https://github.com/" + username,
    $("<img />")
        .attr("class", "bigicon")
        .attr("src", "/icons/GitHub.png"),
    [[1, 2]]
);
