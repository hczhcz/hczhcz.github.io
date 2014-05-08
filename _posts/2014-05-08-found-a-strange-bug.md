---
layout: post
title: 抓到了Splint的一只奇怪的bug
abstract: 在对C代码做lint的时候发现了一些奇怪的现象，导致Splint程序出错。
tags: C Splint Bug
---

先看一段还算正常的代码：

{% highlight c linenos %}
int (*f) ();
void g() {
    int n = f();
}
int main() {return 0;}
{% endhighlight %}

这段代码虽然没干什么事情，但也没什么严重的问题，用gcc和clang都能无警告编译通过。

它定义了一个函数指针`(*f) ()`。然后我们在函数`g()`中调用了`f()`，把返回值放进了`int n`。

用Splint过一遍，一个警告，因为`n`没有被使用。

然后我们要开始做一些<del>邪恶的</del>奇怪的事情了：

{% highlight c linenos %}
int (*(f)) ();
void g() {
    int n = (f());;
}
int main() {return 0;}
{% endhighlight %}

加了两对括号和一个额外的分号（空语句）。我们再编译一下，编译器仍然一声不吭。

比较它们的编译结果，发现完全相同，截取`g()`函数的编译结果：

{% highlight asm linenos %}
pushq   %rbp
movq    %rsp, %rbp
subq    $16, %rsp
movq    f(%rip), %rdx
movl    $0, %eax
call    *%rdx
movl    %eax, -4(%rbp)
leave
ret
{% endhighlight %}

但是Splint不干了：

{% highlight text linenos %}
Splint 3.1.2 --- 03 May 2009

constraintResolve.c:1517: at source point
test.c:4:2:
    *** Internal Bug at constraintResolve.c:1517: llassert failed:
    constraint_isDefined(c) [errno: 25]
     *** Please report bug to submit@bugs.debian.org (via reportbug) ***
       (attempting to continue, results may be incorrect)
constraint.c:1195: at source point
test.c:4:2:
    *** Internal Bug at constraint.c:1195: llassert failed:
    constraint_isDefined (c) [errno: 25]
     *** Please report bug to submit@bugs.debian.org (via reportbug) ***
       (attempting to continue, results may be incorrect)
*** Segmentation Violation
*** Location (not trusted): test.c:4:2
*** Last code point: transferChecks.c:4415
*** Previous code point: transferChecks.c:4002
*** Please report bug to submit@bugs.debian.org (via reportbug)
*** A useful bug report should include everything we need to reproduce the bug.
{% endhighlight %}

对代码再作一些调整，发现两对括号、一个分号必须都加上才会触发这个内部错误。

再尝试不同的修改，观察到Splint似乎把`f`看作了一个二阶的指针，于是解一层引用，内部错误消失了：

{% highlight c linenos %}
int (*(f)) ();
void g() {
    int n = ((*f)());;
}
int main() {return 0;}
{% endhighlight %}

是这样吗？

{% highlight c linenos %}
int (*(f)) ();
void g() {
    int n = (*f());;
}
int main() {return 0;}
{% endhighlight %}

错误还在。

一时半会推敲不出，作罢。

考虑到C的语法、语义中有许多复杂的细节，各个编译器（以及linter）会采用不同的实现方式（甚至会出错，就像上面的Splint那样），以后得更加小心。
