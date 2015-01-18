---
layout: post
title: 折腾一个编译器（中间表示翻译篇）
abstract: 作者与同学正在开发一个“MyLang语言”的编译器，作为编译原理课程大作业。本篇介绍将AST变换为libblock中间表示的过程。
tags: Compiler MyLang Semantic
---

在[MyLang](/2014/11/30/designing-a-compiler.html)的实现中，语法分析器MyParser和语义分析器libBlock都是独立的单元，因此需要一个“对接”的过程。

[语法分析篇](/2014/12/14/designing-a-compiler-parser.html)中我们提到，MyParser提供了`Pass`模块用于遍历AST。本文即描述了一个`Pass`模块的实例。

libblock中间表示
---

libblock中间表示由一些被称为block（块）的单元组成。每个block是一个作用域。在MyLang中的一个`function`、`program`或`class`对应一个block。有一个全局的根block，主`program`所在的block是它的一个成员（而不是它本身）。

每个block中包含一些名称及绑定在名称上的代码树，包含一个调用接口（函数的调用、类的构造）。名称又可以根据性质分为`type`、`expr`、`var`、`static`、`fast`，和MyLang对应。

> block这个概念在作者之前做的某几个语言里也出现过。

libblock的代码树比MyParser生成的AST简单一些，大致包含：

* `Get`节点：从当前作用域获取某个名称对应的内容；
* `With`节点：访问另一个作用域，用于`obj.field`这样的形式；
* `Call`节点：函数调用或类的构造；
* `Literal`节点：字面量，包括整数、浮点数、字符等（需要注意，libblock没有“字符串节点”，字符串由连续的字符节点表示）；
* `Label`节点：标签的标识符，用于跳转，同一个Block里，每个标签有一个唯一的标识符；
* `Block`节点：引用其它block，通常出现在编译时执行的代码树里（例如类型定义）。

libblock中间表示直接以C++对象的形式存在于内存中，但也可以用文本表示出来。

例子
---

下面看例子——

源码：

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

libblock中间表示，可以看到`program`是根block下的一个成员：

{% highlight python linenos %}
{                                       # global
    type:
        "example" hidden: block {       # program
            expr:
                "__code" hidden: (      # program body
                    __locate (@0)
                    input (a)
                    input (b)
                    print (__add (
                        a
                        b
                    ))
                    __locate (@1)
                )
            var:
                "a": integer            # variable "a"
                "b": integer            # variable "b"
        }
}
{% endhighlight %}

函数体在`__code`，它以`expr`成员的形式存放在block结构中。在MyLang中，不写函数体而直接声明`expr __code is ...;`也是可行的（注：这一细节暂未定型）。

实现细节
---

出于简化编译过程、减少和语言的耦合性等考虑，libblock代码树的节点被设计得尽可能简单，因此它不直接包含控制流结构。那么控制流结构是如何翻译的呢？

回到之前的例子，可以看到其中出现了`__locate`，这是一个函数，它的参数`@0`（或`@1`）是`Label`节点。libblock的`Label`本身只代表一个标识符（一个数字），而标签的位置是通过`__locate`函数确定的（`__locate @XXX`表示“使`XXX`标识符表示当前的位置”）。

很自然，`__goto`和`__branch`函数分别表示无条件、有条件跳转。其中`__branch`表示“若条件不成立则跳转到标签”。

将`__locate`、`__goto`和`__branch`组合使用，就可以实现循环、分支等结构：

{% highlight pascal linenos %}
begin
  while a < 10 do
    LOOP_BODY_IS_HERE;
  end while

  if a == b then
    THEN_BRANCH;
  else
    ELSE_BRANCH;
  end if
end
{% endhighlight %}

{% highlight python linenos %}
"__code" hidden: (
    __locate (@0)
    __locate (@2)           # loop begin
    __branch (
        @3
        __less (
            a
            10
        )
    )
    LOOP_BODY_IS_HERE
    __goto (@2)
    __locate (@3)           # loop end
    __branch (              # branch begin
        @4
        __equal (
            a
            b
        )
    )
    THEN_BRANCH
    __goto (@5)
    __locate (@4)
    ELSE_BRANCH
    __locate (@5)           # branch end
    __locate (@1)
)
{% endhighlight %}

另一方面，libblock的中间表示也不包含运算符。我们可以看到，运算符被理解为了有两个参数的函数，例如上面出现过的`__add`、`__equal`。

由于[MyParser](https://github.com/hczhcz/myparser)是一个LL分析器，它接受的语法是不包含左递归的。我们会发现，`A-B+C`可以自然地被解析成`(A-(B+C))`，但是无法直接得到`((A-B)+C)`。

{% highlight text linenos %}
   -
 /   \
A     +
     / \
    B   C

     +
   /   \
  -     C
 / \
A   B
{% endhighlight %}

这就需要在将AST变换为libblock中间表示的过程中，完成一组“旋转”操作。

“旋转”的实现并不复杂。继续以`A-B+C`为例，完成`A`的处理之后，将得到的树传入负责处理`-B`的函数，组合成`A-B`，然后再将`A-B`传入负责处理`+C`的函数，就能得到正确的表达式结构了。

写博客结尾真是一件麻烦的事……总之，MyLang的中间表示翻译大致如上文所述。在[MyLang项目](https://github.com/gaocegege/CompilerLab)中，对应的代码在一个名为`mylang_analysis_pass.hpp`的文件里。

MyLang的语义分析、代码生成还没有开发完成，后续博客的话题可能暂时切换到MyLang之外。
