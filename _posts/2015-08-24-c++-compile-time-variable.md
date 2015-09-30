---
layout: post
title: C++编译时的“变量”（上篇）
abstract: 利用C++的函数重载选取机制以及SFINAE特性，我们可以在编译过程中实现变量的功能，即存储可修改的值。
tags: C++ Meta SFINAE
---

编译时的immutable
---

有人评价C++是<del>一门</del>“两门语言”。因为它除了C with Classes以外，还通过模板元编程等特性，在编译时提供了一门图灵完全的、独立于运行时的语言。

C++的模板元编程几乎是纯粹的函数式语言，它与C++中C的那部分风格迥异——我们可以在模板中看到递归（而非控制流）、模式匹配、记忆化和鸭子类型的影子。

当然，这就意味着模板元编程是鼓励immutable（不可变）的。我们不能重复定义模板，也不能在使用模板之后对模板进行特化。同样的事情发生在编译时的方方面面——我们不能随意修改类型、重新定义变量、blabla。immutable的特性意味着更大的安全性——如果仅仅改变了声明、定义的顺序，编译器就会产生另一个合法却有着不同行为的程序，那会带来不小的混乱。这是C++模板相较于从C继承来的宏的一大优势。

看起来严丝合缝？但是……C++偏偏在编译时机制中开了一道有趣的缺口。事情要从函数重载说起。

函数重载选取机制
---

C++支持函数重载是众所周知的，然而C++的重载机制比大多数人想象的都要复杂。

考虑表达式`f()`（注：这里不讨论宏）。

首先，我们要找到所有的`f`，包括：

* 当前作用域下的`f`函数（包括模板）；
* 来自其它作用域的，可达的`f`函数，包括上层、全局命名空间，以及`using`等情形；
* ADL规则确定的、各参数所在作用域可达的`f`函数；
* （如果在一个对象内）对象方法调用`this->f()`；
* 当前及其它作用域下的，变量`f`的`operator()`；
* 当前及其它作用域下的，变量`f`可隐式类型转换到的函数；
* 当前及其它作用域下的，到类型`f`的类型转换（构造）。

根据C++的惯例，`f`的寻找总是向前的。这一点在实现“编译时变量”的过程中会被用到。

根据上面找到的`f`所在的作用域等，编译器会推断这是一个函数调用、`operator()`调用，还是类型转换。然后，排除掉不可用的`f`（这里会涉及到下面将提到的SFINAE），即可得到备选`f`的集合。

从备选集合选出最终的重载函数的过程涉及到许多复杂的细节。这里只能给出一个大体的规则：

* 参数所需的隐式类型转换更优（层次更浅），则优先选取；
* 参数所需的标准类型转换（构造）更优，则优先选取；
* 优先选取非模板；
* 优先选取对参数的特化程度更高的模板。

SFINAE
---

SFINAE，即“Substitution Failure Is Not An Error”。

这是C++函数重载的一条规则。当某个函数名对应多个函数（函数模板），编译器会忽略那些无法代入的重载函数，而不报错。

举个例子，我们可以利用重载函数检测一个值是不是指针：

{% highlight c++ linenos %}
template <class T>
bool is_pointer(T *) {
    return true;
}

template <class Object, class T>
bool is_pointer(T Object::*) {
    return true;
}

template <class T>
bool is_pointer(T (*)()) {
    return true;
}

bool is_pointer(std::nullptr_t) {
    return true;
}

bool is_pointer(...) {
    return false;
}
{% endhighlight %}

向`is_pointer`传入一个`int *`时，编译器会忽略第二个重载（无法推导Object的类型）、第三个重载（不是函数指针）、第四个重载（不是`std::nullptr_t`）。

按照C++重载函数的选取顺序，第一个重载优于第五个重载，因此，调用后返回`true`。同理，我们可以用`is_pointer`来识别各种指针。

另外，C++11带来了一种新的玩法——表达式的SFINAE：

{% highlight c++ linenos %}
template <class T>
auto looks_like_pointer(T value) -> decltype(*value, true) {
    return true;
}

bool looks_like_pointer(...) {
    return false;
}
{% endhighlight %}

SFINAE十分有用，它不仅可以用来选择函数，还可以负责一些编译时的计算工作。如果上面的例子中，函数的返回不全为`bool`，而是分别为`float`和`double`，我们就能通过`sizeof`在编译时判断某个类型是不是指针。

SFINAE也可以用来检测某个类是否拥有特定的成员：

{% highlight c++ linenos %}
template <class T>
auto has_member1(T &value) -> decltype((void) value.member1) {
    // has T::member1
}
{% endhighlight %}

或者判断某个数的奇偶：

{% highlight c++ linenos %}
template<int I>
void is_even(int (&)[I % 2 == 0]) {
    // even
}

template<int I>
void is_even(int (&)[I % 2 == 1]) {
    // odd
}
{% endhighlight %}

C++11中提供了`std::enable_if`类，可以达到与上例类似的效果。

在[下篇](/2015/09/30/c++-compile-time-variable-2.html)中，我们将看到，如何利用函数重载选取机制和SFINAE来实现编译时的“变量”。
