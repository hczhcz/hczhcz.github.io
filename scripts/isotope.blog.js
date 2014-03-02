---
---
// Posts
{% for post in site.posts %}
$("#posts").post(
    "{{ post.date | date: "%Y-%m-%d" }}",
    ["Blog", {% for tag in post.tags %}"{{tag}}"{% if forloop.last == false %}, {% endif %}{% endfor %}],
    "{{ post.title }}",
    "{{ post.url }}",
    $("<p />").text("{{ post.abstract }}"),
    [[1, 2], [1, 2], [2, 1], [2, 2]]
);
{% endfor %}