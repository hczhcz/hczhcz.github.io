---
layout: post
title: 初试Firefox插件（上篇）
abstract: 使用最基本的方法搭建一个Firefox插件；在向Firefox移植Electsys++插件过程中的现学现卖。
tags: Firefox Web
---

作为一个已经放弃治疗的[Vimperator](https://addons.mozilla.org/firefox/addon/vimperator/)症患者，离开了Firefox就会异常纠结。于是我把我们学校的Electsys++选课插件[移植到了Firefox上](https://github.com/hczhcz/electsys)。

其实，移植工作可以使用更方便的工具完成（甚至不用做插件，直接喂给[Greasemonkey](https://addons.mozilla.org/firefox/addon/greasemonkey/)就行），但是为了练手，我决定用最基本的方法。

目录结构
---

首先，一个Firefox插件（xpi文件）是一个压缩包。我们可以看到它的大致结构：

{% highlight text linenos %}
|-- chrome.manifest
|-- chrome
|   `-- content
|       |-- browserOverlay.xul
|       `-- ...
|-- install.rdf
`-- ...
{% endhighlight %}

上面只列出了最重要的几个文件。

`install.rdf`记录了插件最基本的信息；`chrome.manifest`列出了插件包含的内容；`content`文件夹放置插件内容。其实Firefox对插件内容的位置并没有特别的规定，我们可以根据自己的习惯来命名目录，不过通常我们使用约定俗成的`chrome/content`。<del>其实我在插件里手滑用了单层的content目录……</del>

install.rdf
---

长话短说，直接上例子：

{% highlight xml linenos %}
<?xml version="1.0"?>

<RDF xmlns="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    xmlns:em="http://www.mozilla.org/2004/em-rdf#">

    <Description about="urn:mozilla:install-manifest">

        <em:id>blablablaaddon@example.com</em:id>
        <em:name>This</em:name>
        <em:description>This is a firefox extension</em:description>
        <em:version>1.0</em:version>
        <em:creator>Macrohard</em:creator>
        <em:homepageURL>http://example.com/this</em:homepageURL>
        <em:type>2</em:type>

        <em:targetApplication>
            <Description>
                <em:id>{ec8030f7-c20a-464f-9b0e-13a3a9e97384}</em:id>
                <em:minVersion>2.0</em:minVersion>
                <em:maxVersion>2048.*</em:maxVersion>
            </Description>
        </em:targetApplication>

    </Description>

</RDF>
{% endhighlight %}

我们慢慢来看。

`Description`标签之前的没什么好说，定义了这是RDF文件。

在`Description`内，每个标签定义了关于插件的一条信息。

###id

首先是id，我们需要为每个插件定义一个唯一的id，应该避免与其它插件的id冲突。这个id可以是email的形式（不必是个真实存在的email地址，只要确保不会造成冲突就可以），也可以是一个GUID：

{% highlight xml linenos %}
<em:id>blablablaaddon@example.com</em:id>
<em:id>{deadbeef-0123-4567-89ab-c0ffeec0ffee}</em:id>
{% endhighlight %}

###name, description

名字和描述，这个不用解释了：

{% highlight xml linenos %}
<em:name>This</em:name>
<em:description>This is a firefox extension</em:description>
{% endhighlight %}

###version

版本号，为了便于Firefox识别版本，我们可以使用一个简单而清楚的版本号：

{% highlight xml linenos %}
<em:version>1.0</em:version>
{% endhighlight %}

###creator, developer……

作者和主页：

{% highlight xml linenos %}
<em:creator>Macrohard</em:creator>
<em:developer>Alice</em:developer>
<em:developer>Bob</em:developer>
<em:translator>Carol</em:translator>
<em:contributor>Dave</em:contributor>
<em:developer>Eve</em:developer>
{% endhighlight %}

###homepageURL, aboutURL……

各种地址：

{% highlight xml linenos %}
<em:homepageURL>http://example.com/this</em:homepageURL>
<em:aboutURL>chrome://This/content/about.xul</em:aboutURL>
<em:iconURL>chrome://This/content/logo.png</em:iconURL>
<em:icon64URL>chrome://This/content/logo_big.png</em:icon64URL>
{% endhighlight %}

我们可以看到一种特殊的地址`chrome://This/content/...`。`chrome:`是Firefox内置内容的访问协议（注意不要把它和Google Chrome混淆），我们可以从`chrome://<插件名称>/...`访问我们的插件中的文件。

除了上面这些，还有updateURL和optionURL。涉及更多细节，这里不作深入讨论。

###type

类型，数字2表示扩展：

{% highlight xml linenos %}
<em:type>2</em:type>
{% endhighlight %}

另外，4是主题包，8是语言包，32是多种内容组合（…大礼包？），64是拼写检查库。

###targetApplication

我们需要指定这个插件适用的软件和版本：

{% highlight xml linenos %}
<em:targetApplication>
    <Description>
        <em:id>{ec8030f7-c20a-464f-9b0e-13a3a9e97384}</em:id>
        <em:minVersion>2.0</em:minVersion>
        <em:maxVersion>2048.*</em:maxVersion>
    </Description>
</em:targetApplication>
{% endhighlight %}

`{ec8030f7-c20a-464f-9b0e-13a3a9e97384}`是Firefox的GUID。[这里](http://kb.mozillazine.org/Install.rdf)有一份更详细的列表：

{% highlight text linenos %}
Firefox             {ec8030f7-c20a-464f-9b0e-13a3a9e97384}
Thunderbird         {3550f703-e582-4d05-9a08-453d09bdfdc6}
Nvu                 {136c295a-4a5a-41cf-bf24-5cee526720d5}
Mozilla Suite       {86c18b42-e466-45a9-ae7a-9b95ba6f5640}
SeaMonkey           {92650c4d-4b8e-4d2a-b7eb-24ecf4f6b63a}
Sunbird             {718e30fb-e89b-41dd-9da7-e25a45638b28}
Netscape Browser    {3db10fab-e461-4c80-8b97-957ad5f8ea47}
Flock Browser       {a463f10c-3994-11da-9945-000d60ca027b}
{% endhighlight %}

###其它

还有`strictCompatibility`、`unpack`、`localized`、`bootstrap`等项目，这里不一一解释，可以在[Mozilla开发者网络](https://developer.mozilla.org/en-US/Add-ons/)找到更多信息。
