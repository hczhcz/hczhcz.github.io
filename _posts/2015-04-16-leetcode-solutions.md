---
layout: post
title: LeetCode解题报告（第一篇）
abstract: LeetCode是一个在线题库，收录了面试中常见的技术类题目。本文对LeetCode中的一些题目进行讨论。
tags: Algorithm Leetcode
---

[LeetCode](https://leetcode.com/)是一个在线题库，收录了面试中常见的技术类题目，题目的方向涵盖算法、数据库、Shell等。我前几天用闲暇时间在LeetCode上刷了些题，于是写一篇博客来讨论其中比较有趣的题目。

Two Sum
---

这道题要求在一个（可能非常大的）数组中找到两个特定的数，它们的和为`target`。

例如，数组为`[5, 7, 9, 1, 12]`，且`target`为10，那么找到的数就应该是9和1。

题目要求返回两个数的索引（从1开始），也就是3和4。

一开始看到这道题<del>（成龙：我是拒绝的）</del>，想到了暴力搜索。但是题目中存在数据规模非常大的测试case，会导致超时。换句话说，我们必须在`O(n log n)`甚至`O(n)`的时间内解决这道题。

### 双指针

一种容易想到的做法是，先对数组进行排序，然后使用两个指针（考虑到这是一个数组，使用索引和指针皆可），分别从头部和尾部开始，扫描数组，逐渐收拢。

按照上例，排序得`[1, 5, 7, 9, 12]`；先将两个指针分别指向1和12，和为13，大于`target`，因此将指向12的指针向左移动到9；1和9和为10，和`target`相等；找到这两个数在原数组中的索引即可。

### 使用集合/字典/哈希表

还有另一种做法，先将数组中的全部元素放进一个集合，然后以索引`i`遍历数组，在集合中查找`target - num[i]`，再还原出另一个数的索引`j`：

{% highlight python linenos %}
def twoSum(self, num, target):
    nset = set(num)
    for i in range(len(num)):
        if (target - num[i]) in nset:
            # get j
            # ...
            return [i + 1, j + 1]
{% endhighlight %}

也可以直接把`nset`改为字典，在其中保存索引`j`。

但这时会遇到一个问题，如果遇到某个数恰好是`target`的一半，那么它加上它自己也会被当作结果。我们需要确保两个索引`i`和`j`不等。还好这并不复杂，只需要在还原索引`j`时稍加处理。完整的代码如下：

{% highlight python linenos %}
def twoSum(self, num, target):
    nset = set(num)
    for i in range(len(num)):
        if (target - num[i]) in nset:
            for j in range(i + 1, len(num)):
                if num[i] + num[j] == target:
                    return [i + 1, j + 1]
{% endhighlight %}

Three Sum Closest
---

这道题是“Two Sum”的加强版，要求在数组中找到三个数，它们的和最接近`target`。这一回不需要返回索引，返回三数之和就可以了。

我们可以再次拿出“Two Sum”的解法，只不过这次是四个数：数组中的三个数，以及`target`和三数之和的距离——`delta = abs(target - sum)`。

一种简单的处理方式如下：

1. 建立一个空字典；
2. 用`O(n^2)`的时间，以数组中两数之和为key、两数中靠后者的索引为value，在字典中添加条目；
3. 用`O(n * delta)`的时间，借助字典搜索`target +- delta - num[k]`，且`k`，返回`target +- delta`。

第三步中需要注意，由于`delta`的大小是不确定的，我们把它放在外层循环，`delta`的数值从0开始递增。相应地，内层循环负责遍历数组。

用C++写的，代码框架如下，实现细节就不贴上来了：

{% highlight c++ linenos %}
for (int i = 0; i < num.size() - 2; ++i) {
    for (int j = i + 1; j < num.size() - 1; ++j) {
        set_value_in_dict(num[i] + num[j], j);
    }
}

for (int delta = 0; true; ++delta) {
    for (int k = 0; k < num.size(); ++k) {
        if (k >= find_from_dict(target + delta - num[k])) {
            return target + delta;
        }
        if (k >= find_from_dict(target - delta - num[k])) {
            return target - delta;
        }
    }
}
{% endhighlight %}

sum类的题目还有其它变体，但整体上思路差别并不大。

Excel Sheet Column Title
---

这道题比较简单，但题目本身让我眼前一亮。它要求把一个整数转换成Excel的列名：

{% highlight text linenos %}
1 -> A
2 -> B
3 -> C
...
26 -> Z
27 -> AA
28 -> AB
{% endhighlight %}

需要注意，这并不是一般的进制转换（尽管很像）。我们考虑列名的长度与整数的关系：

* 一个字母可以表示`26^1 = 26`个数，即`1`到`26`；
* 两个字母可以表示`26^2 = 676`个数，即`1 + 26 = 27`到`26 + 26^2 = 702`；
* N个字母可以表示`26^N`个数，即`1 + 26 + 26^2 ... + 26^(N-1)`到`26 + 26^2 ... + 26^N`。

换一种角度观察，列名的每个位置除了可以是`A`到`Z`之外，还有一个`empty`的状态。当列名长度恰好不足以让某个位置出现字母时，这个位置保持在`empty`状态，它右边的字母进行循环；而列名长度能够使这个位置出现字母以后，这个位置进入字母循环。

例如从右数第二个位置，在整数为`1`到`26`时，这个位置为`empty`，整数到达`27`之后，这个位置上的字母以`A`到`Z`循环。因此，这个位置在整个循环过程中：`empty -> A -> B ... -> Z -> A -> B ...`。

因此，这道题和进制转换的不同之处在于，我们要从整数中扣除这个`empty`占用的额外的值。

这次换JS：

{% highlight javascript linenos %}
var convertToTitle = function(n) {
    var s = '';
    while (n !== 0) {
        n -= 1;
        s = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[n % 26] + s;
        n = Math.trunc(n / 26);
    }
    return s;
};
{% endhighlight %}
