In the [New React Architecture](../preparation/newConstructure.html#react16 Architecture) section, we introduced the `Scheduler`, which contains two functions:

1. Time slice

2. Priority scheduling

In this section we learn how these two functions are implemented in `Scheduler`.

## Time slicing principle

The essence of `time slice` is to simulate the realization of [requestIdleCallback](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestIdleCallback).

Excluding the "browser reflow/redraw", the following figure is the timing that can be used to execute `JS` in one frame of the browser.

```js
A task (macro task) - all jobs (micro tasks) in the queue - requestAnimationFrame - browser reflow/redraw - requestIdleCallback
```

`requestIdleCallback` is called when there is free time in the current frame after "browser reflow/redraw".

The browser does not provide other APIs that can be called at the same timing (after browser reflow/redraw) to simulate its implementation.

The only `API` that can precisely control the timing of the call is `requestAnimationFrame`, which allows us to execute `JS` before "browser reflow/redraw".

This is why we usually use this `API` to implement `JS` animation-this is the last time before the browser renders, so the animation can be rendered quickly.

Therefore, the second best thing is that the `time slicing` function of `Scheduler` is realized by `task` (macro task).

The most common `task` is definitely `setTimeout`. But there is a `task` that is more timely than `setTimeout`, and that is [MessageChannel](https://developer.mozilla.org/zh-CN/docs/Web/API/MessageChannel).

So `Scheduler` will execute the callback function that needs to be executed as the callback of `MessageChannel`. If the current host environment does not support `MessageChannel`, use `setTimeout`.

> You can see the implementation of `MessageChannel` in [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/scheduler/src/forks/SchedulerHostConfig.default.js#L228-L234). [Here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/scheduler/src/forks/SchedulerHostConfig.default.js#L47-L55) see the implementation of `setTimeout`

In the `render` stage of `React`, when the `Concurrent Mode` is turned on, before each traversal, the `shouldYield` method provided by the `Scheduler` will be used to determine whether the traversal needs to be interrupted so that the browser has time to render:

```js
function workLoopConcurrent() {
  // Perform work until Scheduler asks us to yield
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}
```

The basis for whether to interrupt is the most important point is whether the remaining time of each task is used up.

In `Schdeduler`, the initial remaining time allocated to the task is `5ms`.

> You can see the definition of the initial remaining time from [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/scheduler/src/forks/SchedulerHostConfig.default.js#L119)

As the application runs, the executable time allocated to the task will be dynamically adjusted through `fps`.

> You can see the dynamic assignment time from [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/scheduler/src/forks/SchedulerHostConfig.default.js#L172-L187)

This also explains why the [Design Philosophy](../preparation/idea.html#cpu bottleneck) section After enabling the `Concurrent Mode`, the execution time of each task is generally a short period of more than 5ms-every Each time slice is set to 5ms, and the task itself is executed for a short period of time, so the overall time is more than 5ms

<img :src="$withBase('/img/time-slice.png')" alt="long task">

So when `shouldYield` is `true`, how to restart after `performUnitOfWork` is interrupted? We will answer after introducing "priority scheduling".

## Priority scheduling

First, let's understand the source of `priority`. One thing to be clear is that `Scheduler` is a package independent of `React`, so its `priority` is also independent of `React`'s `priority`.

`Scheduler` exposes a method [unstable_runWithPriority](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/scheduler/src/Scheduler.js#L217-L237).

This method accepts a `priority` and a `callback function`. Calling the method of obtaining the `priority` inside the `callback function` will get the `priority` corresponding to the first parameter:

```js
function unstable_runWithPriority(priorityLevel, eventHandler) {
  switch (priorityLevel) {
    case ImmediatePriority:
    case UserBlockingPriority:
    case NormalPriority:
    case LowPriority:
    case IdlePriority:
      break;
    default:
      priorityLevel = NormalPriority;
  }

  var previousPriorityLevel = currentPriorityLevel;
  currentPriorityLevel = priorityLevel;

  try {
    return eventHandler();
  } finally {
    currentPriorityLevel = previousPriorityLevel;
  }
}
```
As you can see, there are 5 priority levels inside the `Scheduler`.

In `React`, wherever `priority` scheduling is involved, `unstable_runWithPriority` will be used.

For example, we know that the `commit` phase is executed synchronously. As you can see, the priority of the `commitRoot` method at the starting point of the `commit` phase is `ImmediateSchedulerPriority`.

`ImmediateSchedulerPriority` is an alias of `ImmediatePriority`, which is the highest priority and will be executed immediately.

```js
function commitRoot(root) {
  const renderPriorityLevel = getCurrentPriorityLevel();
  runWithPriority(
    ImmediateSchedulerPriority,
    commitRootImpl.bind(null, root, renderPriorityLevel),
  );
  return null;
}
```

## The meaning of priority

The most important way for `Scheduler` to expose externally is [unstable_scheduleCallback](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/scheduler/src/Scheduler.js#L279-L359). This method is used to register callback functions with a certain `priority`.

For example, in `React`, it was mentioned before that the callback of `useEffect` would be scheduled in the `beforeMutation` stage of the `commit` stage:

```js
if (!rootDoesHavePassiveEffects) {
  rootDoesHavePassiveEffects = true;
  scheduleCallback(NormalSchedulerPriority, () => {
    flushPassiveEffects();
    return null;
  });
}
```

The callback here is scheduled through `scheduleCallback`, and the priority is `NormalSchedulerPriority`, that is, `NormalPriority`.

What does different `priority` mean? Different `priority` means task expiration time of different duration:

```js
var timeout;
switch (priorityLevel) {
  case ImmediatePriority:
    timeout = IMMEDIATE_PRIORITY_TIMEOUT;
    break;
  case UserBlockingPriority:
    timeout = USER_BLOCKING_PRIORITY_TIMEOUT;
    break;
  case IdlePriority:
    timeout = IDLE_PRIORITY_TIMEOUT;
    break;
  case LowPriority:
    timeout = LOW_PRIORITY_TIMEOUT;
    break;
  case NormalPriority:
  default:
    timeout = NORMAL_PRIORITY_TIMEOUT;
    break;
}

var expirationTime = startTime + timeout;
```

in:

```js
// Times out immediately
var IMMEDIATE_PRIORITY_TIMEOUT = -1;
// Eventually times out
var USER_BLOCKING_PRIORITY_TIMEOUT = 250;
var NORMAL_PRIORITY_TIMEOUT = 5000;
var LOW_PRIORITY_TIMEOUT = 10000;
// Never times out
var IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;
```

As you can see, if the `priority` of a task is `ImmediatePriority`, corresponding to `IMMEDIATE_PRIORITY_TIMEOUT` is `-1`, then

```js
var expirationTime = startTime-1;
```

Then the expiration time of the task is shorter than the current time, indicating that it has expired and needs to be executed immediately.

## Sorting of different priority tasks

We already know that `priority` means the expiration time of the task. Imagine a large `React` project. At a certain moment, there are many `tasks` with different `priority`, corresponding to different expiration times.

At the same time, because tasks can be delayed, we can divide these tasks into different types according to whether they are delayed:

-Tasks are ready

-Not ready task

```js
  if (typeof options ==='object' && options !== null) {
    var delay = options.delay;
    if (typeof delay ==='number' && delay> 0) {
      // task is delayed
      startTime = currentTime + delay;
    } else {
      startTime = currentTime;
    }
  } else {
    startTime = currentTime;
  }
```

Therefore, there are two queues in `Scheduler`:

-timerQueue: save tasks that are not ready

-taskQueue: save ready tasks

Whenever a new task that is not ready is registered, we insert it into the `timerQueue` and rearrange the order of the tasks in the `timerQueue` according to the start time.

When a task in `timerQueue` is ready, that is, `startTime <= currentTime`, we take it out and add it to `taskQueue`.

Take out the earliest expired task in `taskQueue` and execute it.

In order to find the earliest task in the two queues in O(1) complexity, `Scheduler` uses [small top heap](https://www.cnblogs.com/lanhaicode/p/10546257.html) to achieve `Priority queue`.

> You can see the implementation of `priority queue` in [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/scheduler/src/SchedulerMinHeap.js)

So far, we understand the realization of `Scheduler`. Now you can answer the questions mentioned in the introduction of `time slice`:

> So when shouldYield is true, how to restart after performUnitOfWork is interrupted?

In the step of "take out the earliest expired task in `taskQueue` and execute it", there are the following key steps:

```js
const continuationCallback = callback(didUserCallbackTimeout);
currentTime = getCurrentTime();
if (typeof continuationCallback ==='function') {
  // continuationCallback is a function
  currentTask.callback = continuationCallback;
  markTaskYield(currentTask, currentTime);
} else {
  if (enableProfiling) {
    markTaskCompleted(currentTask, currentTime);
    currentTask.isQueued = false;
  }
  if (currentTask === peek(taskQueue)) {
    // Clear the current task
    pop(taskQueue);
  }
}
advanceTimers(currentTime);
```

When the return value `continuationCallback` after the execution of the registered callback function is `function`, `continuationCallback` will be used as the callback function of the current task.

If the return value is not `function`, the task currently being executed will be cleared out of `taskQueue`.

The function scheduled in the `render` phase is `performConcurrentWorkOnRoot`, and there is such a piece of code at the end of the function:

```js
if (root.callbackNode === originalCallbackNode) {
  // The task node scheduled for this root is the same one that's
  // currently executed. Need to return a continuation.
  return performConcurrentWorkOnRoot.bind(null, root);
}
```

As you can see, when certain conditions are met, the function will take itself as the return value.

> You can see this code in [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberWorkLoop.old.js#L850-L854)

## Summarize

As we mentioned earlier, `Scheduler` and `React` are two sets of `priority` mechanisms. So how does the `priority` in `React` work? We will introduce it in the next section.