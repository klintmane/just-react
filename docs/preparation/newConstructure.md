In the last section we talked about the React15 architecture cannot support asynchronous updates and requires refactoring. So in this section we will learn how the refactored React16 supports asynchronous updates.

## React16 architecture

The React16 architecture can be divided into three layers:

-Scheduler-priority of scheduling tasks, high-quality tasks enter **Reconciler** first
-Reconciler-Responsible for finding the changed components
-Renderer (renderer)-responsible for rendering the changed components to the page

As you can see, compared to React15, React16 has added a new scheduler **Scheduler**, let's get to know him.

### Scheduler

Since we use whether the browser has remaining time as the criterion for task interruption, we need a mechanism to notify us when the browser has remaining time.

In fact, some browsers have implemented this API, which is [requestIdleCallback](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestIdleCallback). But because of the following factors, `React` gave up its use:

-Browser compatibility
-The trigger frequency is unstable and affected by many factors. For example, when our browser switches tabs, the frequency of triggering of the `requestIdleCallback` registered by the previous tab will become very low.

For the above reasons, `React` implements a more complete `requestIdleCallback` polyfill, which is **Scheduler**. In addition to the function of triggering callbacks when idle, **Scheduler** also provides a variety of scheduling priorities for task settings.

> [Scheduler](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/scheduler/README.md) is a library independent of `React`

### Reconciler (Coordinator)

We know that in React15 **Reconciler** processes the virtual DOM recursively. Let's take a look at [Reconciler for React16](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L1673).

We can see that the update work has changed from recursion to a cyclic process that can be interrupted. Each loop calls `shouldYield` to determine if there is any time left.
```js
/** @noinline */
function workLoopConcurrent() {
  // Perform work until Scheduler asks us to yield
  while (workInProgress !== null && !shouldYield()) {
    workInProgress = performUnitOfWork(workInProgress);
  }
}
```

So how does React16 solve the problem of incomplete DOM rendering when the update is interrupted?

In React 16, **Reconciler** and **Renderer** no longer work alternately. When **Scheduler** hands over the task to **Reconciler**, **Reconciler** will mark the changed virtual DOM with a mark representing addition/deletion/update, similar to this:

```js
export const Placement = /* */ 0b0000000000010;
export const Update = /* */ 0b0000000000100;
export const PlacementAndUpdate = /* */ 0b0000000000110;
export const Deletion = /* */ 0b0000000001000;
```

> See [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactSideEffectTags.js) for all tags

The entire **Scheduler** and **Reconciler** work is carried out in memory. Only when all components have completed the work of **Reconciler**, will they be handed over to **Renderer**.

> You can see the official explanation of `React` on React16's new **Reconciler** in [here](https://zh-hans.reactjs.org/docs/codebase-overview.html#fiber-reconciler)

### Renderer

**Renderer** performs the corresponding DOM operation synchronously according to the mark made by **Reconciler** for the virtual DOM.

So, for the Demo we used in the previous section

::: details Multiplication Demo

[Follow the public account](../me.html), backstage reply **222** to get the online Demo address

`state.count = 1`, every time you click the button `state.count++`

The values ​​of the 3 elements in the list are 1, 2, and 3 multiplied by the result of `state.count`
:::

The entire update process in the React16 architecture is:

<img :src="$withBase('/img/process.png')" alt="update process">

The steps in the red box may be interrupted at any time due to the following reasons:

-There are other higher priority tasks that need to be updated first
-There is no time left in the current frame

Since the work in the red box is performed in memory and the DOM on the page is not updated, even if it is repeatedly interrupted, the user will not see the incompletely updated DOM (that is, the situation demonstrated in the previous section).

> In fact, since both **Scheduler** and **Reconciler** are platform-independent, so `React` sent a separate package for them [react-Reconciler](https://www.npmjs.com/package /react-reconciler). You can use this package to implement a `ReactDOM` yourself, see **References** for details
 
## Summarize

Through this section, we know that `React16` adopts the new `Reconciler`.

`Reconciler` adopts the architecture of `Fiber` internally.

What is `Fiber`? What is the relationship between him and `Reconciler` or `React`? We will answer in the next three sections.

## Reference

["English Extranet" Building a Custom React Renderer | Sophie Alpert, former manager of React](https://www.youtube.com/watch?v=CGpMlWVcHok&list=PLPxbbTqCLbGHPxZpw4xj_Wwg8-fdNxJRh&index=7)

:::details Synchronous/Debounce/Throttle/Concurrent performance comparison demo

[Follow the public account](../me.html), backstage reply **323** to get the online Demo address

:::