---
layout: post
title: C++11 Lambda函数闭包的类型与存储形式
abstract: C++11引入了Lambda函数，对于非就地使用的Lambda函数，闭包的存储需要一些特定的技巧。
tags: C++ Memory
---

众所周知，Lambda函数是C++11带来的一个很重要的特性。

考虑到并不是所有Lambda函数都是就地使用的，我们需要将它“存下来”。从一个Lambda函数生成一个带捕获变量的闭包后，有两种通常的存储方法。

第一种，最基本的方法，使用auto声明一个自动推导类型的变量：

{% highlight c++ linenos %}
long a = 1;

auto func1 = [=] (long b) {
    return a + b;
};
{% endhighlight %}

这样做的一个缺点是，一旦`func1`离开了它的作用域，就会被自动回收。

第二种，也是很多资料中所称的“更强大”的方法，使用[std::function](http://www.cplusplus.com/reference/functional/function/)模板来接收：

{% highlight c++ linenos %}
long a = 1;

std::function<long (long)> func2 = [=] (long b) {
    return a + b;
};
{% endhighlight %}

我们可以分别计算`sizeof(func1)`和`sizeof(func2)`，发现前者就是Lambda函数捕获的变量的大小，而后者是一个固定值。

现在问题来了：

* 那个`auto`代表什么类型？能不能直接写出来？
* `func1`的大小具体是怎么决定的？
* `std::function`干了什么？捕获的变量去哪儿了？
* 捕获变量（或者说闭包）的生存期可以比上面例子中的更长吗？

下面，我们来解答这些问题。

Lambda的类型
---

C++的Lambda是一种典型的语法糖。例如上文出现的这个Lambda函数：

{% highlight c++ linenos %}
auto func1 = [=] (long b) {
    return a + b;
};
{% endhighlight %}

会被翻译成：

{% highlight c++ linenos %}
class SomeAnonymousType {
private:
    long a;
public:
    SomeAnonymousType(long init_a): a(init_a) {}

    long operator() (long b) const {
        return a + b;
    }
};

auto func1 = SomeAnonymousType(a);
{% endhighlight %}

也就是说，C++11中的匿名函数相当于一个匿名的函数对象。

`=`捕获的变量会直接成为这个函数对象的成员；如果捕获方式是`&`（按引用捕获），函数对象中将会存储一个指针。

第二个问题也一起解答了，我们把匿名函数翻译成像`SomeAnonymousType`这样的函数对象，根据C++的内存对齐方式，就可以算出大小。另外，我用clang++测试了一下，编译器不会对变量的捕获顺序做特别的改变。这也就意味着，如果我们交替地捕获不同大小的变量，可能会浪费一些额外的空间。

长期存储
---

不难猜到，`std::function`把闭包存储在了堆中，所以它本身的大小是固定的。既然匿名函数是一种语法糖，我们当然可以剥开糖衣，按照它的本来面目使用它——像处理一个函数对象那样处理闭包——那么，闭包存储在堆中也应当是可行的。

我们可以自己动手，实现一个简单的Lambda容器，作为`std::function`的替代品。

首先，我们需要设计这样一个类，它接收一个变量（可选择通过copy或者move接收），然后从堆中分配一段内存来存储它。

一个办法是通过模板。我们需要“记住”变量的类型，来完成释放内存等必要的操作。因此我们引入了一个`Helper`类，把操作实例化，再用函数指针记下。

> 顺带一提：这里也可以使用Lambda函数，读者如有兴趣，不妨尝试一下。

{% highlight c++ linenos %}
// using namespace std;

class Container {
private:
    void *buf;

    template <class T>
    struct Helper {
        static void del(void *ptr) {
            delete (T *) ptr;
        }
    };

    void (*del)(void *ptr);

public:
    template <class T>
    Container(T &data) {
        buf = (void *) new T(data);
        del = Helper<T>::del;

        cout << "copy" << endl;
    }

    template <class T>
    Container(T &&data) {
        buf = (void *) new T(data);
        del = Helper<T>::del;

        cout << "move" << endl;
    }

    ~Container() {
        del(buf);

        cout << "free" << endl;
    }
};

// usage:

double pi = 3.14;

Container x(1);
Container y(3.14);
Container z(pi);
{% endhighlight %}

然后，我们像`std::function`那样，把`Container`改成一个模板，加上函数调用的参数、返回值的类型。

为了让它能被调用，我们加上一个`operator()`，把它变成一个函数对象。我们同样利用`Helper`类：添加一个`call()`成员，将调用转发给Lambda函数：

{% highlight c++ linenos %}
// using namespace std;

template <class out, class... in>
class LambdaContainer {
private:
    void *buf;

    template <class T>
    struct Helper {
        static out call(void *ptr, in... arg) {
            return ((T *) ptr)->operator()(std::forward<in...>(arg...));
        }

        static void del(void *ptr) {
            delete (T *) ptr;
        }
    };

    out (*call)(void *ptr, in... arg);
    void (*del)(void *ptr);

public:
    template <class T>
    LambdaContainer(T &data) {
        buf = (void *) new T(data);
        call = Helper<T>::call;
        del = Helper<T>::del;

        cout << "copy" << endl;
    }

    template <class T>
    LambdaContainer(T &&data) {
        buf = (void *) new T(data);
        call = Helper<T>::call;
        del = Helper<T>::del;

        cout << "move" << endl;
    }

    out operator()(in... arg) {
        return call(buf, std::forward<in...>(arg...));
    }

    ~LambdaContainer() {
        del(buf);

        cout << "free" << endl;
    }
};

// usage:

double pi = 3.14;

LambdaContainer<double, double> func(
    [=](double n){
        return n * pi;
    }
);

cout << func(5) << endl;
{% endhighlight %}

至此，一个简单但初步可用的Lambda容器就完成了。当然，为了让它更完整，我们还应该让它能判断`buf`是否为空、能被copy或者move，甚至可以考虑支持引用计数。我们可以用它保存Lambda函数，直到<del>天荒地老</del>释放为止。
