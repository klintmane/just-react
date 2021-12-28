In [ReactDOM.render](../state/reactdom.html#react%E7%9A%84%E5%85%B6%E4%BB%96%E5%85%A5%E5%8F%A3%E5% In section 87%BD%E6%95%B0), we introduced the current three entry functions of `React`. Daily development mainly uses `Legacy Mode` (created by `ReactDOM.render`).

From [React v17.0 officially released! ](https://mp.weixin.qq.com/s/zrrqldzRbcPApga_Cp2b8A) As you can see in the article, `v17.0` does not contain new features. The reason is that the main work of `v17.0` lies in the support of `Concurrent Mode` in the source code. So the `v17` version is also called the "stepping stone" version.

You can learn about its basic concepts from the official website [Introduction to Concurrent Mode](https://zh-hans.reactjs.org/docs/concurrent-mode-intro.html).

One sentence summary:

> Concurrent mode is a set of new features of React, which can help the application to remain responsive and make appropriate adjustments according to the user's device performance and network speed.

`Concurrent Mode` is the driving force behind the refactoring of `Fiber architecture` in the past 2 years by `React`, and it is also the future development direction of `React`.

It is foreseeable that when `v17` perfectly supports `Concurrent Mode`, `v18` will usher in a large wave of libraries based on `Concurrent Mode`.

The underlying foundation determines the implementation of the upper layer API. Next, let us understand what components are included in Concurrent Mode from the bottom up, and what capabilities can it exert?

## Underlying Architecture-Fiber Architecture

From [Design Concept](../preparation/idea.html), we learned that the most critical point for implementing `Concurrent Mode` is to achieve asynchronous and interruptible updates.

Based on this premise, `React` spent 2 years refactoring to complete the `Fiber` architecture.

The significance of the `Fiber` architecture is that it uses a single `component` as a `unit of work`, making it possible to "asynchronously interruptible updates" with the granularity of `components`.

## The driving force of the architecture-Scheduler

If we run the `Fiber` architecture synchronously (via `ReactDOM.render`), the `Fiber` architecture is the same as before the refactoring.

But when we cooperate with `time slicing`, we can allocate a `runtime` for each `unit of work` according to the performance of the host environment, so as to realize "asynchronous interruptible update".

Thus, [scheduler](https://github.com/facebook/react/tree/master/packages/scheduler) (scheduler) was produced.

## Architecture operation strategy-lane model

So far, `React` can control `Update` to run/interrupt/continue running in the `Fiber` architecture.

Based on the current architecture, when an `update` is interrupted in the running process, it will continue to run after a period of time, which is called "asynchronous interruptible update".

When an `update` is interrupted during the running process, and a new `update` is restarted, we can say: the next `update` interrupted the previous `update`.

This is the concept of `priority`: the `priority` of the next `update` is higher, and he interrupted the previous `update` in progress.

How can multiple `priority`s interrupt each other? Can the `priority` be raised or lowered? What `priority` should be given to this `update`?

This requires a model to control the relationship and behavior between different `priorities`, so the `lane` model was born.

## Upper implementation

Now we can say:

> From the source level, Concurrent Mode is a controllable "multi-priority update architecture".

So what interesting functions can be achieved based on this architecture? Let's give a few examples:

### batchedUpdates

If we trigger multiple `updates` in one event callback, they will be merged into one `update` for processing.

The execution of the following code will only trigger an update once:

```js
onClick() {
  this.setState({stateA: 1});
  this.setState({stateB: false});
  this.setState({stateA: 2});
}
```

This optimized way of merging multiple `updates` is called `batchedUpdates`.

`batchedUpdates` existed in a very early version, but the previous implementation has many limitations (`updates` out of the current context will not be merged).

In `Concurrent Mode`, updates are merged based on `priority`, which is more widely used.

### Suspense

[Suspense](https://zh-hans.reactjs.org/docs/concurrent-mode-suspense.html) can show a `pending` status when the component requests data. Render the data after the request is successful.

Essentially, the component subtree in `Suspense` has a lower priority than other parts of the component tree.

### useDeferredValue

[useDeferredValue](https://en .

example:

```js
const deferredValue = useDeferredValue(value, {timeoutMs: 2000 });
```

Inside `useDeferredValue`, `useState` is called and an `update` is triggered.

This time, the `priority` of `update` is very low, so if there is currently an `update` in progress, it will not be affected by the `update` produced by `useDeferredValue`. So `useDeferredValue` can return the delayed value.

When the `update` generated by `useDeferredValue` has not been performed after the `timeoutMs` is exceeded (it has been interrupted because the `priority` is too low), a high priority `update` will be triggered again.

## Summarize

In addition to the implementation described above, I believe that in the future `React` will develop more gameplay based on `Concurrent Mode`.

The `Fiber` architecture has been studied in the previous chapters. Therefore, in the next part of this chapter, we will explain Concurrent Mode from the bottom up, from the architecture to the implementation in the context of the above.