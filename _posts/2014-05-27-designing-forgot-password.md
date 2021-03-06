---
layout: post
title: “忘记密码”的场景与设计问题
abstract: 有用户登陆功能的网站通常包括用户密码（口令）验证，以及一些应对用户忘记用户名、密码的措施，与“忘记密码”相关的设计问题看似简单，但要理解透彻其实并不容易。
tags: Web Security Password
---

从网络上流传的一幅图说起——

![Forgot password](/images/2014-05-27-forgot-password.jpg)

<del>可怜的小明又一次中枪无数。</del>

带有“用户”（用户登陆）这个概念的网站，通常会包括用户密码（其实称为“口令”更准确）验证，以及一些用于应对用户忘记用户名、密码的措施，典型的例如重试密码、密码找回或重设。但是许多网站并没有正确地实现它们。

用户验证
---

网站的设计者通常会在用户验证的环节对暴力破解进行防范。此时，需要区分暴力破解和正常的密码输入错误。常见的方式包括限制重试次数和使用验证码。

限制重试次数是一种难以正确设计的功能。

一种典型的错误是，将次数限制所需的信息（已试次数）放在客户端，或者只与客户端的一些信息绑定。这个状况同样发生在一些投票或抽奖网站上——它们必须识别特定的访问者并限制他重复进行操作。我们只需要清除（甚至直接禁用）cookies等数据，就能突破限制。

以待验证的用户名来判断重试限制是另一个大坑。其一，蓄意破坏者可以不断输入错误的密码以将账户锁定；其二，这对于没有特定目标、只是想探测弱口令（123456）的攻击者来说毫无影响。通常，只有安全要求极高时，才适合使用这样的方法，例如银行会阻止你反复试密码。

而验证码也有值得注意的设计问题。

一方面在于验证码本身，一些验证码过度花哨（尤其是带彩色和动画的验证码），只会迷惑到人，那些“视觉干扰”却能给机器提供更多的破解线索。验证码这个话题如果要展开就得另外写篇博客了——还是去看看人家[reCAPTCHA](http://recaptcha.net)是怎么做的吧！

一方面是验证码出现的时机——既然验证码（CAPTCHA——人机区分全自动公开图灵测试）是为了验证操作者是人，那么就应该在非人操作者（如暴力破解密码的脚本）得逞之前出现，而不是在已经验证成功后再弹出并让你重新敲一遍键盘。虽然有些诡异，这种错误真实地出现过。

其实我们可以发现，没有能绝对地避免暴力破解、同时又不对正常使用产生任何影响的方式。相对折衷的办法是，使用一个设计合理的验证码、加大反复重试的成本（全局防守）。如果条件允许，可以要求反复重试密码者使用短信、邮件验证。

顺便补充一点，用户名的重复也是一个值得注意的问题。我在某个知名的邮箱网站注册过两个邮箱账户，分别在它的`.cn`和`.com`域名下。这两个账户的密码相同，结果我在试图登陆一个邮箱的时候，会进入另一个。现在，越来越多的网站不再以一个“名字”来区分用户，而是使用邮箱或手机识别用户，并允许用户使用昵称。这是一种更稳妥的做法。

密码重设
---

这一节的标题是“密码重设”，之所以不是“密码找回”……嗯，其实密码是找不回的。

无数次的[教训](http://zh.wikipedia.org/zh-cn/2011年中国网站用户信息泄露事件)告诉我们，明文密码是邪恶的，对称加密过的也是不行的，唯一合理的方式是使用Hash，而且必须是带盐的Hash（不然又可以通过[查表](http://www.cmd5.com)来攻击）。再考虑传输的问题，SSL能为安全的传输提供必要保障，除此之外，可以先在客户端做一层额外的Hash。

那么“密码重设”应该怎么做呢？这个问题并不简单。

本文开头的图中我们可以看到，那家网站采用了安全问题。事实上，很少有人在注册时会认真地填写安全问题——很烦啊！<del>比Doge还烦！</del>即使认真填写了，半角还是全角、数字还是汉字，也会给使用带来难度。

如果安全问题可以用于立即重设密码，它的地位就已经与密码相当。那么，安全问题的答案有没有被Hash呢？问题设计是否合理，以至于不能通过社交网络、在线简历搜到呢？

使用个人信息进行账户申诉也存在类似地问题，如果注册时没有认真填写过信息，或者这些信息可以被查到甚至伪造，那也会产生问题。

QQ早期的申诉功能带来了大量的假申诉，当然，现在我们看到了一些改进，例如借助用户登陆时的地理位置，以及好友辅助申诉。在一些社交网站的密码重设机制中，我们也能看到它们的影子。尽管仍然有攻击风险，例如通过社交网站跟踪地理位置、用小号加被攻击者为好友，但攻击的成本已经远高于以前了。

我们可以从腾讯给出的申诉建议看到他们判断申诉真伪的策略：

> 早期：邀请早期添加、经常联系的好友<br>
> 原始：提供尽量原始的密码等历史资料<br>
> 充分：多填，不确定的也填，填错没影响；多邀请好友，完成辅助才有效

另一种主要的思路是通过邮箱或手机重设密码。用户在网站上申请重设密码，然后通过注册时预留的邮箱地址或手机号验证自己的身份，回到网站并输入新的密码，完成密码重设。

这种方法近几年成为许多大型网站使用的主流方法。

在实现这个功能的时候，需要注意的是验证用户身份的方式。推荐的做法是使用一串单独的识别码，并且限制一定的有效期。对于邮件，还要注意邮件中的链接可能被邮箱服务商扫描，因此需要结合用户的其它信息（cookies或者ip地址）加以确认。

以及……防范蓄意破坏仍然十分重要，要避免反复发送邮件、短信；也要避免破坏者重设密码，结合邮件链接的问题，千万不要直接通过点击链接随机修改密码——嗯，曾经有网站干过这种事。

总体而言，用户密码并不是一个容易对付的东西，对于大多数网站，与其重造车轮，不如使用一套现有的、成熟的系统。
