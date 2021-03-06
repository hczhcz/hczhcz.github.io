---
layout: post
title: 计算机是如何算出1+1=2的
abstract: 在知乎问题“如何通俗的解释计算机是如何实现1+1=2计算的？”中我的答案，稍加修改作为博客。
tags: Hardware Zhihu
---

原载于[如何通俗的解释计算机是如何实现1+1=2计算的？](http://www.zhihu.com/question/29707696/answer/45469968)

以下正文——前方卖萌预警！前方卖萌预警！

Part 1
---

首先，你在键盘上依次按下了`1 + 1 <enter>`。

键盘上的电路触点被接通。键盘主控芯片此时在不停地、依次地检测各个触点两端是否导通，于是它发现了按键。按照预先烧录的程序，它在向USB线上发送的电信号中写入一个数字，告诉线另一头的庞然大物：“有键被按下了！”

信号内容——

{% highlight text linenos %}
左边的ctrl没按 左边的shift没按 左边的alt没按 左边的win没按 右边的ctrl没按 右边的shift没按 右边的alt没按 右边的win没按
啦啦啦啦啦啦啦啦
按了“1”键
别的没按
别的没按
别的没按
别的没按
别的没按
{% endhighlight %}

USB线的另一头连着电脑。电脑上的USB控制器读到了信号，把它转交给CPU（对，就是[灯等灯等灯](http://en.wikipedia.org/wiki/Sound_trademark)生产的那个）。CPU暂时停下了手上的工作，运行了操作系统中的一小段程序，把按键记录了下来。

我们知道，CPU的动作很快，它总是马不停蹄地忙活各种不同的事，并在这些事之间来回切换。终于，它开始处理这个按键了。CPU上运行着操作系统，操作系统看到你按了键，于是找到了你正在操作的计算器程序。按照事先的约定，操作系统告诉CPU，“你去关心下计算器吧，它处理按键的程序在这里”。

计算器中的一段程序开始运行。它读出按键`1`，记了下来。它告诉图形库，“给我在屏幕上显示`1`”。

图形库照着做了，它通知操作系统“在计算器的窗口上用这个字体、这个字号画上`1`”。操作系统找到了负责绘制GUI（不是“鬼”）的模块，一个点一个点地把`1`画了出来：

{% highlight text linenos %}
白黑白
黑黑白
白黑白
白黑白
白黑白
黑黑黑
{% endhighlight %}

就这样，屏幕上依次显示出了`1+1`。

Part 2
---

当计算器读到回车的时候，它知道自己摊上大事了。

计算器想起自己读过`1`，加号，还有另一个`1`。它想——加号是个低优先级的二元运算符（就是两块钱做一次的运算符（误）），那么它两边应该有两个“东西”，这两个“东西”可以是数字，也可以是另一个运算符和一些“东西”。

稍等。我们在描述一个“东西”的时候用到了“里边一层”的“东西”。对，这就是[递归](/2015/04/27/how-does-the-computer-calculate-1-plus-1.html)。

回来——计算器瞧了一眼，发现加号两边都是数字。它分析道，“这是要做一个加法的节奏啊”。

> 关于电脑如何读懂更复杂的表达式，可以参考[调度场算法](/2014/02/27/shunting-yard-algorithm.html)。

它把之前拿到的左边的1和右边的1取了出来。我们要感谢`1+1`，它足够简单。如果换作`11+11`，计算器还需要把高位的`1`乘以十，再加上低位的`1`。哦，计算器并不知道这些，它会老老实实地读出每一位数字。

Part 3
---

然后，计算器告诉CPU——

你快给我算出来：`加法，这个数（左边的1），那个数（右边的1）`。

* 在程序猴子们的视角下，这是一条长这样的指令：`add %rcx, %rdx`。
* 在电脑的视角下，这是一条长这样的指令：`010010000000000111001010`。

CPU看到这条指令，很快明白了要做的事，把之前计算器获得的两个数`000...01`和`000...01`放到了用于计算的电路上。

（什么？好多0和1？你们不知道这是二进制嘛！）

数字在电路上走着走着，来到了一段叫ALU的电路里。当然，数字有好多好多好多二进制位，我们可以认为各个位是并排地走在好几条（电）路上的。

首先，末尾的两个小1经过了几道门，它们变成了小1（进位）和小0（当前位），然后进位的小1又和倒数第二位的两个小0擦出了激情的火花，变成了小0（进位）和小1（当前位），进位的小0和倒数第三位的两个小0变成小0（进位）和小0（当前位），进位的小0和倒数第四位的两个小0变成小0（进位）和小0（当前位），……

啊，这样写下去节bian4奏cheng2不xiao3太huang2对wen2了呀。

> 这里描述的是一个朴素的加法器——用逻辑门（二进制位运算）逐个算出进位，依次计算每一位的结果。
>
> 但这样的效率是很低的，因为高位的计算要等低位的进位算出来之后才能继续。事实上，现代的CPU里普遍会使用进位预测器。
>
> [Kogge–Stone adder](http://en.wikipedia.org/wiki/Kogge%E2%80%93Stone_adder)是一种实用的加法器。它将整个计算过程分为`O(log(n))`层，在各层中，进位信息分别从低位向高位传播`1, 2, 4, 8, ...`位。
>
> 下面是用软件实现的Kogge-Stone加法器：

{% highlight python linenos %}
# input a, b

g = a & b
p = a ^ b
g = p & (g << 1) | g
p = p & (p << 1 | 0b1)
g = p & (g << 2) | g
p = p & (p << 2 | 0b11)
g = p & (g << 4) | g
p = p & (p << 4 | 0b1111)

sum = a ^ b ^ (g << 1)
{% endhighlight %}

> 在硬件实现中，位运算对应各种逻辑萌…哦不对，逻辑门；而位移，直接把电路接上就可以了。为了避免电路的规模过大，有时会将预测器和朴素方法混合使用。

总之，它们最终变成了`000...10`。当两个1的基情结晶从ALU的另一头出来的时候，计算结果就产生了。

计算器说，“好，再把`2`显示出来吧”。于是它再次找到了图形库，把结果画在了屏幕上。

{% highlight text linenos %}
白黑白白白白白白白黑白
黑黑白白白黑白白黑黑白
白黑白白黑黑黑白白黑白
白黑白白白黑白白白黑白
白黑白白白白白白白黑白
黑黑黑白白白白白黑黑黑
白白白白白白白白白白白
白白白白白白白白白黑白
白白白白黑黑黑白黑白黑
白白白白白白白白白白黑
白白白白黑黑黑白白黑白
白白白白白白白白黑白白
白白白白白白白白黑黑黑
{% endhighlight %}

我们得到了`2`。
