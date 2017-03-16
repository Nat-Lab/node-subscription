NodeSubscription: 一个简单的 NodeJS 订阅管理系统
---

NodeSubscription 是一个使用 NodeJS 实现的订阅框架。

### 类

#### `NodeSubscription`: 工厂函数

接受一个对象作为配置，返回一个对象，包含 `inspector` 对象与 `User` 工厂。用法：

```Javascript
var NS = require('NodeSubscription');
var ns = new NS({userdb: 'user.db', projectdb: 'project.db'});
var User = ns.User;
var ispc = ns.inspector;
```
`userdb` 指向订阅者数据库，`projectdb` 指向订阅项目数据库。若它们不存在，会自动创建。

##### `inspector`：审查器

`NodeSubscription.inspector` 方法用于管理订阅与订阅者。返回一个对象，包含用于管理订阅／订阅者的对象：

方法|描述
:--|:--
`inspector.subscriber.list()`|列出订阅者，返回一个返回 `[Subscriber]` 的 `Promise`。
`inspector.subscriber.edit(Int uid)`|编辑订阅者，返回一个对象。
`inspector.project.list()`|列出订阅，返回一个返回 `[Project]` 的 `Promise`。
`inspector.project.edit(String pid)`|编辑订阅，返回一个对象。

#### `Project`：订阅对象

代表一个订阅，结构：

属性|类型|描述
:--|:--|:--
catalog|String|目录
name|String|订阅名称
public|Bool|公开？
admins|[int]|管理员
content|any|订阅内容。可以为任何对象／类型。
_id|String|订阅 ID

#### `Subscriber`：订阅者对象

代表一个订阅者，结构：

属性|类型|描述
:--|:--|:--
uid|int|用户 ID
subscriptions|[String]|订阅列表
options|any|用户属性。可以为任何对象／类型。
_id|String|内部用户识别 ID

#### `User`：工厂函数

制作 `User` 实例。一个 `User` 实例可以是订阅者，也可以是发布者。接受一个参数，用户 ID。有相同 ID 的 `User` 对象会被当成相同的实例来对待。（即：能够管理该用户创建的订阅、获取订阅内容）用法：

每个 `User` 都有一个未使用的 `option` 属性，可以用来储存用户的详细信息：

`User.setting.get` 方法用于设置用户设置，接受一个任何类型的参数／对象，返回一个 `Promise`。

`User.setting.get` 方法用于获取用户设置，不接受参数，返回一个 `Promise`。`Promise` 会传入先前设置的内容，若为空，将会返回一个空对象。

##### 发布者 —— `User.project`

每个 `User` 实例都会有一个 `project` 属性。里面包含了发布订阅所需要的方法。

`User.project.new` 方法用于创建新的订阅，接受一个对象，返回一个 `Promise`。

属性|类型|描述
:--|:--|:--
catalog|String|目录
name|String|订阅名称
public|Bool|公开？

`User.project.list` 方法用于列出受当前 `User` 实例有管理权的订阅，不接受参数，返回一个 `Promise`。`Promise` 会传入一个 `Project` 数组，内容是 `Project` 对象。

`User.project.set` 方法用于管理订阅。接受一个字符串参数，订阅 ID。（即：`Project._id`），返回一个对象，包含用于管理订阅的方法：

方法|描述
:--|:--
`name(String name)`|设置订阅名称，返回一个 `Promise`。
`catalog(String cat)`|设置订阅目录，返回一个 `Promise`。
`content(cont)`|设置内容，可以为任何对象／类型，返回一个 `Promise`。
`public(Bool public)`|设置公开状态，返回一个 `Promise`。
`admin.add(Int uid)`|添加管理员，返回一个 `Promise`。
`admin.remove(Int uid)`|移除管理员，返回一个 `Promise`。

`User.project.set` 方法用于删除订阅，接受一个字符串参数，订阅 ID。（即：`Project._id`），返回一个 `Promise`。

##### 订阅者 —— `User.subscription`

`User.subscription.find` 方法用于搜索订阅，接受一个对象作为参数，返回一个 `Promise`。`Promise` 会传入一个 `Project` 数组，内容是符合条件的 `Project` 对象。

属性|类型|描述
:--|:--|:--
catalog|String|目录
name|String|订阅名称

只有公开（即：`Project.public == true`）的订阅会被列出。

`User.subscription.subscribe` 方法用于为当前 `User` 实例订阅项目。接受一个字符串参数，订阅 ID。（即：`Project._id`），返回一个 `Promise`。

`User.subscription.unsubscribe` 方法用于取消当前 `User` 实例的订阅，接受一个字符串参数，订阅 ID。（即：`Project._id`），返回一个 `Promise`。

`User.subscription.list_subscribed` 方法用于列出当前 `User` 实例的订阅，不接受参数，返回一个 `Promise`。`Promise` 会传入一个 `Subscriber` 对象，代表当前用户的订阅身份。

`User.subscription.get` 方法用于获取当前 `User` 实例的订阅，不接受参数，返回一个 `Promise`。`Promise` 会传入一个 `Project` 数组，是用户所订阅的 `Project` 对象的当前版本。

示例：

```Javascript
> var User = new NS({userdb: 'user.db', projectdb: 'project.db'});
undefined
> (new User(1234)).project.new({catalog: 'dev', name: 'dev_status', public: true})
Promise { <pending> }
> (new User(1234)).project.list().then(p => console.log(p))
Promise { <pending> }
> [ { name: 'dev_status',
    catalog: 'dev',
    admins: [ 1234 ],
    public: true,
    _id: 'MfuyQpaHhE7jlsmA' } ]
> (new User(4321)).project.list().then(p => console.log(p));
Promise { <pending> }
> []
> (new User(1234)).project.set('MfuyQpaHhE7jlsmA').admin.add(4321);
Promise { <pending> }
> (new User(4321)).project.list().then(p => console.log(p));
Promise { <pending> }
> [ { name: 'dev_status',
    catalog: 'dev',
    admins: [ 1234, 4321 ],
    public: true,
    _id: 'MfuyQpaHhE7jlsmA' } ]
> (new User(4321)).project.set('MfuyQpaHhE7jlsmA').content({good: true, info: "It works."})
Promise { <pending> }
> (new User(5678)).subscription.find({name: 'dev_status'}).then(s => console.log(s))
Promise { <pending> }
> [ { name: 'dev_status',
    catalog: 'dev',
    admins: [ 1234, 4321 ],
    public: true,
    _id: 'MfuyQpaHhE7jlsmA',
    content: { good: true, info: 'It works.' } } ]
> (new User(5678)).subscription.subscribe('MfuyQpaHhE7jlsmA')
Promise { <pending> }
> (new User(1234)).project.set('MfuyQpaHhE7jlsmA').content({good: false, info:"too bad."});
Promise { <pending> }
> (new User(5678)).subscription.get().then(p => console.log(p));
Promise { <pending> }
> [ { name: 'dev_status',
    catalog: 'dev',
    admins: [ 1234, 4321 ],
    public: true,
    _id: 'MfuyQpaHhE7jlsmA',
    content: { good: false, info: 'too bad.' } } ]
```
