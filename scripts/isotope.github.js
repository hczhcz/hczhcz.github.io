// Connect to GitHub

var username = "hczhcz";

function datefmt(value) {
    return value.substr(0, 10);
}

$.ajax({
    url: "https://api.github.com/users/" + username + "/repos",
    context: $("#posts"),
    dataType: "json",
    success: function(result) {
        for (var item in result) {
            this.post(
                datefmt(result[item].pushed_at),
                result[item].name,
                result[item].html_url,
                $("<p />")
                    .text(result[item].description),
                [[1, 1], [1, 1], [1, 1], [1, 2], [1, 2], [2, 1], [2, 2]]
            );
        }

        $("#posts").post(
            "",
            "",
            "https://github.com/" + username,
            $("<img />")
                .attr("class", "bigicon")
                .attr("src", "/icons/GitHub.png"),
            [[1, 2]]
        );
    }
});
