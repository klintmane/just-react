In this chapter, we will explain how the `Fiber node` is created and the `Fiber tree` is constructed.

The `render phase` starts with the call of the `performSyncWorkOnRoot` or `performConcurrentWorkOnRoot` method. It depends on whether the update is synchronous or asynchronous.

We don't need to learn these two methods yet, we just need to know that the following two methods will be called in these two methods:

```js
// performSyncWorkOnRoot will call this method
function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

// performConcurrentWorkOnRoot will call this method
function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}
```

As you can see, the only difference between them is whether to call `shouldYield`. If there is no time left in the current browser frame, `shouldYield` will stop the loop and continue to traverse until the browser has free time.

`workInProgress` represents the currently created `workInProgress fiber`.

The `performUnitOfWork` method will create the next `Fiber node` and assign it to `workInProgress`, and connect the `workInProgress` with the created `Fiber node` to form a `Fiber tree`.

> You can see the source code of `workLoopConcurrent` from [here](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L1599)

We know that `Fiber Reconciler` is refactored from `Stack Reconciler` to realize interruptible recursion through traversal, so the work of `performUnitOfWork` can be divided into two parts: "recursion" and "recursion".

## "Delivery" stage

First, start from `rootFiber` and traverse down depth first. Call [beginWork method](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactFiberBeginWork.new.js#L3058) for each `Fiber node` that is traversed.

This method will create a `child Fiber node` based on the incoming `Fiber node`, and connect the two `Fiber nodes`.

When traversing to a leaf node (that is, a component without subcomponents), it will enter the "return" phase.

## "Return" stage

In the "return" phase, [completeWork](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactFiberCompleteWork.new.js#L652) will be called to process the `Fiber node`.

When a `Fiber node` finishes executing `completeWork`, if there is a `sibling Fiber node` (ie `fiber.sibling !== null`), it will enter the "handing" phase of its `brother Fiber`.

If there is no `brother Fiber`, it will enter the "return" phase of the `parent Fiber`.

The "pass" and "return" phases will be executed alternately until the "return" to `rootFiber`. At this point, the work of the `render phase` is over.

## example

Examples of the examples in the previous section:

```js
function App() {
  return (
    <div>
      i am
      <span>KaSong</span>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById("root"));
```

The corresponding `Fiber tree` structure:
<img :src="$withBase('/img/fiber.png')" alt="Fiber Architecture">

The `render phase` will be executed in sequence:

```sh
1. rootFiber beginWork
2. App Fiber beginWork
3. div Fiber beginWork
4. "i am" Fiber beginWork
5. "i am" Fiber completeWork
6. span Fiber beginWork
7. span Fiber completeWork
8. div Fiber completeWork
9. App Fiber completeWork
10. rootFiber completeWork
```

::: warning note
The reason why there is no beginWork/completeWork of "KaSong" Fiber is because as a performance optimization method, for `Fiber` that has only a single text child node, `React` will handle it specially.
:::

::: details Try it yourself Demo
I print `fiber.tag` and `fiber.type` when calling `beginWork` and `completeWork`.

You can see all the `tag` definitions of `Fiber node` from [ReactWorkTags.js](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactWorkTags.js).

I believe you will be able to understand the calling sequence of the method after you debug it a few times

[Follow the public account](../me.html), backstage reply **904** to get the online Demo address
:::

::: details perform a recursive version of UnitOfWork

If you convert `performUnitOfWork` into a recursive version, the general code is as follows:

```js
function performUnitOfWork(fiber) {
  // Execute beginWork

  if (fiber.child) {
    performUnitOfWork(fiber.child);
  }

  // execute completeWork

  if (fiber.sibling) {
    performUnitOfWork(fiber.sibling);
  }
}
```

:::

## Summarize

In this section, we introduced the methods that the `render phase` will call. In the next two sections, we will explain the specific work done by `beginWork` and `completeWork`.

## Reference

[The how and why on React's usage of linked list in Fiber to walk the component's tree](https://indepth.dev/the-how-and-why-on-reacts-usage-of-linked-list-in- fiber-to-walk-the-components-tree/)

[Inside Fiber: in-depth overview of the new reconciliation algorithm in React](https://indepth.dev/inside-fiber-in-depth-overview-of-the-new-reconciliation-algorithm-in-react/)