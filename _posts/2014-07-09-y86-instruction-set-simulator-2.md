---
layout: post
title: Y86指令集（模拟器篇-下篇）
abstract: 本篇介绍指令集模拟器的JIT编译实现。Y86出自《深入理解计算机系统》（CSAPP），是一个简化的、与x86相近的指令集，去除了x86中一些复杂的细节以用于教学。
tags: System Assembly Y86
---

接[上篇](/2014/06/30/y86-instruction-set-simulator.html)，我们从“中间环境”开始，分析模拟器实现中一些关键的部分。

中间环境与单步循环
---

中间环境中，`ESP`指向`reg`数组，换一种说法就是`reg`数组的一部分变成了运行时栈。这个部分如下：

{% highlight c linenos %}
yr_cc  = 0x8, // Non-standard: Flags, ZF SF OF
yr_rey = 0x9, // Non-standard: Y return address
yr_rex = 0xA  // Non-standard: X return address
{% endhighlight %}

需要切换到中间环境时，执行如下代码。其中`MM1`存储内部环境的`ESP`而`MM2`指向`reg[yr_rex]`。

{% highlight asm linenos %}
movd %esp, %mm1
movd %mm2, %esp
call (%esp)
{% endhighlight %}

从中间环境返回内部环境后，只需要从`MM1`中还原`ESP`就可以继续程序的执行了。

中间环境中执行的代码，首先是记录Flags，并保存`EAX`中的值，以便之后的代码使用这个寄存器：

{% highlight asm linenos %}
y86_check:
    pushf
    movd %eax, %mm3
{% endhighlight %}

然后检查位于`MM7`的状态码。如果状态是`ys_aok`（正常运行），那么继续，否则跳转到之后的代码，按状态码进行相应的处理：

{% highlight asm linenos %}
y86_check_1:
    movd %mm7, %eax
    testl %eax, %eax
    jnz y86_int
{% endhighlight %}

然后是存储在`MM6`的步骤数。为了方便计算，我们从步骤总数（`yr_sx`）开始，每执行一步减1，到0时就应该退出了：

{% highlight asm linenos %}
y86_check_2:
    movd %mm6, %eax
    decl %eax
    movd %eax, %mm6
{% endhighlight %}

最后，还原`EAX`和Flags，返回内部环境：

{% highlight asm linenos %}
y86_call:
    movd %mm3, %eax
    popf
    ret
{% endhighlight %}

另外，代码库中有一个[“max版”](https://github.com/hczhcz/y86/blob/master/y86sim_max.c)，在`y86sim.c`的基础上去除了中间环境。“max版”执行Y86程序时的性能几乎和对应的原生x86程序相同，不过它不能按步数停机，也不包含内存地址等的检查。

特例
---

在程序执行过程中，会出现一些特殊的情形，是翻译后的x86程序无法直接处理的：

* 访问不存在的内存地址，抛出地址错误；
* 写入到不存在的内存地址；
* 写入Y86机器码，修改程序自身；
* `ret`指令跳转到不存在或没有被翻译过的地址。

因此，遇到上面这些情形时，程序会通过一些特殊的状态码来标记它们，并暂时离开Y86的执行过程（从内部环境切换到中间环境、外部环境）。

在实现中，前两个情形可以合并，即“内存地址合法性检查”。我们为它分配了一个状态码`ys_ima`。

它发生在需要访问内存的指令`rmmovl`、`mrmovl`、`pushl`、`popl`、`call`执行前：

{% highlight asm linenos %}
y86_int_ima:
    movd %mm4, %eax
    andl $Y_MASK_NOT_MEM, %eax
    jnz y86_int_brk
    xorl %eax, %eax
    movd %eax, %mm7
    jmp y86_call
{% endhighlight %}

第三个情形对应状态码`ys_imc`，模拟器为了方便实现，又加了一条约定，认为Y86机器码只存在于内存中靠前部的区域。

对于在Y86机器码范围内进行的写入，我们需要切换到外部环境中处理。

它发生在`rmmovl`、`pushl`、`call`执行后：

{% highlight asm linenos %}
y86_int_imc:
    movd %mm4, %eax
    cmpl 16(%esp), %eax
    jg y86_check_2
    jmp y86_fin
{% endhighlight %}

在外部环境中，会重新把修改后的Y86指令翻译成x86机器码，然后继续程序的执行。

我们对`ret`指令分配一个单独的状态码`ys_ret`。遇到`ret`指令时，程序会直接切换到外部环境，用普通的模拟器的方式执行这条指令。

指令翻译
---

计算、数据移动等指令会被直接翻译为对应的x86指令。

跳转指令会将跳转目标压入中间环境的堆栈中，然后借用环境切换过程完成跳转。“max版”中是直接跳转。

涉及内存访问和堆栈操作的指令需要对地址加上或减去`mem`数组的偏移。为了避免破坏Flags，地址运算主要通过`lea`指令完成。

“max版”中的`call`和`ret`直接使用x86的指令，在停机后再将内存、寄存器中所有`x_inst`地址范围内的值转换成对应的Y86机器码地址。这个实现是不严谨的，但实际使用中很少产生问题。

还有一个很容易被忽视的细节。

在指令翻译中，需要注意Y86机器码是有分割歧义的。这很像中文分词——“中外科学名著作品大全”如果从第二个字开始解读，就会变成“外科/学名/著作品/大全”，这也是通顺的。

> 说到中文的分割，我不禁想起了书名最后一个字被遮住的那本——
>
> ![《动词大词##》](/images/2014-07-09-dcdc.jpg)
>
>《动词大词典》……（图片来源：@蓝雪枫）

我们来看一个Y86中的例子，从位置0、1、2、3、4开始，机器码可以代表完全不同的指令序列：

{% highlight text linenos %}
70 00 20 20 10
^ jmp 0x10202000
   ^ nop ; mov %edx, %eax ; hlt
      ^ mov %edx, %eax ; hlt
         ^ mov %ecx, %eax
            ^ hlt
{% endhighlight %}

因此我们需要借助`x_map`来解决这个问题。

翻译程序每次遇到跳转到未知地址的`jmp`指令，都会将`x_map`标记为一个特殊的值。一段程序翻译完成后会扫描一遍`x_map`，如果存在被标记的还没有翻译的位置，就会继续从这个位置开始翻译。如果翻译过程中遇到了`x_map`已经存在的地址（也就是已经翻译的），则会直接插入一个跳转并结束翻译。

遇到错误指令时，考虑到指令并不一定会被执行到，因此会就地插入一个类似`halt`的指令并返回错误对应的状态码。这样，只有执行到相应位置时，程序才会返回错误状态。

模拟器的实现中还有更多的细节，限于篇幅就不详细梳理了。有兴趣的读者可以到GitHub仓库查看[模拟器和汇编器的实现代码](https://github.com/hczhcz/y86)。
