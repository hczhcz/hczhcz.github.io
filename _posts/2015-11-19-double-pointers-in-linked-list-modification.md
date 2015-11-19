---
layout: post
title: 使用二级指针操作链表
abstract: 在需要手工实现并优化链表的环境中，使用二级指针操作链表是一个实用的技巧。
tags: C System
---

现在的编程过程中，我们很少需要亲自动手实现链表这类数据结构，因为标准库（甚至语言本身）往往已经提供了相关的功能。

然而，对于底层的编程——尤其是系统编程而言，手工实现并优化一些底层的数据结构仍然是必要的。要知道，我们可能会面对一个无法使用动态语言、无法使用C标准库、即使是“hello, world”也要通过IO指令输出的环境。

本文将探讨手工实现的链表中，关于指针的一个小技巧。

通常的链表操作
---

（会看这篇博客的）大部分读者对链表都很熟悉了，基本概念略过。

我们定义一个简单的单向链表，包含一个整数作为内容：

{% highlight c linenos %}
struct node {
    struct node *next;
    int content;
};
{% endhighlight %}

就像教科书上写的那样，我们可以用一个指针，从头到尾访问整个链表：

{% highlight c linenos %}
void scan(struct node *head) {
    struct node *current = head;

    while (current) {
        // do something

        current = current->next;
    }
}
{% endhighlight %}

然后，我们实现一个简单的链表插入：

{% highlight c linenos %}
void insert(struct node *head, int index, struct node *node) {
    struct node *current = head;

    while (current) {
        --index;
        if (index == 0) {
            node->next = current->next;
            current->next = node;
            return;
        }

        current = current->next;
    }

    // error
}
{% endhighlight %}

Duang！不出所料，`insert(head, 0, node)`挂了。

我们发现，链表的第一个节点是特殊的。其它节点都是上一个节点的`->next`，唯独第一个节点是通过`head`指针传入的。而且需要注意的是，当`index`为`0`时，`head`指针本身就应该指向新插入的节点。

于是我们秉持着打那指哪的精神，应付了一下：

{% highlight c linenos %}
struct node *insert(struct node *head, int index, struct node *node) {
    // head
    if (index == 0) {
        node->next = head;

        return node;
    }

    // others
    struct node *current = head;

    while (current) {
        --index;
        if (index == 0) {
            node->next = current->next;
            current->next = node;
            return head;
        }

        current = current->next;
    }

    // error
}
{% endhighlight %}

这个方法也适用于在链表中删除节点。需要注意，如果要插入或删除多个节点，第一个`if`需要相应地改为循环。

但是，把代码写两遍，分开处理第一个节点和其它节点。这显然是一种坏味道。如果操作本身更复杂一些，例如根据`content`值来决定是否要删除，或者对链表节点进行排序，代码会变得更加复杂。

有几种可能的应对方式，一种是再写一个函数，把重复的代码包装起来；另一种是使用一个指针存放上一个`node`，有经验的“教科书式程序员”会选择这样做。

我们来看一个删除节点的例子：

{% highlight c linenos %}
struct node *remove(struct node *head, int value) {
    struct node *last = 0;
    struct node *current = head;

    while (current) {
        if (current->content == value) {
            struct node *next = current->next;

            free(current);
            current = next;

            if (last) {
                last->next = current;
            } else {
                head = current;
            }
        } else {
            last = current;
            current = current->next;
        }
    }

    return head;
}
{% endhighlight %}

