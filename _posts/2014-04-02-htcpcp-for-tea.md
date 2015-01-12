---
layout: post
title: 用来泡茶的超文本咖啡壶控制协议
abstract: IETF发布了超文本咖啡壶控制协议（HTCPCP）的续篇——HTCPCP-TEA，在HTCPCP的基础上定义了一套控制茶壶的协议。
tags: Humor Internet IETF
---

HTCPCP
---

每年愚人节，除了喜闻乐见的整人活动外，我还会期待一件有趣的事情，那就是IETF（互联网工程任务组）已经持续二十多年的[愚人节恶搞RFC](http://en.wikipedia.org/wiki/April_Fools%27_Day_Request_for_Comments)发布。

往年恶搞RFC的经典作品包括[Telnet随机丢<del>节操</del>数据](https://tools.ietf.org/html/rfc748)、[使用鸟类进行通信的IPoAC协议](https://tools.ietf.org/html/rfc1149)、[无限猴子协定组](https://tools.ietf.org/html/rfc2795)、[TCP封包心情选项](https://tools.ietf.org/html/rfc5841)等。其中，IPoAC协议在1999年有了[续篇](https://tools.ietf.org/html/rfc2549)。

而1998年发布的[超文本咖啡壶控制协议HTCPCP](https://tools.ietf.org/html/rfc2324)由于其深深戳中了程序员的笑点……呃……以及[实际需求](http://compsci.ca/blog/death-by-coffee-whats-your-programming-drink/)，成为了最具影响力的恶搞RFC之一。爱好者在Emacs上将HTCPCP实现为一个[脚本](http://www.emacswiki.org/emacs/CoffeeMode)，并制造出了各种各样的兼容HTCPCP的咖啡壶。甚至有一个被称为WC3（Web-Controlled Coffee Consortium）的组织在持续维护着这个协议。

I'm a teapot
---

HTCPCP协议定义了两个错误，它们分别是`406 Not Acceptable`和`418 I'm a teapot`。“I'm a teapot”（我是一只小茶壶）出自一首美国儿歌。

在RFC文档中，错误418的定义是：

> Any attempt to brew coffee with a teapot should result in the error code "418 I'm a teapot". The resulting entity body MAY be short and stout.

有人为此做了一个[茶壶服务器](http://error418.org/)：

![The Error-418 Teapot](/images/2014-04-02-error-418.jpg)

HTCPCP-TEA
---

今年（2014年）愚人节，IETF发布了HTCPCP的续篇——[RFC7168](https://tools.ietf.org/html/rfc7168)。文档的标题是“The Hyper Text Coffee Pot Control Protocol for Tea Efflux Appliances (HTCPCP-TEA)”，在HTCPCP的基础上定义了一套控制茶壶的协议。

我们能用不同的URI发送`message/teapot`数据包，让支持HTCPCP-TEA的茶壶泡不同的茶，例如：

{% highlight text linenos %}
/darjeeling
/pot-0/earl-grey
/pot-1/pappermint
...
{% endhighlight %}

而如果我们试图让茶壶煮咖啡，它可能返回`503 Service Unavailable`以表示暂时煮不了咖啡，或者仍然返回`418 I'm a teapot`以表示这个茶壶对咖啡彻底无能为力。

另外，文档指出，HTCPCP-TEA主要针对电热水壶，因此通常是不设防火墙的；协议可以用于烧水的壶。因此……我们使用这个协议时需要注意防火防盗防2B，切勿将电热水壶放在灶台上烧。

IETF
---

IETF全称Internet Engineering Task Force，负责开发互联网标准、解决互联网发展过程中产生的技术问题。不同于一般的国际组织，它是网友自发组成、管理的，任何人都可以加入其中。

> We reject kings, presidents and voting. We believe in rough consensus and running code.

RFC即Request for Comments，是IETF维护的标准文档。RFC文档一经发布就不会再作修改，因此产生RFC的过程是非常严谨的，通常需要邮件列表中反复的讨论。愚人节的恶搞RFC作为IETF的一项传统，是RFC诞生过程的一个特例。尽管如此，它们仍具有很高的品质（除了内容千奇百怪以外）。今年愚人节的另一个恶搞RFC是[The NSA Certificate Extension](https://tools.ietf.org/html/rfc7169)。
