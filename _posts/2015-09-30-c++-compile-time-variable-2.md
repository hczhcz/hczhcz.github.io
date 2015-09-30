---
layout: post
title: C++编译时的“变量”（下篇）
abstract: 利用C++的函数重载选取机制以及SFINAE特性，我们可以在编译过程中实现变量的功能，即存储可修改的值。
tags: C++ Meta SFINAE
---

[上篇](/2015/08/24/c++-compile-time-variable.html)中介绍了C++的函数重载中的一些细节。我们可以通过函数重载实现编译时的“变量”。

但是我们暂时不提函数重载，从头开始思考“变量”的实现方式。

上篇的开头提到，C++在编译时相当于是immutable的——定义了的东西不能再修改。

那如何达到“可变”这个目标呢？答案并不复杂——事实上我们并不需要直接修改某个定义，而是把修改后的定义追加在已有的定义之后，形成一个链状结构，然后找到这条链中最新的那个值。

模板？
---

最容易想到的方式是利用模板特化来实现这个链状结构（嗯，请假装不知道这样做是有问题的）：

{% highlight c++ linenos %}
template <int I>
struct Var {
    // import the variable from Var<I + 1>
};

template <>
struct Var<100> {
    // first version of the variable
};

template <>
struct Var<99> {
    // second version of the variable
};
{% endhighlight %}

我们可以在其中放一个值，也可以放一个类型。一种方便的做法是把一个值用类型包装起来：

{% highlight c++ linenos %}
template <int V>
struct IntWrapper {
    static constexpr int value = V;
};

template <int I>
struct Var {
    using Content = typename Var<I + 1>::Content;
};
// or just "struct Var: public Var<I + 1> {};"

template <>
struct Var<100> {
    using Content = IntWrapper<123>;
};

template <>
struct Var<99> {
    using Content = IntWrapper<456>;
};

void test() {
    std::cout << Var<0>::Content::value; // 456
}
{% endhighlight %}

直接使用`Var<I + 1>::Content`是一种简单粗暴的做法。一个变量只能改100次，而且要倒数，这多少有些不妥。

我们再稍稍改变`Var`的结构，去掉100的上限：

{% highlight c++ linenos %}
template <int I>
struct Var {
    using Content = void;
};

template <>
struct Var<0> {
    using Content = IntWrapper<123>;
};

template <>
struct Var<1> {
    using Content = IntWrapper<456>;
};
{% endhighlight %}

如何取得值呢？引入一个`FindValue`类（模板），进行递归搜索即可。

对于熟悉C++模板元编程的读者来说，这种做法应该并不陌生：

{% highlight c++ linenos %}
template <int I, class Current>
struct FindValue: public FindValue<
    I + 1, typename Var<I + 1>::Content
> {};

template <int I>
struct FindValue<I, void>: public Var<I - 1>::Content {};

void test() {
    std::cout << FindValue<0, Var<0>>::value;
}
{% endhighlight %}

虽然看上去利用模板的做法成功了，但这样做有个隐藏的致命问题。

C++模板有个“模板实例化”的过程。未实例化的模板被使用时，会自动地在使用位置前进行实例化。于是我们使用`FindValue`时，`Var`被实例化，然后就无法修改了。

> 这就像是[薛定谔的猫](http://zh.moegirl.org/%E8%96%9B%E5%AE%9A%E8%B0%94%E7%9A%84%E8%83%96%E6%AC%A1)，观测行为本身使观测结果坍缩了。

函数！
---

要避免这个问题，我们可以使用函数而非模板来存储这条链。

首先建立一系列函数。这些函数是在编译时用于类型推断的，因此只需声明，不必实现：

{% highlight c++ linenos %}
template <class T>
void var(T);

IntWrapper<123> var();
// or:
//     struct VarInit {};
//     IntWrapper<123> var(VarInit);

IntWrapper<456> var(IntWrapper<123>);
{% endhighlight %}

可以发现，链状结构是通过参数和返回值组织起来的——从`IntWrapper<123>`到`IntWrapper<456>`，再到`void`。通过`decltype(var(<上一个值>))`就能得到下一个值。

这里利用了C++的重载规则——有准确参数的函数优于函数模板，以及，寻找重载时只考虑之前出现的函数。

> 本文写到一半我才想起来，SFINAE在这里并不重要。其实SFINAE主要是用在了[使用过“编译时变量”的、奇技淫巧满满的项目](https://github.com/hczhcz/reflectionpp)中的另一个地方……Anyway，不要在意细节。

用`void var(...)`也是可以的，只需要使用`IntWrapper<123> var(VarInit)`来区分两个重载。后文我们默认使用这种实现。

然后，递归搜索沿用之前的`FindValue`，稍加修改就可以了：

{% highlight c++ linenos %}
template <class Last, class Current>
struct FindValue: public FindValue<
    Current,
    decltype(var(*static_cast<Current *>(nullptr)))
> {};

template <class Last>
struct FindValue<Last, void>: public Last {};

void test() {
    std::cout << FindValue<void, decltype(var(VarInit))>::value;
}
{% endhighlight %}

需要第二次获取当前的`var`值时，我们可以定义一个新的模板，比如叫`FindValue1`。

这有个小问题：如何允许这个链中出现重复的值呢？对于“变量”而言，这是符合常识的。

解决方法是给`IntWrapper`加上额外的模板参数，每次传入唯一的值，使`IntWrapper`类变得唯一。这里可以简单地使用`__COUNTER__`宏，也可以使用一个单独的类。

进一步地——声明新的`var`函数重载时，参数是不必显式地写出来的。可以通过`FindValue`得到：

{% highlight c++ linenos %}
IntWrapper<456> var(
    FindValue<void, decltype(var(VarInit))>
);
{% endhighlight %}

虽然看上去这样会增加很多代码量，但由于代码几乎不变，把`FindValue`定义成宏（当然，`FindValue`的名字需要唯一化，方法很多，请读者自行思考相关奇技淫巧XD）即可。

本文所述的“编译时变量”出现于之前做的C++反射库[reflection++](https://github.com/hczhcz/reflectionpp)中。不过，这个库中使用的并不是一个“变量”，而是“链”本身，用于存储一系列[visitor类](https://github.com/hczhcz/reflectionpp/blob/master/reflection%2B%2B/visitor_chain.hpp)。

当然，这样做是实（娱）验（乐）性质的，因为它有两个无法避免的、工程上的硬伤：使头文件引入顺序能够影响程序本身的正确性，以及严重拖慢编译速度。
