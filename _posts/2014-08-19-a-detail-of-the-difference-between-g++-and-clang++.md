---
layout: post
title: gcc和clang之间的一个细节差异
abstract: gcc和clang这两款编译器在应对一段错误的c++代码时采取了两种不同的应对策略。
tags: C++ Compiler Assembly
---

事情要从[Wikipedia上的一段代码](http://en.wikipedia.org/wiki/Placement_syntax)说起：

{% highlight c++ linenos %}
#include <cstdlib>
#include <iostream>

struct A {};
struct E {};

class T {
public:
    T() {
        throw E();
    }
};

void *operator new(std::size_t, const A &) {
    std::cout << "Placement new called." << std::endl;
}

void operator delete(void *, const A &) {
    std::cout << "Placement delete called." << std::endl;
}

int main() {
    A a;
    try {
        T * p = new (a) T;
    } catch (E exp) {
        std::cout << "Exception caught." << std::endl;
    }
    return 0;
}
{% endhighlight %}

编译后运行，提示：`illegal hardware instruction (core dumped)`。

当时我想，这不科学啊，Wikipedia毕竟不同于那些《21天学会XXX》，如果包含错误的代码，很大概率地会被其他读者看到并且修正，一定是我打开方式不对。而且诡异的是，出错提示上竟然写着instruction，这在使用编译器生成的程序中是十分罕见的。

检查了编译这段代码用的命令，用了clang++，于是本着[撞大运编程](http://coolshell.cn/articles/2058.html)的精神，换成g++。运行结果正确。

另外，clang++对重载的new操作符没有返回值给了一个警告，而g++没有。

考虑到代码不长，直接删去输出之类的部分，很快定位到了问题所在，正是那个没有返回值的new操作符。

{% highlight c++ linenos %}
void *operator new(unsigned long) {} // here!

int main() {
    new int;
    return 0;
}
{% endhighlight %}

对于这个new，g++产生了一个空的函数：

{% highlight asm linenos %}
_Znwm:
	pushq	%rbp
	movq	%rsp, %rbp
	movq	%rdi, -8(%rbp)
	popq	%rbp
	ret
{% endhighlight %}

而clang++用一条错误指令`ud2`（undefined），强行让程序抛出错误：

{% highlight asm linenos %}
_Znwm:
	pushq	%rbp
	movq	%rsp, %rbp
	movq	%rdi, -16(%rbp)
	ud2
{% endhighlight %}

为了进一步探究，我们对上面那个程序稍作改动：

{% highlight c++ linenos %}
void *xxx() {}

int main() {
    int *a = (int *) xxx();
    *a = 1;

    return 0;
}
{% endhighlight %}

g++仍然一声不吭地编译通过，程序在对`*a`赋值时报出segmentation fault，而clang++仍然产生illegal instruction。

此时我忽然想到了，莫非clang对所有缺失return的代码都会产生错误？我们做得更彻底一些：

{% highlight c++ linenos %}
int mian() {}
int main() {mian();}
{% endhighlight %}

果然还是illegal instruction！我们可以发现，`mian`函数包含`ud2`指令，而`main`函数并不包含。这可能是因为现存太多没有在`main`中显式地返回状态码的程序。

带返回值的函数没有return，在标准中是未定义的行为。对于未定义行为，不同的编译器可以采取不同的措施，可以沉默处理，可以警告，可以产生编译时或运行时的错误，甚至可以[运行一个游戏](http://feross.org/gcc-ownage/)。

clang（clang++）的做法值得欣赏，更快地出错意味着对错误的定位会更加容易，许多新兴的语言、编译器都认可了这个观点。当然，gcc（g++）不这样做，或许有兼容c/c++早期代码的考虑。这从一个侧面体现了两款编译器在设计思路上的不同。

顺带一提，还有一个有意思的细节，clang的输出如果覆盖了原有的文件，那么它的可执行属性会被强制覆盖，但gcc对可执行属性采取的策略是只添加不去除。
