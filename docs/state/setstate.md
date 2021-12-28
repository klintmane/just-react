When we have the foundation of the previous knowledge, it is easy to understand the workflow of `this.setState`.

## Process overview

As you can see, the `this.updater.enqueueSetState` method is called in `this.setState`.

```js
Component.prototype.setState = function (partialState, callback) {
  if (!(typeof partialState ==='object' || typeof partialState ==='function' || partialState == null)) {
    {
      throw Error( "setState(...): takes an object of state variables to update or a function which returns an object of state variables." );
    }
  }
  this.updater.enqueueSetState(this, partialState, callback,'setState');
};
```

> You can see this code in [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react/src/ReactBaseClasses.js#L57)

In the `enqueueSetState` method, we are familiar with the process from `creating update` to `dispatching update`.

```js
enqueueSetState(inst, payload, callback) {
  // Obtain the corresponding fiber through the component instance
  const fiber = getInstance(inst);

  const eventTime = requestEventTime();
  const suspenseConfig = requestCurrentSuspenseConfig();

  // Get priority
  const lane = requestUpdateLane(fiber, suspenseConfig);

  // Create update
  const update = createUpdate(eventTime, lane, suspenseConfig);

  update.payload = payload;

  // Assignment callback function
  if (callback !== undefined && callback !== null) {
    update.callback = callback;
  }

  // insert update into updateQueue
  enqueueUpdate(fiber, update);
  // schedule update
  scheduleUpdateOnFiber(fiber, lane, eventTime);
}
```

> You can see the `enqueueSetState` code in [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberClassComponent.old.js#L196)

It is worth noting here that for `ClassComponent`, `update.payload` is the first parameter of `this.setState` (that is, the `state` to be changed).

## this.forceUpdate

On `this.updater`, in addition to `enqueueSetState`, there is also `enqueueForceUpdate`, which will be called when we call `this.forceUpdate`.

As you can see, except for the assignment of `update.tag = ForceUpdate;` and no `payload`, the other logic is consistent with `this.setState`.

```js
enqueueForceUpdate(inst, callback) {
    const fiber = getInstance(inst);
    const eventTime = requestEventTime();
    const suspenseConfig = requestCurrentSuspenseConfig();
    const lane = requestUpdateLane(fiber, suspenseConfig);

    const update = createUpdate(eventTime, lane, suspenseConfig);

    // Assign tag to ForceUpdate
    update.tag = ForceUpdate;

    if (callback !== undefined && callback !== null) {
      update.callback = callback;
    }

    enqueueUpdate(fiber, update);
    scheduleUpdateOnFiber(fiber, lane, eventTime);
  },
};
```

> You can see the `enqueueForceUpdate` code in [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberClassComponent.old.js#L260)

So what is the effect of assigning `update.tag = ForceUpdate;`?

There are two conditions that need to be met when judging whether `ClassComponent` needs to be updated:

```js
 const shouldUpdate =
  checkHasForceUpdateAfterProcessing() ||
  checkShouldComponentUpdate(
    workInProgress,
    ctor,
    oldProps,
    newProps,
    oldState,
    newState,
    nextContext,
  );
```

> You can see this code in [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberClassComponent.old.js#L1137)

-checkHasForceUpdateAfterProcessing: Internally, it will determine whether the updated `Update` is `ForceUpdate`. That is, if there is a `tag` of `ForceUpdate` in the `Update` of this update, it will return `true`.

-checkShouldComponentUpdate: The `shouldComponentUpdate` method is called internally. And when the `ClassComponent` is `PureComponent`, it will compare `state` with `props`.

> You can see the `checkShouldComponentUpdate` code in [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberClassComponent.old.js#L294)

Therefore, when an update contains `Update` with `tag` as `ForceUpdate`, then the current `ClassComponent` will not be affected by other `performance optimization methods` (`shouldComponentUpdate`|`PureComponent`) and will definitely be updated.

## Summarize

So far, we have finished the update process of `Update` used by `HostRoot | ClassComponent`.

In the next chapter, we will learn about another data structure of `Update`-`Update` for `Hooks`.