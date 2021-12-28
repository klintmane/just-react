After studying in the first section of this chapter, we know that the `status update` process will first `create an Update object` after the start of the process.

In this section, we will learn the structure and workflow of `Update`.

> You can compare `Update` to a `commit` in the `mental model`.

## Update classification

Let's first understand the structure of `Update`.

First, we classify the components to which the method that can trigger the update belongs:

-ReactDOM.render —— HostRoot

-this.setState —— ClassComponent

-this.forceUpdate —— ClassComponent

-useState —— FunctionComponent

-useReducer —— FunctionComponent

As you can see, a total of three components (`HostRoot` | `ClassComponent` | `FunctionComponent`) can trigger an update.

Because different types of components work differently, there are two different structures of `Update`, among which `ClassComponent` and `HostRoot` share a set of `Update` structure, and `FunctionComponent` uses a single `Update` structure.

Although their structure is different, their working mechanism and workflow are roughly the same. In this section, we introduce the former type of `Update`, the `Update` corresponding to `FunctionComponent` is introduced in the `Hooks` chapter.

## Update structure

`ClassComponent` and `HostRoot` (the corresponding type of `rootFiber.tag`) share the same `Update structure`.

The corresponding structure is as follows:

```js
const update: Update<*> = {
  eventTime,
  lane,
  suspenseConfig,
  tag: UpdateState,
  payload: null,
  callback: null,

  next: null,
};
```

