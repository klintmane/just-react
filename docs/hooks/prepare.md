::: warning note

Before starting this chapter, you need to understand the basic usage of `Hooks`.

If you haven't used `Hooks`, you can start from [Official Documentation](https://zh-hans.reactjs.org/docs/hooks-intro.html).

:::

You can learn about the design motivation of `Hooks` from [here](https://zh-hans.reactjs.org/docs/hooks-intro.html#motivation). As a `framework user`, understanding the `design motivation` is enough for our daily development.

However, in order to better understand the `source architecture` of `Hooks`, we need to change our identities and look at the `design concept` of `Hooks` from the perspective of a `framework developer`.

## Chat from LOGO

<img :src="$withBase('/img/logo.png')" alt="LOGO">

The pattern of `React` `LOGO` is a symbol representing `atom` (`atom`). Everything in the world is composed of `atoms`, and the `types` and `attributes` of `atoms` determine the appearance and performance of things.

Similarly, in `React`, we can split `UI` into many independent units, and each unit is called `Component`. These `Attributes` and `Types` of `Component` determine the appearance and performance of `UI`.

Ironically, `atom` means `indivisible` (`indivisible`) in Greek, but then scientists discovered smaller particles-electrons (`electron`) in atoms. The electron can explain very well how the `atom` works.

In `React`, we can say that `ClassComponent` is a kind of `atom`.

But for `Hooks`, it is not so much an `atom`, it is better to say that it is an `electron` closer to the `running law` of things.

We know that the architecture of `React` follows the operating process of `schedule-render-commit`, which is the bottom layer of `React` in the world.

`ClassComponent` is the `atom` of the world of `React`, and its `life cycle` (`componentWillXXX`/`componentDidXXX`) is a higher level of abstraction to intervene in the running process of `React`. This is done for convenience. Frame users` easier to get started.

Compared to the higher level of abstraction of `ClassComponent`, `Hooks` is closer to the various concepts running inside `React` (`state` | `context` | `life-cycle`).

As a developer who uses the `React` technology stack, when we first learn about `Hooks`, whether it is official documents or experienced colleagues around us, we always use the life cycle of `ClassComponent` to compare the execution timing of `Hooks API`.

This is certainly a good way to get started, but when we use `Hooks` proficiently, we will find that the two concepts have a lot of separation, and they are not concepts that can replace each other at the same level of abstraction.

For example: What is the `Hooks` that replaces `componentWillReceiveProps`?

Some students may answer, it’s `useEffect`:

```js
  useEffect( () => {
    console.log('something updated');
  }, [props.something])
```

But `componentWillReceiveProps` is executed in the `render phase`, and `useEffect` is executed asynchronously after the rendering is completed in the `commit phase`.

> This article can help you better understand `componentWillReceiveProps`: [Deep source code analysis of componentWillXXX why UNSAFE](https://juejin.im/post/5f05a3e25188252e5c576cdb)

Therefore, looking at `Hooks` from the perspective of the law of source code operation may be a better angle. This is why it is said that `Hooks` are the `electrons` of the `React` world instead of the `atoms`.

> The above insights are referenced from [React Core Team Dan's speech at React Conf2018](https://www.youtube.com/watch?v=dpw9EHDh2bM&feature=youtu.be)

<!-- ## Hooks Design Motivation

So is there really a `feature` that `Hooks` can do but `ClassComponent` can't?

Yes.

Let's take another look at the `Fiber structure` that `React` took three years to refactor. As we said in the previous chapter, one of the main goals of this refactoring is to **make the update asynchronous and interruptible**.

Now let's look at another big purpose: **Make the same component can have multiple states at the same time, that is, the same component can have multiple timelines**.

<img :src="$withBase('/img/hooks-mental.png')" alt="hooks design concept">

> [React Core Team Sebastian talks about Hooks design motivation](https://twitter.com/sebmarkbage/status/1084539728743956481)

`fiber` can be literally translated as `fiber`.

<img :src="$withBase('/img/lightfiber.jpg')" alt="fiber">

It can be seen that there are multiple glass cores working at the same time inside a bunch of `optical fibers`. In `React`, each glass core represents a timeline of `Component`.

Because `ClassComponent` follows the principle of `OOP`, `logic` and `state` are coupled inside the `instance`, and it is impossible to have multiple `states` at the same time (that is, there is only one `this.state` at the same time).

For `Hooks`, `FunctionComponent` conforms to the programming idea of ​​`FP` (that is, `stateless`), and the `state` of `Hooks` is stored in the `closure` when the component is updated. In other words, the same `FunctionComponent` can have multiple `states` stored in different `closures` at the same time.

::: details Multiple timelines Demo

You can use [useDeferredValue](https://zh-hans.reactjs.org/docs/concurrent-mode-reference.html#usedeferredvalue) to make a certain `state` of the same component have multiple timelines at the same time.

The overlapping time of different timelines varies depending on the performance of the **user equipment**.

In the Demo, you can see the `value` and `update time` of different `status` from the console

[Demo](https://codesandbox.io/s/friendly-bush-hk5co)

::: -->

## Summarize

`Concurrent Mode` is the future development direction of `React`, and `Hooks` is the construction method of `Component` that can maximize the potential of `Concurrent Mode`.

As Dan said at the end of the `React Conf 2018` speech: You can see these `electronic flight tracks` surrounding the `core` from the `LOGO` of `React`, and `Hooks` may always be there.