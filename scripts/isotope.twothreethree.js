$.ajax({
    url: "/twothreethree.json",
    context: $("#posts"),
    dataType: "json",
    success: function(result) {
        for (var item in result) {
            this.post(
                result[item].date,
                result[item].title,
                result[item].link,
                $("<p />")
                    .text(result[item].text),
                [[1, 1], [1, 1], [1, 1], [1, 2], [1, 2], [2, 1], [2, 2]]
            );
        }
    }
});
