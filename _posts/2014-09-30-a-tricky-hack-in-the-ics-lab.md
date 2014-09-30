---
layout: post
title: 论如何用不正确的方式刷Lab
abstract: 在“计算机系统基础”的上机作业（Lab）中，我们需要优化一段Y86汇编程序，现在问题来了——
tags: Assembly Y86 Binary
---

问题
---

嗯，问题当然不是[“挖掘机技术哪家强”](http://www.lxjx.cn)。

在ICS Lab7的最后一个Part中，我们需要做这样两件事：

1. 优化一个[Y86指令集](/2014/06/13/y86-instruction-set.html)流水线模拟器，这部分不是本文的主角；
2. 优化一段Y86汇编程序`ncopy.ys`，程序需要将一段内存（32位整数数组）复制到另一个位置，并且统计其中有多少个正数。

这个Part的最终目的是，使`ncopy.ys`处理一个整数所需的平均时钟周期数最少。

常规策略
---

首先，我们可以在指令集模拟器中实现`iaddl`和`leave`这两条指令。实现思路不复杂，`iaddl`相当于`irmovl`的读取过程搭配`addl`的运算过程，而`leave`相当于将`%ebp`指向的地址作为栈顶执行`pop %ebp`。仿照相关指令的实现方式，稍加修改后填上就可以了。

我们可以在指令集模拟器中做更多的优化，比如细化判断条件，做数据转发，改进分支预测，以去除一些不必要的bubble（流水线暂停）。这里不展开讲了。

下面来说说Y86汇编程序。

`ncopy`的原版长这样：

{% highlight asm linenos %}
ncopy:
    pushl %ebp
    rrmovl %esp, %ebp
    pushl %esi
    pushl %ebx
    pushl %edi

    mrmovl 8(%ebp), %ebx    # src
    mrmovl 16(%ebp), %edx   # len
    mrmovl 12(%ebp), %ecx   # dst

    xorl %eax, %eax     # count = 0;
    andl %edx, %edx     # len <= 0?
    jle Done            # if so, goto Done:

Loop:
    mrmovl (%ebx), %esi # read val from src
    rmmovl %esi, (%ecx) # store val to dst
    andl %esi, %esi     # val <= 0?
    jle After           # if so, goto After:
    irmovl $1, %edi
    addl %edi, %eax     # count++

After:
    irmovl $1, %edi
    subl %edi, %edx     # len--
    irmovl $4, %edi
    addl %edi, %ebx     # src++
    addl %edi, %ecx     # dst++
    andl %edx, %edx     # len > 0?
    jg Loop             # if so, goto Loop:

Done:
    popl %edi
    popl %ebx
    popl %esi
    rrmovl %ebp, %esp
    popl %ebp
    ret
{% endhighlight %}

头和尾暂时不看，程序中有两个关键的部分。其一，是`Loop`节，这一节直接关系到整个程序的性能；其二，是`After`节，也有一定的优化空间。

我们先从最简单的开始，把`iaddl`指令用上：

{% highlight asm linenos %}
Loop:
    mrmovl (%ebx), %esi # read
    rmmovl %esi, (%ecx) # store
    andl %esi, %esi     # val <= 0?
    jle After           # if so, goto After:
    iaddl $1, %eax      # count++

After:
    iaddl $-1, %edx     # len--
    iaddl $4, %ebx      # src++
    iaddl $4, %ecx      # dst++
    andl %edx, %edx     # len > 0?
    jg Loop             # if so, goto Loop:
{% endhighlight %}

循环展开：

{% highlight asm linenos %}
Loop(n-1):

...

Loop2:
    mrmovl 8(%ebx), %esi
    rmmovl %esi, 8(%ecx)
    andl %esi, %esi
    jle Loop1
    iaddl $1, %eax

Loop1:
    mrmovl 4(%ebx), %esi
    rmmovl %esi, 4(%ecx)
    andl %esi, %esi
    jle Loop
    iaddl $1, %eax

Loop0:
    mrmovl (%ebx), %esi
    rmmovl %esi, (%ecx)
    andl %esi, %esi
    jle After
    iaddl $1, %eax
{% endhighlight %}

对于循环展开，需要考虑到余项问题。例如，如果展开规模为每个大循环16小节，那么当输入长度为21时，就会有5个“余项”。

我们可以手写一个类似[Duff设备](http://en.wikipedia.org/wiki/Duff%27s_device)的结构，也可以把余项放在单独的switch结构里。由于Y86指令集里没有乘除、余数指令，我们一般把展开规模定为2的阶乘，然后对数组长度`len`做mask，用加法将结果乘以4（Y86的整数是32位的，它的字长相当于四个字节）得到偏移，查找跳转表来实现跳转。

`index = len & mask`

`addr = *(jump_table + index + index + index + index)`

> 顺带一提，Duff设备除了循环展开之外，还有一个非常有（毁）意（三）思（观）的用途是[实现coroutine](http://coolshell.cn/articles/10975.html)。

然后，观察每个`Loop`小节，我们发现时间的浪费主要在两个地方，其一是`mrmovl`与`rmmovl`之间的bubble，其二是`jle`分支预测错误产生的回退负担。

可以用条件数据移动代替jump：

{% highlight asm linenos %}
Loop0:
    mrmovl (%ebx), %esi
    rrmovl %eax, %edi       # edi = count
    rmmovl %esi, (%ecx)
    iaddl $1, %edi          # edi = count + 1
    andl %esi, %esi         # val <= 0?
    cmovg %edi, %eax        # if so, apply the new value
{% endhighlight %}

还有一种办法，把两个`Loop`小节合并到一块。这样更快，但是对于循环余项，需要做另外的处理。

{% highlight asm linenos %}
Loop1:
    mrmovl 4(%ebx), %esi    # second
    mrmovl 0(%ebx), %edi    # first
    rmmovl %esi, 4(%ecx)    # second
    rmmovl %edi, 0(%ecx)    # first

    andl %esi, %esi         # second
    jle Loop
    iaddl $1, %eax

Loop0:
    andl %edi, %edi         # first
    jle After
    iaddl $1, %eax
{% endhighlight %}

除了循环之外，程序的其它部分也有一定的优化空间，但本文中不进一步展开了。<del>不是这篇文章的重点嘿嘿，你来打我呀～</del>

来点黑科技
---

考虑到每多处理一个整数平均只需要5.x个时钟周期（注：Y86的世界观里，内存访问是极快的），循环中可优化的空间似乎已经所剩不多。但是，有些事情就是那样万万没想到。

现在提供一条秘密情报（误），输入的数据尽管有正有负，它们的绝对值都不大，而且都不是0。测试数据的格式其实是`1, 2, -3, -4, 5...`，当然，如果更彻底地黑数据，就不那么有趣了。

你猜，我们可以如何利用这条信息？

给点提示，如果Y86支持二进制移位`shr`，我们可以利用符号扩展将整数变成0或-1，这样能省去了判断符号的步骤——先把数组长度赋值给结果，然后在遇到负数时利用符号扩展得到的-1不断将结果减小，最终得到正数个数。但是Y86并不包含这样的指令。等等……虽然不能做移位，但是可以移字节不是嘛！

举个例子，整数-3的二进制表示是`11111101 11111111 11111111 11111111`，只要数的绝对值够小，高16位就会是全0或全1。那么向后看两个字节，就能得到`11111111 11111111 ???????? ????????`。尽管这个数的高16位我们并不知道，这并不妨碍我们利用低16位，只要在最后将运算结果mask一下，轻松搞定。

{% highlight asm linenos %}
ncopy:
    ...
    rrmovl %edx, %eax       # count = len;
    ...

...

Loop0:
    mrmovl 0(%ebx), %esi    # read val
    mrmovl 2(%ebx), %edi    # read sign
    rmmovl %esi, 0(%ecx)    # store val
    addl %edi, %eax         # count += (val > 0) ? 0 : -1

...

Fin:
    ...
    irmovl $0xffff, %ecx    # load mask 
    andl %ecx, %eax         # apply the mask
    ...
{% endhighlight %}

现在，每多处理一个整数会消耗4个时钟周期。而比较显然的是，整数需要一读一写这两项内存操作，无法回避，正数也需要用指令来统计，3个时钟周期几乎是理论极限了。现在问题来了，这能做到吗？

答案是可以，至少近似地可以。

熟悉Y86流水线的你可能你会想，Y86的内存读取在计算之后呀，单个时钟周期怎么做到又取出符号又把它加到结果中呢？

不，要换个思路，我们可以把取数据和取符号合并到一起。只需要不对齐地读写内存就可以了。例如复制三个整数，正常的做法是：`[0-3] [4-7] [8-11]`，而`[0-3] [2-5] [6-9] [8-11]`就是接下来要用的做法。尽管麻烦一些，但是我们可以直接读出原先整数的高位了。

而不对齐读写内存的耗时还是和原来一样——没有bubble时每个时钟周期都能执行一次。这再次印证了，Y86的内存访问能力有多么不科学。

下面上代码，为了避免bubble，还需要将读写过程交错一下：

{% highlight asm linenos %}
...

Loop3:
    addl %edi, %eax
    mrmovl 10(%ebx), %edi   # read between src[2] and src[3]
    rmmovl %esi, 14(%ecx)

Loop2:
    addl %esi, %eax
    mrmovl 6(%ebx), %esi
    rmmovl %edi, 10(%ecx)   # store data

Loop1:
    addl %edi, %eax         # count the sign
    mrmovl 2(%ebx), %edi
    rmmovl %esi, 6(%ecx)

...
{% endhighlight %}

对于头部和尾部，我们需要这样处理：

{% highlight asm linenos %}
Loop15:
    mrmovl 60(%ebx), %edi   # read the tail
    mrmovl 62(%ebx), %esi   # read sign of src[15]
    rmmovl %edi, 60(%ecx)   # store the tail
    mrmovl 58(%ebx), %edi   # read between src[14] and src[15]

...

Loop0:
    addl %esi, %eax
    mrmovl 0(%ebx), %esi    # read the head
    rmmovl %edi, 2(%ecx)

    rmmovl %esi, 0(%ecx)    # store the head
    addl %edi, %eax         # count the sign
{% endhighlight %}

我们还需要为余项写一些额外的入口，它们和`Loop15`小节类似。

另外，处理数据的头尾两端时，需要使用额外的指令，效率还是低了些，对于余项较少的情形，我们可以做专门的优化。

完整的Y86代码可以在[这里](https://github.com/hczhcz/trick-n-trick/blob/master/ncopy_1.ys)找到。
