---
layout: post
title: Y86指令集（模拟器篇-上篇）
abstract: 本篇介绍指令集模拟器的JIT编译实现。Y86出自《深入理解计算机系统》（CSAPP），是一个简化的、与x86相近的指令集，去除了x86中一些复杂的细节以用于教学。
tags: System Assembly Y86
---

Y86是一个极为简化的、用于教学的CPU指令集，[介绍篇](/2014/06/13/y86-instruction-set.html)中，我们介绍了Y86的体系结构及主要的指令。

我们的作业要求完成Y86的模拟器和汇编器。我们提交的实现必须与课程中提供的参照版实现有完全相同的行为，最后的分数由通过的测试case个数决定。<del>所以直接把各个case的结果print到输出文件也是可以的啦～</del>

对于模拟器，我没有使用课程给定的框架，而是从零开始搭建了一个使用[JIT编译技术](http://en.wikipedia.org/wiki/Just-in-time_compilation)——或者更准确地说是“动态字节码翻译”——的实现。

这份作业在[GitHub](https://github.com/hczhcz/y86/blob/master/y86sim.c)上有实作的代码。下面整理一些实现过程中的思路。

数据模型
---

我们需要模拟一块内存、一些寄存器和状态信息。由于是实现Y86机器码到原生x86机器码的翻译，我们还需要存储x86机器码（包括机器码尾部的地址，方便继续追加）以及一个额外的对应表用来记录Y86机器码到x86机器码的对应关系。

内存在初始状态下包含全部Y86字节码（默认从地址0开始），其余区域则填零。Y86有一个有趣的特性，`halt`指令编码为`00`，因此跳转到填零的地址时就会停机。

在实现中，除了八个通用寄存器，Y86模拟器的状态（PC、Flags、步骤数等）也被认为是“特殊的”寄存器。

由于模拟器的输出中需要比较初始状态和结束状态，因此需要留一份初始状态的内存备份。同样，寄存器也有一份备份。

模拟器运行过程中所需的数据大致如下：

{% highlight c linenos %}
typedef struct {
    Y_char bak_mem[...];
    Y_char mem[...];
    Y_word bak_reg[...];
    Y_word reg[...];
    Y_char x_inst[...];
    Y_addr x_end;
    Y_addr x_map[...];
} Y_data;
{% endhighlight %}

x86机器码
---

x86的机器码的编码方式出于实用考虑较为紧凑。一种常用的格式是：前缀/操作码+寄存器+整数，其中每个寄存器三个bit，剩下最高位的两个bit用来表示一些额外的信息。具体可以参考[这套表格](http://ref.x86asm.net/)。

在模拟器里，有三个函数用来写入x86机器码。它们分别向`x_inst`写入一个字节、一个32位整数和一个指针，并移动`x_end`。

翻译每条Y86指令之前，`x_end`会被记录到`x_map`中下标为当前Y86指令地址的元素内。

为了让机器码可以执行，`Y_data`的内存是直接用mmap分配的。这！是！在！偷！懒！哦！其实应该单独分配`x_inst`的。

{% highlight c linenos %}
// #include <sys/mman.h>

mmap(
    0, sizeof(Y_data),
    PROT_READ | PROT_WRITE | PROT_EXEC,
    MAP_PRIVATE | MAP_ANONYMOUS,
    -1, 0
);
{% endhighlight %}

然后跳转到`x_inst`里就能执行代码了。

环境切换
---

我们将执行Y86程序之前、之后的部分称为“外部环境”，包括载入文件、机器码翻译以及输出结果等过程，而将执行Y86程序本身（调用`x_inst`中的字节码）称为“内部环境”。其实还有个介于外部和内部的“中间环境”，用来检查步骤数和内存地址，以及帮助执行一些特殊的Y86指令，之后我们会进一步详解这个“中间环境”。

执行翻译后的程序会破坏所有的寄存器和Flags，因此模拟器在外部环境和内部环境之间切换的过程中，需要相应地保存、恢复它们。还好，x86提供了`pushal`、`popal`、`pushf`、`popf`这四个指令，我们可以很方便地完成这一切。

由于栈顶指针`ESP`破坏后无法用`popal`恢复，我们借用MMX寄存器来保存它的值。事实上，离开“外部环境”后，我们将大量使用MMX寄存器来暂存数据，以减少对通用寄存器的占用。

在切换过程以及“中间环境”中，`ESP`将会指向`Y_data`的`reg`数组中间，这样我们可以方便地将必要的信息写入数组。

`reg`数组的布局是：

{% highlight c linenos %}
yrl_edi = 0x0,
yrl_esi = 0x1,
yrl_ebp = 0x2,
yrl_esp = 0x3,
yrl_ebx = 0x4,
yrl_edx = 0x5,
yrl_ecx = 0x6,
yrl_eax = 0x7,
yr_cc  = 0x8, // Non-standard: Flags, ZF SF OF
yr_rey = 0x9, // Non-standard: Y return address
yr_rex = 0xA, // Non-standard: X return address
yr_pc  = 0xB, // Non-standard: Y inst pointer
yr_len = 0xC, // Non-standard: Y inst size
yr_sx  = 0xD, // Non-standard: Step max
yr_sc  = 0xE, // Non-standard: MM6: Step counter (decrease)
yr_st  = 0xF  // Non-standard: MM7: Stat
{% endhighlight %}

`yrl_edi`到`yrl_eax`是通过`pushal`保存的，`yr_cc`通过`pushf`保存。注意“yrl”的“l”表示“layout”，它和寄存器编号（`EAX`到`EDI`为0到7）的顺序正好相反。

`yrl_rex`和`yrl_rey`是执行位置的指针，用于环境切换。为了获得程序当前执行到的位置（`EIP`），我们使用`call`指令——它会将当前的`EIP`压栈。根据离开内部环境时的`EIP`和对应表`x_map`，我们就能推算出Y86中`PC`的值。每次从外部环境进入内部环境前后，都会有一个`EIP`与`PC`之间的转换过程。

状态码
---

Y86标准的状态有：正常（`AOK`）、停机（`hlt`）、错误（`adr`、`ins`）。

为了方便模拟器内部的信息交换，我将状态扩展到了11个，并且分别约定了状态码：

{% highlight c linenos %}
ys_aok = 0x0, // Started (running)
ys_hlt = 0x1, // Halted
ys_adr = 0x2, // Address error
ys_ins = 0x3, // Instruction error
ys_clf = 0x4, // Non-standard: Loader error
ys_ccf = 0x5, // Non-standard: Compiler error
ys_adp = 0x6, // Non-standard: ADR error caused by mem protection
ys_inp = 0x7, // Non-standard: INS error caused by mem protection
ys_ima = 0x8, // Non-standard: Memory access interrupt
ys_imc = 0x9, // Non-standard: Memory changed interrupt
ys_ret = 0xA  // Non-standard: Ret interrupt
{% endhighlight %}

[下篇](/2014/07/09/y86-instruction-set-simulator-2.html)中，我们将介绍“中间过程”的作用，以及模拟器对一些特殊的Y86指令的处理方式。
