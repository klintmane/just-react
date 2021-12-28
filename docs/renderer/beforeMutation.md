Before this section officially starts, let us review what we have learned so far in the next chapter.

The stage in which the `Renderer` works is called the `commit` stage. The `commit` phase can be divided into three sub-phases:

-before mutation stage (before performing `DOM` operation)

-Mutation phase (execute `DOM` operation)

-Layout stage (after performing `DOM` operation)

In this section, we look at what is done in the `before mutation phase` (before performing the `DOM` operation).

## Overview

The code of the `before mutation phase` is very short, the whole process is to traverse the `effectList` and call the `commitBeforeMutationEffects` function to process.

> This part [source code is here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L2104-L2127). To increase readability, irrelevant logic has been removed from the sample code

```js
// Save the previous priority, execute it at the synchronization priority, and restore the previous priority after execution
const previousLanePriority = getCurrentUpdateLanePriority();
setCurrentUpdateLanePriority(SyncLanePriority);

// Mark the current context as CommitContext as a sign of the commit phase
const prevExecutionContext = executionContext;
executionContext |= CommitContext;

// handle the focus state
focusedInstanceHandle = prepareForCommit(root.containerInfo);
shouldFireAfterActiveInstanceBlur = false;

// The main function of the beforeMutation stage
commitBeforeMutationEffects(finishedWork);

focusedInstanceHandle = null;
```

We focus on what the main function `commitBeforeMutationEffects` does in the `beforeMutation` stage.

## commitBeforeMutationEffects

General code logic:

```js
function commitBeforeMutationEffects() {
  while (nextEffect !== null) {
    const current = nextEffect.alternate;

    if (!shouldFireAfterActiveInstanceBlur && focusedInstanceHandle !== null) {
      // ...focus blur related
    }

    const effectTag = nextEffect.effectTag;

    // call getSnapshotBeforeUpdate
    if ((effectTag & Snapshot) !== NoEffect) {
      commitBeforeMutationEffectOnFiber(current, nextEffect);
    }

    // Scheduling useEffect
    if ((effectTag & Passive) !== NoEffect) {
      if (!rootDoesHavePassiveEffects) {
        rootDoesHavePassiveEffects = true;
        scheduleCallback(NormalSchedulerPriority, () => {
          flushPassiveEffects();
          return null;
        });
      }
    }
    nextEffect = nextEffect.nextEffect;
  }
}
```

The whole can be divided into three parts:

1. Process the `autoFocus` and `blur` logic after rendering/deleting the `DOM node`.

2. Call the `getSnapshotBeforeUpdate` life cycle hook.

3. Schedule `useEffect`.

Let's explain the next 2 and 3 points.

## Call getSnapshotBeforeUpdate

`commitBeforeMutationEffectOnFiber` is an alias of `commitBeforeMutationLifeCycles`.

In this method, `getSnapshotBeforeUpdate` is called.

> You can see this logic in [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberCommitWork.old.js#L222)

Starting with `React`v16, `UNSAFE_` prefix is ​​added before the `componentWillXXX` hook.

The reason is that after `Stack Reconciler` is refactored to `Fiber Reconciler`, the tasks in the `render phase` may be interrupted/restarted, and the corresponding component may be hooked in the life cycle of the `render phase` (ie `componentWillXXX`) Triggered multiple times.

This behavior is inconsistent with `React`v15, so it is marked as `UNSAFE_`.

> For more detailed explanation, please refer to [here](https://juejin.im/post/6847902224287285255#comment)

To this end, `React` provides an alternative lifecycle hook `getSnapshotBeforeUpdate`.

We can see that `getSnapshotBeforeUpdate` is called in the `before mutation phase` in the `commit phase`. Since the `commit phase` is synchronized, there is no problem of multiple calls.


## Scheduling `useEffect`

In these few lines of code, the `scheduleCallback` method is provided by the `Scheduler` module, which is used to schedule a callback function asynchronously with a certain priority.

```js
// Scheduling useEffect
if ((effectTag & Passive) !== NoEffect) {
  if (!rootDoesHavePassiveEffects) {
    rootDoesHavePassiveEffects = true;
    scheduleCallback(NormalSchedulerPriority, () => {
      // trigger useEffect
      flushPassiveEffects();
      return null;
    });
  }
}
```

Here, the callback function that is asynchronously scheduled is the method `flushPassiveEffects` that triggers the `useEffect`.

We next discuss how `useEffect` is dispatched asynchronously, and why it is dispatched asynchronously (rather than synchronously).

### How to schedule asynchronously

Inside the `flushPassiveEffects` method, the `effectList` is obtained from the global variable `rootWithPendingPassiveEffects`.

For specific explanation of `flushPassiveEffects`, please refer to [useEffect and useLayoutEffect section](../hooks/useeffect.html)

In the [completeWork section](../process/completeWork.html#effectlist) we mentioned that the `effectList` stores the `Fiber nodes` that need to perform side effects. The side effects include

-Insert `DOM Node` (Placement)
-Update `DOM node` (Update)
-Delete `DOM node` (Deletion)

In addition, when a `FunctionComponent` contains `useEffect` or `useLayoutEffect`, its corresponding `Fiber node` will also be assigned the value of `effectTag`.

> You can see the `effectTag` related to `hook` from [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactHookEffectTags.js)


Inside the `flushPassiveEffects` method, the `rootWithPendingPassiveEffects` (ie `effectList`) will be traversed to execute the `effect` callback function.

If it is executed directly at this time, `rootWithPendingPassiveEffects === null`.

So when will `rootWithPendingPassiveEffects` be assigned?

In the code snippet of the previous section `after layout`, it will be determined whether to assign `rootWithPendingPassiveEffects` according to `rootDoesHavePassiveEffects === true?`.

```js
const rootDidHavePassiveEffects = rootDoesHavePassiveEffects;
if (rootDoesHavePassiveEffects) {
  rootDoesHavePassiveEffects = false;
  rootWithPendingPassiveEffects = root;
  pendingPassiveEffectsLanes = lanes;
  pendingPassiveEffectsRenderPriority = renderPriorityLevel;
}
```

So the entire `useEffect` asynchronous call is divided into three steps:

1. The `before mutation phase` schedules `flushPassiveEffects` in `scheduleCallback`
2. After the `layout stage`, assign `effectList` to `rootWithPendingPassiveEffects`
3. `scheduleCallback` triggers `flushPassiveEffects`, `flushPassiveEffects` internally traverses `rootWithPendingPassiveEffects`

### Why do we need asynchronous calls

Excerpted from the `React` document [Execution timing of effect](https://zh-hans.reactjs.org/docs/hooks-reference.html#timing-of-effects):

> Unlike componentDidMount and componentDidUpdate, after the browser completes the layout and drawing, the function passed to useEffect will be called delayed. This makes it suitable for many common side-effect scenarios, such as setting up subscriptions and event handling, so operations that block the browser from updating the screen should not be performed in the function.

It can be seen that the main reason for the asynchronous execution of `useEffect` is to prevent blocking the browser rendering during synchronous execution.

## Summarize

After studying in this section, we know that in the `before mutation stage`, the `effectList` will be traversed and executed in turn:

1. Process the `autoFocus` and `blur` logic after rendering/deleting of `DOM node`

2. Call the `getSnapshotBeforeUpdate` life cycle hook

3. Scheduling `useEffect`