---
---
// Posts
{% for post in site.posts %}
$("#posts").post(
    "{{ post.date | date: "%Y-%m-%d" }}",
    ["Blog", "{{ post.categories }}"],
    "{{ post.title }}",
    "{{ post.url }}",
    $("<p />").text("{{ post.abstract }}"),
    [[1, 1], [1, 1], [1, 2], [1, 2], [2, 1], [2, 2]]
);
{% endfor %}