In the last chapter [last section](../process/completeWork.html#end of process) we introduced that the `commitRoot` method is the starting point of the work in the `commit phase`. `fiberRootNode` will be used as a parameter.

```js
commitRoot(root);
```

A singly linked list `effectList` of `Fiber nodes` that need to perform `side effects` is saved on `rootFiber.firstEffect`, and the changed `props` are saved in the `updateQueue` of these `Fiber nodes`.

The `DOM operations` corresponding to these `side effects` are executed in the `commit` phase.

In addition, some life cycle hooks (such as `componentDidXXX`) and `hook` (such as `useEffect`) need to be executed in the `commit` phase.

The main work of the `commit` phase (that is, the workflow of the `Renderer`) is divided into three parts:

-before mutation stage (before performing `DOM` operation)

-Mutation phase (execute `DOM` operation)

-Layout stage (after performing `DOM` operation)

You can see the complete code of the `commit` phase from [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L2001)

There is some extra work before the `before mutation phase` and after the `layout phase`, which involves, for example, the triggering of `useEffect`, the resetting of `priority-related`, and the binding/unbinding of `ref`.

These are currently super-class content for us. For the completeness of the content, we will briefly introduce them in this section.



## before mutation

In the `commitRootImpl` method, until the first sentence of `if (firstEffect !== null)` belongs to before `before mutation`.

Let’s take a look at the work he did. Now you don’t need to understand them:

```js
do {
    // Trigger the useEffect callback and other synchronization tasks. Since these tasks may trigger a new rendering, it is necessary to traverse the execution until there are no tasks
    flushPassiveEffects();
  } while (rootWithPendingPassiveEffects !== null);

  // root refers to fiberRootNode
  // root.finishedWork refers to the rootFiber of the current application
  const finishedWork = root.finishedWork;

  // All variable names with lane are priority related
  const lanes = root.finishedLanes;
  if (finishedWork === null) {
    return null;
  }
  root.finishedWork = null;
  root.finishedLanes = NoLanes;

  // Reset the callback function bound to the Scheduler
  root.callbackNode = null;
  root.callbackId = NoLanes;

  let remainingLanes = mergeLanes(finishedWork.lanes, finishedWork.childLanes);
  // Reset priority related variables
  markRootFinished(root, remainingLanes);

  // Clear the completed discrete updates, for example: the update triggered by the user's mouse click.
  if (rootsWithPendingDiscreteUpdates !== null) {
    if (
      !hasDiscreteLanes(remainingLanes) &&
      rootsWithPendingDiscreteUpdates.has(root)
    ) {
      rootsWithPendingDiscreteUpdates.delete(root);
    }
  }

  // reset global variables
  if (root === workInProgressRoot) {
    workInProgressRoot = null;
    workInProgress = null;
    workInProgressRootRenderLanes = NoLanes;
  } else {
  }

  // Assign effectList to firstEffect
  // Since the effectList of each fiber only contains his descendants
  // So if the root node has an effectTag, it will not be included
  // So here insert the root node of the effectTag into the end of the effectList
  // This will ensure that the fibers with effect are in the effectList
  let firstEffect;
  if (finishedWork.effectTag> PerformedWork) {
    if (finishedWork.lastEffect !== null) {
      finishedWork.lastEffect.nextEffect = finishedWork;
      firstEffect = finishedWork.firstEffect;
    } else {
      firstEffect = finishedWork;
    }
  } else {
    // The root node has no effectTag
    firstEffect = finishedWork.firstEffect;
  }
```

It can be seen that before `before mutation`, it mainly did some variable assignment and state reset work.

For this long list of codes, we only need to pay attention to the last assigned value of `firstEffect`, which will be used in the three sub-phases of `commit`.

## After layout

Next, let's take a brief look at the code after the execution of the `layout` stage. Now you don't need to understand them:

```js
const rootDidHavePassiveEffects = rootDoesHavePassiveEffects;

// useEffect related
if (rootDoesHavePassiveEffects) {
  rootDoesHavePassiveEffects = false;
  rootWithPendingPassiveEffects = root;
  pendingPassiveEffectsLanes = lanes;
  pendingPassiveEffectsRenderPriority = renderPriorityLevel;
} else {}

// Performance optimization related
if (remainingLanes !== NoLanes) {
  if (enableSchedulerTracing) {
    // ...
  }
} else {
  // ...
}

// Performance optimization related
if (enableSchedulerTracing) {
  if (!rootDidHavePassiveEffects) {
    // ...
  }
}

// ... synchronizing tasks that detect infinite loops
if (remainingLanes === SyncLane) {
  // ...
}

// Called before leaving the commitRoot function to trigger a new schedule to ensure that any additional tasks are scheduled
ensureRootIsScheduled(root, now());

// ... deal with uncaught errors and boundary issues left by the old version


// Execute the synchronization task, so that the synchronization task does not need to wait until the next event loop to execute
// For example, the update created by executing setState in componentDidMount will be executed synchronously here
// or useLayoutEffect
flushSyncCallbackQueue();

return null;
```


> You can see this code in [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L2195)

It mainly includes three points:
1. Processing related to `useEffect`.

We will explain it when we explain the `layout stage`.

2. Performance tracking related.

There are many variables related to `interaction` in the source code. They are all related to tracking the rendering time and performance of `React`, in [Profiler API](https://zh-hans.reactjs.org/docs/profiler.html) and [DevTools](https://github.com/ facebook/react-devtools/pull/1069).

> You can see the definition of [interaction] here (https://gist.github.com/bvaughn/8de925562903afd2e7a12554adcdda16#overview)

3. In the `commit` phase, some life cycle hooks (such as `componentDidXXX`) and `hook` (such as `useLayoutEffect`, `useEffect`) will be triggered.

In these callback methods, a new update may be triggered, and the new update will start a new `render-commit` process. Consider the following Demo:

::: details useLayoutEffect Demo

In this Demo, we click on the number on the page, and the status will first change to 0, and then it will become a random number in the `useLayoutEffect` callback. However, the number on the page does not become 0, but directly becomes a new random number.

This is because `useLayoutEffect` will execute the callback synchronously in the `layout phase`. In the callback, we triggered the status update `setCount(randomNum)`, which will reschedule a synchronization task.

The task will be executed synchronously at the penultimate line of the above `commitRoot`.

```js
flushSyncCallbackQueue();
```

So we can't see the element on the page becomes 0 first.

If you change to `useEffect`, click a few more times to see the difference.

[Follow the public account](../me.html), backstage reply **908** to get the online Demo address

:::