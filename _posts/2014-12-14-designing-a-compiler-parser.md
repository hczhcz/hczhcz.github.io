---
layout: post
title: 折腾一个编译器（语法分析篇）
abstract: 作者与同学正在开发一个“MyLang语言”的编译器，作为编译原理课程大作业。本篇介绍MyLang实现中使用的语法分析器框架MyParser。
tags: Compiler MyLang Parser
---

[MyLang](/2014/11/30/designing-a-compiler.html)编译器大致可以分成三个部分：

* 语法分析器[MyParser](https://github.com/hczhcz/myparser)；
* 语义分析器[libBlock](https://github.com/hczhcz/libblock)；
* 后端，我们在大作业中使用的是基于[LLVM](http://llvm.org/)的[代码生成器](https://github.com/gaocegege/LLVM-Simple-Wrapper)。

本篇的主角是语法分析器MyParser。MyParser沿用了MyLang的“My”命名，但它在更大程度上是一个独立的库，用于生成自顶向下Parser。它由两部分组成，分别是Parser生成器和C++库。

语法规则文件
---

MyParser使用带有特殊格式的Markdown文件记录语法规则。

下面看一个简单的例子：

{% highlight text linenos %}
**space**:

    <space regex>

*space regex*:

    [ \t]*

**keyword**:

    <id>
    <sign>

*id*:

    [a-z]+

*sign*:

    [,.!]

greet:

    hello
    goodbye

**root**:

    <greet> <sign> <id> !
    goodbye <sign> <id> .
{% endhighlight %}

好吧，其实不那么简单……

这组语法规则可以接受形如“hello, world!”、“goodbye, bug.”的输入。

我们看到，有一系列冒号结尾的标签，它们表示规则的名称。

MyParser使用的语法规则可以分为列表规则和正则表达式规则。

上例中的一些规则名被星号包围。一个星号在Markdown里表示*斜体*，在这里表示正则表达式规则；两个星号是**粗体**，在这里表示“特殊”的列表规则；没有星号的规则名是普通的列表规则。

例如，`id`规则使用正则表达式`[a-z]+`，那么它可以接受一串小写字母；`greet`规则可以接受`hello`或`goodbye`。

规则中的一行以四个空格开头。列表规则中，优先匹配靠前的行。仍然以上面的规则为例，如果解析“goodbye, bug.”，会首先尝试`root`的第一行。发现无法匹配感叹号后，再尝试第二行。

“特殊”的规则只有三条，分别是`root`、`space`和`keyword`。它们都是列表规则。

* `root`是语法规则默认的入口；
* `space`就是空格了。在列表规则中出现的空格都会用它来匹配，`<sign> <id> !`相当于`<sign><space><id><space>!`；
* `keyword`是列表规则中的关键字（包括符号）。对于关键字，需要先进行一次使用`keyword`的匹配，再检查匹配结果是否满足原来的关键字。至于为什么不直接做全字匹配呢？这是为了确保形如`for <id>`的规则不会匹配以`for`开头的其它单词，如`foreach`。

Parser生成器
---

Parser生成器是一系列Python脚本，读取一个Markdown文件，对规则进行一些检查，然后生成一个C++代码文件。

{% highlight python linenos %}
import myparser
import myparser_cpp

# load rules
parser = myparser.MyParser()
parser.add_file('syntax.md')

# generate c++ code
gen_file = myparser_cpp.cplusplus_gen(
    parser.xdump(myparser_cpp.cplusplus_dump),
    'myparser/',
    'SYNTAX_HPP'
)

# write to file
syntax_hpp = open('syntax.hpp', 'w')
syntax_hpp.write(gen_file)
{% endhighlight %}

生成文件的格式大致如此：

{% highlight c++ linenos %}
template<>
class RuleDef<MP_STR("keyword", 7)>:
public RuleList<MP_STR("keyword", 7),
    RuleLine<
        RuleItemRef<MP_STR("id", 2)>
    >,
    RuleLine<
        RuleItemRef<MP_STR("sign", 4)>
    >
> {};

template<>
class RuleDef<MP_STR("id", 2)>:
public RuleRegex<MP_STR("id", 2),
    MP_STR("[a-z]+", 6)
> {};
{% endhighlight %}

一个有意思的细节是，Parser生成器本身也是一个编译器，即以带特殊格式的Markdown为输入、以C++代码为输出。这也就意味着它自身带有一个Parser。当然，由于Markdown本身足够简单，MyParser中处理Markdown只使用了正则匹配，并没有做[bootstrap](http://en.wikipedia.org/wiki/Bootstrapping_%28compilers%29)。

Parser生成器除了生成C++代码外，也可以模拟执行语法分析，方便编译器开发者对语法规则进行除错。

C++库
---

MyParser的C++库是完全用头文件配合模板展开完成的。将C++库与Parser生成器生成C++代码文件（也是个头文件）一起include进项目中，就可以使用了。

从上面的例子可以看到，Parser生成器生成的文件大致包含：

* `RuleDef`模板的特化；
* 语法规则类`RuleList`和`RuleRegex`，分别对应列表规则和正则表达式规则；
* `RuleList`中的每一行`RuleLine`，以及`RumeItemRef`等成员；
* `MP_STR`宏，用来将字符串传入模板参数。

它们由C++库实现。

先从`MP_STR`说起。这个宏将字符串如`"hello"`打散成字符`'h', 'e', 'l', 'l', 'o'`，然后返回一个编译时字符串类。其中使用的方法比较简单粗暴，展开`"hello"[0], "hello"[1], ...`而已。我们可以用编译时字符串类给AST（抽象代码树）节点标注类型。

AST节点分为`List`、`Text`和`Error`。

很显然，列表规则生成`List`节点，`Text`节点来自正则表达式规则。实现中，`RuleList`简单地依次调用`RuleLine`直到找到第一个匹配的；`RuleLine`依次调用各个成员，并将匹配结果连接到一起；`RuleRegex`封装了C++11的正则库。

这是一个自顶向下的语法分析过程，类似于[LL分析器](http://en.wikipedia.org/wiki/LL_parser)。

继续使用之前的例子，“hello, world!”会被这样扫描：

{% highlight c++ linenos %}
hello, world!
^ <root>
^ <greet>
^ <keyword: "hello">
^ <keyword>
^ <id>
^ id: "hello"
     ^ keyword: [id: "hello"]
     ^ greet: [keyword: [id: "hello"]]
     ^ root: [greet: [keyword: [id: "hello"]], ...]

hello, world!
     ^ <space>
     ^ <space regex>
     ^ space regex: ""
     ^ space: [space regex: ""]
     ^ root: [greet, space: [space regex: ""], ...]

hello, world!
     ^ <sign>
     ^ sign: ","
      ^ root: [greet, space, sign: ",", ...]

hello, world!
      ^ <space>
      ^ <space regex>
      ^ space regex: " "
       ^ space: [space regex: " "]
       ^ root: [greet, space, sign, space, ...]

hello, world!
       ^ <id>
       ^ id: "world"
            ^ root: [greet, space, sign, space, id, ...]

hello, world!
            ^ <space>
            ^ <space regex>
            ^ space regex: ""
            ^ space: [space regex: ""]
            ^ root: [greet, space, sign, space, id, space, ...]

hello, world!
            ^ <keyword: "!">
            ^ <keyword>
            ^ <sign>
            ^ sign: "!"
             ^ keyword: [sign: "!"]
             ^ root: [greet, space, sign, space, id, space, keyword]
{% endhighlight %}

`Error`节点会被追加到错误的发生地，通常是上一个节点所在的位置之后。MyParser解析过程中，会保留走得最远的`Error`节点。例如对于：

{% highlight text linenos %}
some rule:

    <some part> <some part> <some part>

some part:

    foo foo bar bar
    foo
{% endhighlight %}

规则`some rule`匹配“foo foo bar baz”时，可能得到的错误形态有：

1. `some rule: [some part: ["foo", "foo", "bar", <error>]]`；
2. `some rule: [some part:["foo"], some part:["foo", <error>]]`；
3. `some rule: [some part:["foo"], some part:["foo"], some part:[<error>]]`。

那么，当Parser发现不可能正确匹配时，会返回第一种，因为它已匹配的部分最长。

为了继续处理大量不同的AST节点，MyParser包含一个被称为`Pass`的模块，实现对节点的访问（即“visitor模式”）。MyLang实现中使用它[将AST翻译成语义分析所需的中间表示形式](/2015/01/18/designing-a-compiler-mir-generation.html)。AST格式化输出、语法高亮等功能也是基于这个模块完成的。

MyParser的代码在[这里](https://github.com/hczhcz/myparser)。其中用到大量的C++模板，获得灵活性、运行性能的同时也会增加编译耗时和代码的复杂程度。
