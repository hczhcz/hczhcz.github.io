---
layout: post
title: 折腾一个编译器（语言篇）
abstract: 作者与同学正在开发一个“MyLang语言”的编译器，作为编译原理课程大作业。本篇介绍MyLang语言及我们对语言的扩展。
tags: Compiler MyLang
---

11月，整个月都在[GitHub](https://github.com/hczhcz)上提交代码——因为我在和小伙伴们（[<del>测女神</del>测测](http://gaocegege.com/)、[QKQ](https://github.com/qikangqi)）做我们的大作业，“MyLang语言”的编译器。

> 我们的项目托管在[GitHub上](https://github.com/gaocegege/CompilerLab)。

因此，近期的几篇博文将关于这个编译器展开，并且会随着编译器的开发进程逐步更新。本篇先从语言的设计开始。之后会依次介绍[语法分析](/2014/12/14/designing-a-compiler-parser.html)、语义分析及代码生成等

原版MyLang
---

MyLang是一个用于教学的编程语言，外观接近Ada和Pascal。

出于简便，在MyLang中，一个代码文件即是一个程序。与Pascal类似，它语法树的最上层是标记为`Program`的主程序；同样与Pascal类似，变量在函数体的开头需要先声明。

我们可以对比一下——

这是我们耳熟能详的Pascal，嗯，神烦的A+B Problem：

{% highlight pascal linenos %}
program example;
var
  a: integer;
  b: integer;
begin
  read(a);
  read(b);
  writeln(a + b);
end.
{% endhighlight %}

这是赫赫有名的把火箭炸成炮仗（误）的Ada：

{% highlight ada linenos %}
with Ada.Text_IO; use Ada.Text_IO;
procedure Hello is
  a: integer;
  b: integer;
begin
  Get(a);
  Get(b);
  Put(a + b);
end Hello;
{% endhighlight %}

这是我们的主角MyLang：

{% highlight pascal linenos %}
program example()
is
  var a is integer;
  var b is integer;
begin
  input a;
  input b;
  print (a + b);
end
{% endhighlight %}

很像，不是吗？和C系大括号语言有着截然不同的风格。

我们可以在MyLang程序中使用分支、循环等结构，包括`foreach`：

{% highlight pascal linenos %}
i := 0;
while i < 10 do
  j := 0;
  repeat
    grid[i][j] := i * j;
  until j >= 10;
  i := i + 1;
end while

if need_output then
  foreach l in g do
    foreach i in l do
      print i;
    end foreach
  end foreach
end if
{% endhighlight %}

MyLang是强类型、静态类型的语言，这意味着编译器将负责类型的推断和检查。

除了内置的类型（整数、浮点数、布尔值、字符串、数组）之外，MyLang允许用户定义类。

类的定义方式参见下面的例子。我们可以继承类、覆盖类成员。当然，大作业中，并不要求虚继承、多重继承、泛型这些相对高级的特性。

{% highlight pascal linenos %}
function inc(x)
  var x is integer;
  return integer;
is
begin
  return x + 1;
end function inc;

type counter is class
  var i is integer;
  function action()
  is
  begin
    i := inc(i);
  end function action;
end class;

type counter1 is class extends counter
  function action()
  is
  begin
    i := inc(i);
    print i;
  end function action;
end class;
{% endhighlight %}

扩展版
---

我们对MyLang语言进行了一些扩充（呃……那些奇怪的事是我干的）。主要的思路是将语言的特性通用化——合并特例，然后扩充成一种通用的形式。

首先是`program`和`function`。它们具有统一的格式，区别只是在语义上。

在早期的设计中，`program`这个关键字被分配给了“输入”语义，即“反函数”，用来与`function`的“函数”、“输出（返回值）”对应。与`return`类似，有一个`receive`语句用来接收输入值：

{% highlight pascal linenos %}
function plus3(x)
  var x is integer;
  return integer;
is
begin
  return x + 3;
end;

program plus3(x)
  var x is integer;
  receive integer;
is
begin
  receive x + 3;
end;

...

a := plus3(5); // call function plus3() // a is 8
plus3(b) := 9; // call program plus3() // b is 6

// and more...

a := console(); // input a
console() := b; // print b
{% endhighlight %}

之后，在<del>大和谐</del>削减反直觉设计的过程中，`program`的特殊语义被去除，而`receive`被保留了下来。`function`中也可使用`receive`。现在，`program`简单地被分配给了位于顶层的函数，与`function`使用相同方式处理。

进一步地，我们把函数和类也合并了。

函数（包括`function`和`program`）相当于一个在调用时实例化、调用后立刻销毁的对象。函数中的`is`之前是类的public成员，之后是类的private成员，函数的成员像类成员一样有一个固定的偏移地址，在调用前后执行必要的初始化和销毁。当然，为了提高性能，语言中提供了快速变量，即按照系统的ABI进行传参（可以直接通过寄存器传参）、函数执行过程中不对其分配固定的地址。

出于某种强迫症，各种变量、`receive`和`return`也被合并了，然后还捎带了`extends`和`refers`（这个很特别，稍后再讲）。它们分别使用一个特别的名字（如`receive`对应`__input`）。而`type`则相当于一个编译时的“变量”——这会牵扯出编译时计算的话题，是的，扩展的MyLang会允许编译时计算，就像C++的constexpr那样。

{% highlight pascal linenos %}
function plus3(x)
  fast x is integer;
  static __result is integer;
is
begin
  return x + 3;
end;

a := plus3(5); // pass "5" by register // a is 8
b := plus3.__result; // b is 8
{% endhighlight %}

当我试图合并函数和类的时候，遇到了一个麻烦——`this`指针的地位非常尴尬。成员函数需要有指针指向对象，而非成员函数的`this`又能指向什么呢？

回到设计早期，为了能让这个长得很像Pascal的语言更Pascal一点，我们期望能实现函数嵌套。换句话说，调用栈里需要有外层函数栈帧的地址。想到这里我忽然发现了什么——对啊，其实这和`this`指针可以是同一个东西——它们都用于指向“外层”。

于是就有了`refers`，相当于声明一个变量并且引入它的命名空间。在没有显式指定时，编译器会自动声明一个指向外层的引用。顺带一提，`extends`也相当于声明变量并引入命名空间，但是它和`refers`在细节上不同，例如它不会覆盖自动生成的`refers`，以及它允许隐式类型转换。

> 你猜，如果`refers`不是引用，而是直接copy，可以干嘛用？

我们做了较多的更细粒度的扩展。其中比较有趣的是关于函数调用的。为了避免`print`（以及`input`，在原始设定中并没有明确它的存在）成为语法特例，我们把它解释为不带括号的函数调用。一个代价是`print x + 1`会被解释成`(print(x)) + 1`，然后莫名其妙地变成加法类型不匹配。

这个扩展（称为“扩展”并不合适，应该说是改动）除了允许我们写`sin arctan 1`之外，还间接地消掉了另一条语法规则——数组索引。`arr[i]`现在等同于`arr([i])`了，成了一个函数调用，参数是一个字面数组。这很tricky，是否会进入最终的版本还有待商榷，但至少很好玩（以这样浮夸的方式做大作业当然是因为好玩）。

当然，扩展MyLang的过程中，我们还参考了后来的Pascal家族语言，例如Delphi和Oxygene。函数参数的`in`、`out`、`var`标签就是其中一例。

待续，本篇也可能随着编译器的开发进程，继续修改完善。