> `Update` is returned by the `createUpdate` method, you can download it from [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactUpdateQueue.old.js#L189) See the source code of `createUpdate`

The meanings of the fields are as follows:

-eventTime: task time, the number of milliseconds obtained by `performance.now()`. Since this field will be refactored in the future, we don't need to understand it currently.

-lane: Priority related fields. There is no need to master him yet, just know that different `Update` priorities may be different.

> You can compare `lane` to `needs' urgency` in `mental model`.

-suspenseConfig: `Suspense` related, don't pay attention to it for now.

-tag: the type of update, including `UpdateState` | `ReplaceState` | `ForceUpdate` | `CaptureUpdate`.

-payload: update the mounted data, the data mounted by different types of components are different. For `ClassComponent`, `payload` is the first parameter of `this.setState`. For `HostRoot`, `payload` is the first parameter of `ReactDOM.render`.

-callback: the updated callback function. That is, the `callback function` mentioned in the [layout sub-phase section of the commit phase](../renderer/layout.html#commitlayouteffectonfiber).

-next: Connect with other `Update` to form a linked list.

## Update contact with Fiber

We found that `Update` has a field `next` that connects other `Update`s to form a linked list. Contact `Fiber`, another structure in the form of a linked list in `React`. Is there any connection between them?

The answer is yes.

From the [Double Buffering Mechanism](../process/doubleBuffer.html) we know that `Fiber nodes` form a `Fiber tree`, and there are at most two `Fiber trees` in the page at the same time:

-The `current Fiber tree` representing the state of the current page

-Represents the `workInProgress Fiber tree` in the `render phase`

Similar to the `Fiber node` forming the `Fiber tree`, multiple `Update` on the `Fiber node` will form a linked list and be included in the `fiber.updateQueue`.

::: warning Under what circumstances will there be multiple Updates on a Fiber node?

You may be wondering why there are multiple `Update`s for one `Fiber node`. This is actually a very common situation.

Here is the simplest case:

```js
onClick() {
  this.setState({
    a: 1
  })

  this.setState({
    b: 2
  })
}
```

The `this.onClick` method is triggered in a `ClassComponent`, and `this.setState` is called twice inside the method. This will generate two `Update`s in the `fiber`.

:::

The `Fiber node` can have at most two `updateQueue` at the same time:

-`updateQueue` saved by `current fiber` is `current updateQueue`

-`updateQueue` saved by `workInProgress fiber` is `workInProgress updateQueue`

After the page rendering is completed in the `commit phase`, the `workInProgress Fiber tree` becomes the `current Fiber tree`, and the `updateQueue` of the `Fiber node` in the `workInProgress Fiber tree` becomes `current updateQueue`.

## updateQueue

There are three types of `updateQueue`, of which the type of `HostComponent` is introduced in [completeWork section](../process/completeWork.html#update time).

The remaining two types correspond to the two types of `Update`.

The structure of `UpdateQueue` used by `ClassComponent` and `HostRoot` is as follows:

```js
const queue: UpdateQueue<State> = {
    baseState: fiber.memoizedState,
    firstBaseUpdate: null,
    lastBaseUpdate: null,
    shared: {
      pending: null,
    },
    effects: null,
  };
```
> `UpdateQueue` is returned by the `initializeUpdateQueue` method, you can download it from [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactUpdateQueue.new.js#L157) See the source code of `initializeUpdateQueue`

The field descriptions are as follows:

-baseState: The `state` of the `Fiber node` before this update, and `Update` calculates the updated `state` based on the `state`.

> You can compare the `baseState` with the `master branch` in the `mental model`.

-`firstBaseUpdate` and `lastBaseUpdate`: The `Update` saved by the `Fiber node` before this update. It exists in the form of a linked list, the head of the linked list is `firstBaseUpdate`, and the end of the linked list is `lastBaseUpdate`. The reason why the `Update` exists in the `Fiber node` before the update is generated is because some `Update` has a lower priority and was skipped when the `state` was calculated by the `Update` in the last `render phase`.

> You can compare `baseUpdate` to `commit` (node ​​D) based on the execution of `git rebase` in `mental model`.

-`shared.pending`: When an update is triggered, the generated `Update` will be saved in `shared.pending` to form a unidirectional circular linked list. When the `state` is calculated by `Update`, this ring will be cut and connected to the back of `lastBaseUpdate`.

> You can compare `shared.pending` with the `commit` (node ​​ABC) that needs to be submitted this time in the `mental model`.

-effects: array. Save the `Update` of `update.callback !== null`.



## example

The code logic related to `updateQueue` involves a large number of linked list operations, which is difficult to understand. Here we give an example to explain the workflow of `updateQueue`.

Suppose a `fiber` has just gone through the `commit phase` to finish rendering.

On this `fiber`, there are two `Update` that were not processed in the last `render stage` because the priority is too low. They will become the `baseUpdate` for the next update.

We call them `u1` and `u2`, where `u1.next === u2`.

```js
fiber.updateQueue.firstBaseUpdate === u1;
fiber.updateQueue.lastBaseUpdate === u2;
u1.next === u2;
```

We use `-->` to indicate the direction of the linked list:

```js
fiber.updateQueue.baseUpdate: u1 --> u2
```

Now we trigger two status updates on `fiber`, which will generate two new `Update` successively, which we call `u3` and `u4`.

Each `update` will be inserted into the `updateQueue` queue through the `enqueueUpdate` method

After inserting `u3`:

```js
fiber.updateQueue.shared.pending === u3;
u3.next === u3;
```

The circular linked list of `shared.pending` is represented as:

```js
fiber.updateQueue.shared.pending: u3 ─────┐
                                     ^ |
                                     └──────┘
```

Then after inserting `u4`:

```js
fiber.updateQueue.shared.pending === u4;
u4.next === u3;
u3.next === u4;
```

`shared.pending` is a circular linked list, represented by a diagram:

```js
fiber.updateQueue.shared.pending: u4 ──> u3
                                     ^ |
                                     └──────┘
```

`shared.pending` will always point to the last inserted `update`, you can find it here [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactUpdateQueue. new.js#L208) See the source code of `enqueueUpdate`

After the update schedule is completed, it enters the `render phase`.

At this time, the loop of `shared.pending` is cut and connected to the back of `updateQueue.lastBaseUpdate`:

```js
fiber.updateQueue.baseUpdate: u1 --> u2 --> u3 --> u4
```

Next traverse the linked list of `updateQueue.baseUpdate`, with `fiber.updateQueue.baseState` as the `initial state`, and calculate and generate a new `state` with each `Update` traversed in turn (this operation is analogous to `Array.prototype .reduce`).

During traversal, if there is a low priority `Update`, it will be skipped.

The `state` obtained after the traversal is completed is the `state` of the `Fiber node` in this update (called `memoizedState` in the source code).

> The `Update operation` of the `render stage` is completed by `processUpdateQueue`, you can download it from [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactUpdateQueue.new .js#L405) See the source code of `processUpdateQueue`

The change of the `state` produces a different `JSX` object in the `render phase` from the last update, generates an `effectTag` through the `Diff algorithm`, and renders it on the page in the `commit phase`.

After the rendering is completed, the `workInProgress Fiber tree` becomes the `current Fiber tree`, and the entire update process ends.