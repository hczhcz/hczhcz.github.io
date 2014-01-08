---
---
// Posts
{% for post in site.posts %}
$("#posts").post(
    "{{ post.date | date: "%Y-%m-%d" }}",
    "{{ post.title }}",
    "{{ post.url }}",
    $(""),
    [[1, 1], [1, 1], [1, 1], [1, 2], [1, 2], [2, 1], [2, 2]]
);
{% endfor %}