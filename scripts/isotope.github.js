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
                result[item].language ? ["GitHub", result[item].language] : ["GitHub"],
                result[item].name,
                result[item].html_url,
                $("<p />")
                    .html(
                        result[item].description
                        + "</br>" + "[W " + result[item].watchers_count + "]"
                        + " "     + "[S " + result[item].stargazers_count + "]"
                        + " "     + "[F " + result[item].forks_count + "]"
                        + "</br>" + "[Size " + result[item].size + "]"
                        + "</br>" + "[Issue " + result[item].open_issues_count + "]"
                    ),
                [[1, 2], [2, 1], [2, 2]],
                false
            );
        }
    }
});
