---
---
// Posts
{% for post in site.posts %}
$("#posts").post(
    "{{ post.date | date: "%Y-%m-%d" }}",
    "{{ post.title }}",
    $("<a href='{{ post.url }}'>test</a>"),
    [[1, 1]]
);
{% endfor %}