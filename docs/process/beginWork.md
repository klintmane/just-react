In the previous section, we learned that the work of the `render phase` can be divided into a "pass" phase and a "return" phase. Among them, the "pass" phase will execute `beginWork`, and the "return" phase will execute `completeWork`. In this section, let's take a look at what the `beginWork` method does in the "pass" phase.


## Method overview

You can see the definition of `beginWork` from [source code here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberBeginWork.new.js#L3075). The entire method is about 500 lines of code.

We already know from the previous section that the job of `beginWork` is to pass in the `current Fiber node` and create a `child Fiber node`. Let's see how to do it from passing parameters.

### View method execution from the reference

```js
function beginWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
  // ... Omit the function body
}
```
Which pass the parameters:
-current: the `Fiber node` of the `Fiber node` corresponding to the current component in the last update, that is, `workInProgress.alternate`
-workInProgress: `Fiber node` corresponding to the current component
-renderLanes: priority is related, and I will explain it when I explain `Scheduler`

From the [Double Buffer Mechanism](./doubleBuffer.html) we know that, except for [`rootFiber`](./doubleBuffer.md#mount%E6%97%B6), the component `mount` is the first time Rendering means that there is no `Fiber node` at the last update of the `Fiber node` corresponding to the current component, that is, `current === null` at the time of `mount`.

When the component is `update`, since it has been `mount` before, so `current !== null`.

So we can use `current === null ?` to distinguish whether the component is in `mount` or `update`.

For this reason, the work of `beginWork` can be divided into two parts:

-When `update`: If `current` exists, the `current` node can be reused when certain conditions are met, so that `current.child` can be cloned as `workInProgress.child` without the need to create a new `workInProgress.child` .

-When `mount`: Except for `fiberRootNode`, `current === null`. Different types of `child Fiber nodes` will be created according to the difference of `fiber.tag`

```js
function beginWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes
): Fiber | null {

  // When updating: If current exists, there may be an optimized path, you can reuse current (that is, the last updated Fiber node)
  if (current !== null) {
    // ... omitted

    // reuse current
    return bailoutOnAlreadyFinishedWork(
      current,
      workInProgress,
      renderLanes,
    );
  } else {
    didReceiveUpdate = false;
  }

  // When mounting: Create different sub-Fiber nodes according to different tags
  switch (workInProgress.tag) {
    case IndeterminateComponent:
      // ... omitted
    case LazyComponent:
      // ... omitted
    case FunctionComponent:
      // ... omitted
    case ClassComponent:
      // ... omitted
    case HostRoot:
      // ... omitted
    case HostComponent:
      // ... omitted
    case HostText:
      // ... omitted
    // ... omit other types
  }
}
```

## update time

We can see that when the following conditions are met, `didReceiveUpdate === false` (that is, the previous updated `sub Fiber` can be directly reused, and there is no need to create a new `sub Fiber`)

1. `oldProps === newProps && workInProgress.type === current.type`, that is, `props` and `fiber.type` remain unchanged
2. `!includesSomeLane(renderLanes, updateLanes)`, that is, the priority of the current `Fiber node` is not enough, it will be introduced when explaining the `Scheduler`

```js
if (current !== null) {
    const oldProps = current.memoizedProps;
    const newProps = workInProgress.pendingProps;

    if (
      oldProps !== newProps ||
      hasLegacyContextChanged() ||
      (__DEV__? WorkInProgress.type !== current.type: false)
    ) {
      didReceiveUpdate = true;
    } else if (!includesSomeLane(renderLanes, updateLanes)) {
      didReceiveUpdate = false;
      switch (workInProgress.tag) {
        // Omit processing
      }
      return bailoutOnAlreadyFinishedWork(
        current,
        workInProgress,
        renderLanes,
      );
    } else {
      didReceiveUpdate = false;
    }
  } else {
    didReceiveUpdate = false;
  }
```
## When mount

When the optimized path is not satisfied, we enter the second part, creating a new `sub Fiber`.

We can see that, depending on the `fiber.tag`, enter the creation logic of different types of `Fiber`.

> You can see the component type corresponding to `tag` from [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactWorkTags.js)

```js
// When mounting: Create different Fiber nodes according to different tags
switch (workInProgress.tag) {
  case IndeterminateComponent:
    // ... omitted
  case LazyComponent:
    // ... omitted
  case FunctionComponent:
    // ... omitted
  case ClassComponent:
    // ... omitted
  case HostRoot:
    // ... omitted
  case HostComponent:
    // ... omitted
  case HostText:
    // ... omitted
  // ... omit other types
}
```

For our common component types, such as (`FunctionComponent`/`ClassComponent`/`HostComponent`), it will eventually enter [reconcileChildren](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler /src/ReactFiberBeginWork.new.js#L233) method.

## reconcileChildren

It can be seen from the function name that this is the core part of the `Reconciler` module. So what did he do?

-For `mount` components, he will create a new `child Fiber node`

-For the component of `update`, he will compare the current component with the corresponding `Fiber node` when the component was last updated (also known as the `Diff` algorithm), and generate a new `Fiber node` from the result of the comparison

```js
export function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  nextChildren: any,
  renderLanes: Lanes
) {
  if (current === null) {
    // For mount components
    workInProgress.child = mountChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderLanes,
    );
  } else {
    // For update components
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren,
      renderLanes,
    );
  }
}
```

As can be seen from the code, like `beginWork`, he also distinguishes `mount` from `update` through `current === null ?`.

No matter which logic goes, he will eventually generate a new child `Fiber node` and assign it to `workInProgress.child` as this `beginWork`[return value](https://github.com/facebook/react/blob/ 1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberBeginWork.new.js#L1158), and used as the [transfer](https://github.com/facebook/react/blob) of `workInProgress` the next time `performUnitOfWork` is executed /1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L1702).

::: warning note
It is worth mentioning that the logic of the two methods of `mountChildFibers` and `reconcileChildFibers` is basically the same. The only difference is: `reconcileChildFibers` will bring the `effectTag` property to the generated `Fiber node`, but `mountChildFibers` will not.
:::



## effectTag

We know that the work of the `render phase` is carried out in memory, and when the work is over, the `Renderer` will be notified of the `DOM` operations that need to be performed. The specific type of `DOM` operation to be performed is stored in `fiber.effectTag`.

> You can see the `DOM` operation corresponding to `effectTag` from [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactSideEffectTags.js)

for example:

```js
// DOM needs to be inserted into the page
export const Placement = /* */ 0b00000000000010;
// DOM needs to be updated
export const Update = /* */ 0b00000000000100;
// DOM needs to be inserted into the page and updated
export const PlacementAndUpdate = /* */ 0b00000000000110;
// DOM needs to be deleted
export const Deletion = /* */ 0b00000000001000;
```

> Through the binary representation of `effectTag`, it is convenient to use bit operation to assign multiple `effect` to `fiber.effectTag`.

Then, if you want to notify the `Renderer` to insert the `DOM node` corresponding to the `Fiber node` into the page, two conditions need to be met:

1. `fiber.stateNode` exists, that is, the corresponding `DOM node` is saved in the `Fiber node`

2. `(fiber.effectTag & Placement) !== 0`, that is, `Placement effectTag` exists in `Fiber node`

We know that when `mount`, `fiber.stateNode === null`, and `mountChildFibers` called in `reconcileChildren` will not assign `effectTag` to `Fiber node`. So how is the above-the-fold rendering done?

For the first question, `fiber.stateNode` will be created in `completeWork`, which we will introduce in the next section.

The answer to the second question is very clever: assuming that `mountChildFibers` will also assign `effectTag`, then it can be predicted that all nodes of the entire `Fiber tree` will have `Placement effectTag` when `mount`. Then, in the `commit phase`, each node will perform an insert operation when executing the `DOM` operation. Such a large number of `DOM` operations are extremely inefficient.

In order to solve this problem, only `rootFiber` will assign the value of `Placement effectTag` when `mount`, and only one insertion operation will be performed during the `commit phase`.

::: details Root Fiber Node Demo
Borrowing the Demo from the previous section, the first `Fiber node` to enter the `beginWork` method is `rootFiber`, and his `alternate` points to `current rootFiber` (that is, he exists `current`).

> Why does the `rootFiber` node have `current` (ie `rootFiber.alternate`), we have already talked about it in [the second step of mount in the section of double buffer mechanism](./doubleBuffer.html)

Due to the existence of `current`, `rootFiber` will follow the logic of `reconcileChildFibers` when `reconcileChildren`.

And then the `Fiber node` created by `beginWork` does not exist in `current` (ie `fiber.alternate === null`), it will follow the logic of `mountChildFibers`

[Follow the public account](../me.html), backstage reply **531** to get the online Demo address
:::

## Reference

`beginWork` flowchart

<img :src="$withBase('/img/beginWork.png')" alt="beginWork flowchart">