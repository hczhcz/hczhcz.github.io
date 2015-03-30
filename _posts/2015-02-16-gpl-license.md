---
layout: post
title: 透明桌面与GPL
abstract: “透明桌面”被指抄袭开源软件，在GitHub上引发了不少的争议，其中涉及不少对于开源许可证GPL的讨论。本文讨论“透明桌面”事件，以及与之相关的GPL代码使用问题。
tags: GNU FSF License
---

不久前，一个“获得了国家科学一等奖”的[远程桌面项目](https://github.com/iiordanov/remote-desktop-clients)火了。考虑到有关部门在此之前已经为相关事宜进行了罕见的[跨有关部门高层次喝茶行动](http://www.ccf.org.cn/sites/ccf/xhdtnry.jsp?contentId=2843770996539)，这篇博文并不是关于获奖一事本身的，而是关注其中的“透明桌面”事件。

事件回顾
---

“透明桌面”被指抄袭的事件起于KraneSun在GitHub上发出的一个[项目issue](https://github.com/iiordanov/remote-desktop-clients/issues/39)。

在项目issue的评论中，排除大量的娱乐、吐槽成份，我们能看到一些关于GPL许可证的讨论——

> @zhsj: It's not shamed to copy the code from BVNC. It's shamed not to republish his code in GPL and even not to mention anything about BVNC.

> @akfish: But according to my preliminary research on GPL license, the only thing Zhang Yaoxue did wrong is that he did not acknowledge copyright owner's rights.

项目中使用了[GPLv2](https://github.com/iiordanov/remote-desktop-clients/blob/master/LICENSE-bVNC)和[GPLv3](https://github.com/iiordanov/remote-desktop-clients/blob/master/LICENSE-Opaque)，而“透明桌面”项目组并未公开项目的源代码，却将整套系统声称为他们的研究成果（截至该issue被贴出之前）。这遭致了广泛的非议。

项目原作者Iordanov的<del>获奖感言</del>回复中，也着重强调了遵循授权许可及尊重他人工作的重要性：

> It is very important for credit to be given when using other people's work, and it is also of great importance to republish source code when distributing software build from GPL source code!

随后，“透明桌面”项目组承认了他们使用开源代码，声称他们将“在合适的时机”发布源代码。项目组负责人解释道，“这是一种合法的使用，也是软件行业公认的一种合理使用”。

与此同时，也有人提到，GPL要求软件发布时附带源代码，而公开视频或申报科研成果并不涉及到“发布”这一行为，似乎他们的行为并没有过失。

那么，“透明桌面”项目组究竟是否需要公开源代码呢？如果他们永远不向公众发放软件，是否仍然需要公开源代码呢？这并不是一个那么容易回答的问题。

GPL虽然是开源软件中最常用的授权许可证之一，但作为开发者的我们很少会仔细阅读它，而只是大概记得一些内容。GPL许可证比其它常见的许可证（如MIT、BSD）复杂许多，因此我们有必要了解更多。

GPL许可证
---

GPL全称“GNU通用公共授权”，主要目的在于保证软件发布与修改的自由。这一点正好与一般的软件最终用户授权（禁止修改、禁止发布衍生版）相反，于是有了“Copyleft”的概念——通过著作权的手段来确保自由。

### 授权

“授权”意味着GPL负责定义“用户能做什么”。

授权之外的一切行为，在没有特殊规定的情况下，都是禁止的。在“无授权”的状态下（例如GitHub上没有列出License的项目），即使代码本身是公开的，原则上用户也不能使用它。

当然，还有一种情况称为“公有领域”，这些代码通常是早已公开，或者被作者放弃一切权利的，任何人都可以使用。

> [WTFPL（《你他妈想干嘛就干嘛公共许可证》）](http://en.wikipedia.org/wiki/WTFPL)是一个类似于公有领域的许可证。

GPL不允许改变授权方式，也就是说，程序可以从一些更宽松的许可证（例如MIT）转换为GPL，但不能从GPL转换为其它许可证。

### 适用范围

GPL许可证适用于对程序的复制、发布、修改行为。程序包括源码及编译后的可执行文件。

GPL通常不涉及使用程序创作的作品（例如用GIMP创作的图像）。但如果程序的输出内容是程序自身的衍生品，那么GPL仍然适用。

### 使用

用户可以自由使用GPL程序。但是GPL授权是无担保的，程序作者并不对使用程序带来的后果负责。

### 复制与发布

依照GPL复制、发布程序时，需要：

1. 以GPL授权，并提供GPL许可证文本；
2. 提供完整、可读的源码，或者，提供价格不超过发布成本（例如光碟成本）的源码获取方式。

我们有时候会看到，一些开源软件开放下载的同时会提供光碟版购买渠道，这是GPL鼓励的。

### 修改

依照GPL修改程序，且构成著作时，需要：

1. 标上修改记录、日期；
2. 对修改后的程序整体依照GPL授权；
3. 在交互式程序（如果有，例如REPL程序）的开头输出授权信息。

因此，“透明桌面”项目组如果决定不向任何人发布软件，他们可以不公开源代码。但同时，他们使用的开源代码著作权属于原作者，他们对bVNC、remote-desktop-clients原有的代码不能主张GPL没有列出的权利，例如申请专利，以及骗钱……哦不对，评选奖项等。

不过，国内有许多违反GPL的案例，影响比“透明桌面”严重得多，而且不乏大公司参与。有人感叹道：

> @Frank-KunLi: It is a universal phenomenon that using the GPL source code and not distributing the new code public in China.
