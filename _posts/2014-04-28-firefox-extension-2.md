---
layout: post
title: 初试Firefox插件（下篇）
abstract: 使用最基本的方法搭建一个Firefox插件；在向Firefox移植Electsys++插件过程中的现学现卖。
tags: Firefox Web
---

chrome.manifest
---

接着[上篇](/2014/04/16/firefox-extension.html)，我们来关注下一个重要的文件，`chrome.manifest`。

这个文件的结构相对来说简单一些，每一行列出了插件中的一个“东西”。这里所谓的“东西”，包括界面、语言、皮肤、链接库……等。下面是一个简单的例子：

{% highlight text linenos %}
content blablabla chrome/content/
overlay chrome://browser/content/browser.xul chrome://blablabla/content/browserOverlay.xul
{% endhighlight %}

第一行定义了这个插件的内容文件夹位置，现在我们可以通过`chrome://<插件名称>/content/...`访问`content`文件夹中的文件了。

`content <插件名称> <路径>`，以及`locale <插件名称> <语言名称> <路径>`和`skin <插件名称> <皮肤名称> <路径>`，被认为是`chrome.manifest`的基本项目。

第二行列出了`browserOverlay.xul`，这是一个界面叠加文件。它作为一个“补充内容”被加载到了`chrome://browser/content/browser.xul`上。

至于这个`browser.xul`又是什么？把它放进地址栏你就知道了……<del>嗯，然后可以在内层界面的地址栏里继续输入哦，一层套一层根本停不下来！我猜你已经这样做了。</del>

我们可以看出`overlay`的用法：`overlay <源XUL> <目标XUL>`。另外，把`overlay`替换成`style`，可以向XUL加载css文件，而替换成`override`可以直接覆盖文件。

另外，还有些值得注意的项目：

* `manifest <manifest路径>`：调用另外一个`manifest`文件；

* `component <GUID> <脚本路径>`和`binary-component <链接库路径>`：使用一个XPCOM/ABI组件；

* `resuorce <别名> <路径>`：为路径创建别名；

* 还有很多。

每一行最后，可以追加一些选项，用来为不同的环境加载不同的项。如`os=WINNT`、`appversion>=version`、`contentaccessible=yes`、`appversion>=1.0`（还有`platformversion`和`osversion`）等。

XUL
---

我们已经知道了，在Firefox中，XUL（XML User-interface Language）文件用来产生用户界面。它像`install.rdf`那样，也是一个xml文件。

可以创建一个简单的XUL文件，放进Firefox里看看效果（需要安装[Remote XUL Manager](https://addons.mozilla.org/en-US/firefox/addon/remote-xul-manager/)并且允许打开本地XUL文件`<file>`）：

{% highlight xml linenos %}
<?xml version="1.0"?>
<?xml-stylesheet href="chrome://global/skin/" type="text/css"?>

<window title="hello" xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul">
    <button label="hello, world" />
    <label>goodbye, bug</label>
    <listbox>
        <listitem label="2" />
        <listitem label="0" />
        <listitem label="4" />
        <listitem label="8" />
    </listbox>
</window>
{% endhighlight %}

大致长这样：

![hello.xul](/images/2014-04-28-xul-preview.png)

顺便补充一点，`<?xml-stylesheet href="chrome://global/skin/" type="text/css"?>`表示要使用原生GUI风格的界面，而不是网页风格的。试试去掉这一行，显示效果会不同。

我们可以像在HTML里那样使用脚本（以及图片和其它一些组件），也可以绑定一些用于UI的事件：

{% highlight xml linenos %}
<?xml version="1.0"?>

<window title="hello" xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul">
    <script src="test.js" />
    <keyset>
        <key key="A" oncommand="alert('A');" />
    </keyset>
</window>
{% endhighlight %}

XUL中嵌入的JavaScript与网页中的区别不是很大，[MDN](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XUL/Tutorial)上有详细的说明。

直接使用HTML（确切说是XHTML）也是可以的：

{% highlight xml linenos %}
<?xml version="1.0"?>

<window title="hello"
    xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul"
    xmlns:html="http://www.w3.org/1999/xhtml"
>
    <html:input type="checkbox" />
</window>
{% endhighlight %}

或者这样：

{% highlight xml linenos %}
<window xmlns="http://www.w3.org/1999/xhtml">
    <input type="checkbox" />
    <b>this is xhtml</b>
</window>
{% endhighlight %}

将`window`标签换成`overlay`，可用于界面叠加文件。

与网页连接
---

Electsys++的Chrome版通过网页JS实现，我们可以通过XUL JS加载那些网页JS。

先在XUL JS中获取网页的window对象：`window.content`。

它被包装了起来，当然，解开它很容易：`XPCNativeWrapper.unwrap(window.content)`。

接下来，像在网页中那样，`createElement("script")`，把那些网页JS追加到网页上就可以了。

最后，我们监听一下网页的打开，用来加载JS：

{% highlight javascript linenos %}
function init() {
    // Load content js
}

window.addEventListener("load", function load(event){
    window.removeEventListener("load", load, false);

    var appcontent = document.getElementById("appcontent");
    if(appcontent){
        appcontent.addEventListener("DOMContentLoaded", init, true);
    }
}, false);
{% endhighlight %}

大功告成。将文件用zip打包（扩展名改为xpi），放进Firefox安装，然后好好享受成果吧。
