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