这种实现对于通常的使用来说，已经足够。但把`last`和`head`割裂开的做法，对于追求完美的我们来说，还是不够[优雅](http://zh.moegirl.org/zh/%E8%A6%81%E4%BC%98%E9%9B%85%EF%BC%8C%E4%B8%8D%E8%A6%81%E6%B1%A1)。于是，请出本文的主角——二级指针。

使用二级指针
---

先不急着解决问题。我们观察`remove`函数的接口：

{% highlight c linenos %}
struct node *remove(struct node *head, int value);
{% endhighlight %}

在使用这个函数时，需要先传入`head`，然后再把返回值重新赋给`head`。换句话说，`head`在这里应该是一个可以被改写的参数。

这种可改写的参数，在Delphi里叫var参数，在C++里是传引用的参数。

在C里我们可以怎么做呢？对，二级指针：

{% highlight c linenos %}
void remove(struct node **head, int value) {
    struct node *last = 0;
    struct node *current = *head;

    while (current) {
        if (current->content == value) {
            struct node *next = current->next;

            free(current);
            current = next;

            if (last) {
                last->next = current;
            } else {
                *head = current;
            }
        } else {
            last = current;
            current = current->next;
        }
    }
}
{% endhighlight %}

仔细想想，`remove`函数对链表中指针的修改，无非是改`head`和改`last->next`这两种。`next`指针和`*head`指针其实是对称的。

这种对称关系可以用递归来展现：

{% highlight c linenos %}
void remove(struct node **head, int value) {
    struct node *current = *head;

    if (current) {
        if (current->content == value) {
            struct node *next = current->next;

            free(current);
            current = next;

            *head = current;

            remove(head, value);
        } else {
            remove(&current->next, value);
        }
    }
}
{% endhighlight %}

我们之所以可以用递归来处理链表，正是因为`next`和`*head`具有这种特殊的关系。一个链表可以看成另一个链表的头上插入一个元素。而用于表示那“另一个链表”的指针正好就是第一个元素的`next`指针。

递归中的`current`其实是多余的，可以直接用`*head`来代替：

{% highlight c linenos %}
void remove(struct node **head, int value) {
    if (*head) {
        if ((*head)->content == value) {
            struct node *next = (*head)->next;

            free(*head);
            *head = next;

            remove(head, value);
        } else {
            remove(&(*head)->next, value);
        }
    }
}
{% endhighlight %}

然后，我们把递归化成循环，就得到了简洁而一致的实现：

{% highlight c linenos %}
void remove(struct node **head, int value) {
    while (*head) {
        if ((*head)->content == value) {
            struct node *next = (*head)->next;

            free(*head);
            *head = next;
        } else {
            head = &(*head)->next;
        }
    }
}
{% endhighlight %}

当删除链表第一个节点的时候，`remove`函数会改写`*head`，使它指向第二个元素（即，第一个元素的`next`指向的节点）；而删除之后的节点的时候，被改写的则是上一个节点的`next`指针。

我们再来看看如何实现插入：

{% highlight c linenos %}
void insert(struct node **head, int index, struct node *node) {
    while (*head) {
        if (index == 0) {
            node->next = *head;
            *head = node;
            return;
        }
        --index;

        head = &(*head)->next;
    }
}
{% endhighlight %}

实现方法和`remove`大抵类似。

不用二级指针
---

二级指针还是有些抽象的，有没有一种几乎等价、但是更容易理解的实现方式呢？

答案是肯定的。

我们换一个角度思考——既然可以用`head`代替`last->next`，那我们也可以使用`last->next`来代替`head`。

方法很简单——建立一个空节点，作为虚拟的`last`节点，然后让`last->next`指向链表的第一个节点：

{% highlight c linenos %}
struct node last;
last->next = /* head of the linked list */;
{% endhighlight %}

用`last->next`代替之前的`*head`，来操作链表就可以了。代码差别不大：

{% highlight c linenos %}
void remove(struct node *last, int value) {
    while (last->next) {
        if (last->next->content == value) {
            struct node *next = last->next->next;

            free(last->next);
            last->next = next;
        } else {
            last = last->next;
        }
    }
}
{% endhighlight %}

这种虚拟节点对于双向链表来说非常方便。我们可以直接使用一个节点`entry`来保存头尾指针，即`entry->next`指向第一个元素，`entry->last`指向最后一个元素。

《操作系统》课的[JOS lab](https://github.com/hczhcz/jos)里，就出现了二级指针。这是本文的来由。因此我们用lab的方式结束本文：

> This completes the blog.
