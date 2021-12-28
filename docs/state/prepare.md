After studying in the previous chapters, we finally have enough pre-knowledge to understand the entire process of **status update**.

In this chapter, we look at how several common methods of triggering **status update** accomplish their work.

## Several key nodes

Before starting to learn, we first understand a few key nodes in the source code (that is, the calls of several key functions). Through the study of this chapter, we will string together the call paths of these key nodes.

Let's start with the concepts we are familiar with.

### The beginning of the render phase

We mentioned in the [render stage process overview section](../process/reconciler.html),

The `render phase` starts with the call of the `performSyncWorkOnRoot` or `performConcurrentWorkOnRoot` method. It depends on whether the update is synchronous or asynchronous.

### The beginning of the commit phase

We mentioned in the [commit stage process overview section](../renderer/prepare.html),

The `commit phase` starts with the call of the `commitRoot` method. Among them, `rootFiber` will be used as a parameter.

We already know that after the completion of the `render phase`, it will enter the `commit phase`. Let us continue to complete the path from `trigger status update` to `render phase`.

```sh
Trigger status update (call different methods according to the scene)

    |
    |
    v

    ?

    |
    |
    v

render phase (`performSyncWorkOnRoot` or `performConcurrentWorkOnRoot`)

    |
    |
    v

commit phase (`commitRoot`)
```

### Create Update Object

In `React`, there are the following methods to trigger status updates (excluding `SSR` related):

-ReactDOM.render

-this.setState

-this.forceUpdate

-useState

-useReducer

These methods are called in different scenarios, how do they access the same set of **status update mechanism**?

The answer is: every time `status update` will create an object that saves **update status related content**, we call it `Update`. In the `beginWork` of the `render phase`, a new `state` will be calculated based on the `Update`.

We will explain `Update` in detail in the next section.

### From fiber to root

Now the `Update` object is included on the `fiber` that triggers the status update.

We know that the `render phase` starts from the `rootFiber` and traverses downwards. So how do you get the `rootFiber` from the `fiber` that triggered the status update?

The answer is: call the `markUpdateLaneFromFiberToRoot` method.

> You can see the source code of `markUpdateLaneFromFiberToRoot` from [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L636)

The work done by this method can be summarized as follows: traverse upward from the fiber that triggered the status update to rootFiber, and return to rootFiber.

Since different update priorities are not the same, the priority of the traversed `fiber` will also be updated during the process. This is super-class content for us currently.

### Scheduling updates

Now we have a `rootFiber`, and a `Fiber node` in the `Fiber tree` corresponding to this `rootFiber` contains an `Update`.

Next, notify the `Scheduler` to decide whether to schedule this update in a **synchronous** or **asynchronous** mode according to the priority of **update**.

The method called here is `ensureRootIsScheduled`.

The following is the core piece of code of `ensureRootIsScheduled`:

```js
if (newCallbackPriority === SyncLanePriority) {
  // The task has expired and the render phase needs to be executed synchronously
  newCallbackNode = scheduleSyncCallback(
    performSyncWorkOnRoot.bind(null, root)
  );
} else {
  // Asynchronously execute the render phase according to task priority
  var schedulerPriorityLevel = lanePriorityToSchedulerPriority(
    newCallbackPriority
  );
  newCallbackNode = scheduleCallback(
    schedulerPriorityLevel,
    performConcurrentWorkOnRoot.bind(null, root)
  );
}
```

> You can see the source code of `ensureRootIsScheduled` from [here](https://github.com/facebook/react/blob/b6df4417c79c11cfb44f965fab55b573882b1d54/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L602)

Among them, `scheduleCallback` and `scheduleSyncCallback` will call the scheduling method provided by `Scheduler` to schedule the callback function according to the `priority`.

As you can see, the callback function scheduled here is:

```js
performSyncWorkOnRoot.bind(null, root);
performConcurrentWorkOnRoot.bind(null, root);
```

That is, the entry function of the `render phase`.

At this point, the `status update` is connected with the well-known `render phase`.

## Summarize

Let us sort out the key nodes of the entire call path of `status update`:

```sh
Trigger status update (call different methods according to the scene)

    |
    |
    v

Create an Update object (explained in the next three sections)

    |
    |
    v

From fiber to root (`markUpdateLaneFromFiberToRoot`)

    |
    |
    v

Schedule update (`ensureRootIsScheduled`)

    |
    |
    v

render phase (`performSyncWorkOnRoot` or `performConcurrentWorkOnRoot`)

    |
    |
    v

commit phase (`commitRoot`)
```

## Summarize

In this section, we understand the entire process of **status update**.

In the next three sections, we will spend a lot of time explaining the working mechanism of `Update`, because it is one of the core mechanisms of `React concurrent mode`.