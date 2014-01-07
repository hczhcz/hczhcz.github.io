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
            var obj = $("<div />")
                .attr("class", "post")
                .appendTo(this);

            $("<p />")
                .text(datefmt(result[item].pushed_at))
                .attr("class", "postdate")
                .appendTo(obj);

            $("<p />")
                .text(result[item].name)
                .attr("class", "posttitle")
                .appendTo(obj);

            this.isotope("insert", obj);
        }
    }
});
