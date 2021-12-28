One of the contributions of `Redux` author `Dan` after joining the `React` core team is to "bring the concept of `Redux` into `React`".

The most obvious influence here is the two `Hook` of `useState` and `useReducer`. Essentially, `useState` is just a `useReducer` with `reducer` preset.

In this section we will learn the implementation of `useState` and `useReducer`.

## Process overview

We divide the work flow of these two `Hook` into `declaration phase` and `calling phase`, for:

```js
function App() {
  const [state, dispatch] = useReducer(reducer, {a: 1});

  const [num, updateNum] = useState(0);
  
  return (
    <div>
      <button onClick={() => dispatch({type:'a'})}>{state.a}</button>
      <button onClick={() => updateNum(num => num + 1)}>{num}</button>
    </div>
  )
}
```

The `declaration phase`, that is, when the `App` is called, the `useReducer` and `useState` methods will be executed in sequence.

The `call phase` is when the `dispatch` or `updateNum` is called after the button is clicked.

## Declaration stage

When `FunctionComponent` enters `beginWork` of `render stage`, it will call [renderWithHooks](https://github.com/acdlite/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberBeginWork.new.js #L1419) Method.

This method will execute the function corresponding to `FunctionComponent` (ie `fiber.type`).

> You can see this logic in [here](https://github.com/acdlite/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberHooks.new.js#L415)

For these two `Hook`, their source code is as follows:

```js
function useState(initialState) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}
function useReducer(reducer, initialArg, init) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useReducer(reducer, initialArg, init);
}
```

As mentioned in the previous section [dispatcher](./structure.html#dispatcher), in different scenarios, the same `Hook` will call different processing functions.

We respectively explain the two scenes of `mount` and `update`.

### When mount

When `mount`, `useReducer` will call [mountReducer](https://github.com/acdlite/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberHooks.new.js#L638), `useState` Will call [mountState](https://github.com/acdlite/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberHooks.new.js#L1143).

Let's briefly compare these two methods:

```js
function mountState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  // Create and return the current hook
  const hook = mountWorkInProgressHook();

  // ... the initial state of the assignment

  // Create queue
  const queue = (hook.queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: (initialState: any),
  });

  // ... create dispatch
  return [hook.memoizedState, dispatch];
}

function mountReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  // Create and return the current hook
  const hook = mountWorkInProgressHook();

  // ... the initial state of the assignment

  // Create queue
  const queue = (hook.queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: reducer,
    lastRenderedState: (initialState: any),
  });

  // ... create dispatch
  return [hook.memoizedState, dispatch];
}
```

The `mountWorkInProgressHook` method will create and return the corresponding `hook`, which corresponds to the `isMount` logic part of the `useState` method in the `Minimal Hooks implementation`.

As you can see, the only difference between these two `Hooks' when `mount` is the `lastRenderedReducer` field of the `queue` parameter.

The data structure of `queue` is as follows:

```js
const queue = (hook.queue = {
  // Has the same meaning as the field of the same name in the minimalist implementation, save the update object
  pending: null,
  // Save the value of dispatchAction.bind()
  dispatch: null,
  // The reducer used in the last render
  lastRenderedReducer: reducer,
  // The state of the last render
  lastRenderedState: (initialState: any),
});
```

Among them, the `lastRenderedReducer` of `useReducer` is the `reducer` parameter passed in. The `lastRenderedReducer` of `useState` is `basicStateReducer`.

The `basicStateReducer` method is as follows:

```js
function basicStateReducer<S>(state: S, action: BasicStateAction<S>): S {
  return typeof action ==='function'? action(state): action;
}
```

It can be seen that `useState` is the `useReducer` whose parameter of `reducer` is `basicStateReducer`.

The overall operation logic of `mount` is similar to the logic of `isMount` of `Minimal implementation`, you can compare it.

### When updating

If there is a difference between the two in `mount`, then in `update`, `useReducer` and `useState` call the same function [updateReducer](https://github.com/acdlite/react/blob /1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberHooks.new.js#L665).

```js
function updateReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  // Get the current hook
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;
  
  queue.lastRenderedReducer = reducer;

  // ... update logic similar to update and updateQueue

  const dispatch: Dispatch<A> = (queue.dispatch: any);
  return [hook.memoizedState, dispatch];
}
```

The whole process can be summarized in one sentence:

> Find the corresponding `hook`, calculate the new `state` of the `hook` according to the `update` and return.

To get the current `hook` when `mount` uses `mountWorkInProgressHook`, and when `update` uses `updateWorkInProgressHook`, the reason here is:

-When `mount`, it can be determined that the `update` generated by calling `ReactDOM.render` or related initialization `API` will only be executed once.

-`update` may be an `update` triggered in event callbacks or side effects or an `update` triggered by the `render phase`. In order to avoid the infinite loop of the component `update`, the latter needs to be treated differently.

An example of `update` triggered by `render phase`:

```js
function App() {
  const [num, updateNum] = useState(0);
  
  updateNum(num + 1);

  return (
    <button onClick={() => updateNum(num => num + 1)}>{num}</button>
  )
}
```

In this example, when `App` is called, it means that it has entered the `render phase` and executes `renderWithHooks`.

Inside `App`, calling `updateNum` will trigger an `update`. If there is no restriction on the update triggered in this case, then this `update` will start a new `render phase`, and eventually it will update in an endless loop.

For this reason, `React` uses a tag variable `didScheduleRenderPhaseUpdate` to determine whether it is an update triggered by the `render phase`.

The `updateWorkInProgressHook` method will also distinguish between these two cases to obtain the corresponding `hook`.

Get the corresponding `hook`, and then calculate the new `state` according to the `state` saved in the `hook`. This step is the same as [Update section](../state/update.html).

## Invoke phase

[DispatchAction](https://github.com/acdlite/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberHooks.new.js#L1662) will be executed during the call phase, and the `FunctionComponent` corresponding to ` Fiber` and `hook.queue` have been passed in as parameters in advance by calling the `bind` method.

```js
function dispatchAction(fiber, queue, action) {

  // ... create update
  var update = {
    eventTime: eventTime,
    lane: lane,
    suspenseConfig: suspenseConfig,
    action: action,
    eagerReducer: null,
    eagerState: null,
    next: null
  };

  // ...add update to queue.pending
  
  var alternate = fiber.alternate;

  if (fiber === currentlyRenderingFiber$1 || alternate !== null && alternate === currentlyRenderingFiber$1) {
    // Update triggered by the render phase
    didScheduleRenderPhaseUpdateDuringThisPass = didScheduleRenderPhaseUpdate = true;
  } else {
    if (fiber.lanes === NoLanes && (alternate === null || alternate.lanes === NoLanes)) {
      // ...fiber's updateQueue is empty, optimize the path
    }

    scheduleUpdateOnFiber(fiber, lane, eventTime);
  }
}
```

The whole process can be summarized as:

> Create `update`, add `update` to `queue.pending`, and start scheduling.

What is worth noting here is the logic of `if...else...`, where:

```js
if (fiber === currentlyRenderingFiber$1 || alternate !== null && alternate === currentlyRenderingFiber$1)
```

`CurrentlyRenderingFiber` means `workInProgress`, the existence of `workInProgress` means that it is currently in the `render phase`.

When the `update` is triggered, the `fiber` and `workInProgress` pre-saved by `bind` are equal, which means that this `update` occurs in the `render phase` of `FunctionComponent` corresponding to `fiber`.

So this is an `update` triggered by the `render phase`, and the variable `didScheduleRenderPhaseUpdate` needs to be marked and processed separately.

Pay attention again:

```js
if (fiber.lanes === NoLanes && (alternate === null || alternate.lanes === NoLanes))
```

`fiber.lanes` saves the `priority` of `update` existing on `fiber`.

`fiber.lanes === NoLanes` means that there is no `update` on `fiber`.

We already know that the calculation of `state` by `update` occurs in the `declaration phase`. This is because there may be multiple `update` with different `priorities` on the `hook`, and the final value of `state` consists of multiple `update` is jointly decided.

But when `update` does not exist on `fiber`, the `update` created by the `calling phase` is the first `update` on the `hook`, and it only depends on this when calculating the `state` in the `declaration phase` `update`, there is no need to enter the `declaration phase` to calculate the `state` at all.

The advantage of this is: if the calculated `state` is consistent with the `state` saved before the `hook`, then there is no need to start a scheduling at all. Even if the calculated `state` is inconsistent with the `state` saved before the `hook`, the `state` that has been calculated in the `calling phase` can be used directly in the `declaration phase`.

> You can see this piece of pre-calculated `state` in [here](https://github.com/acdlite/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberHooks.new.js#L1727) logic

## Little Tip

We usually think that the passed parameters of `useReducer(reducer, initialState)` are initialization parameters, which are immutable in subsequent calls.

But in the `updateReducer` method, you can see that `lastRenderedReducer` will be reassigned every time it is called.

```js
function updateReducer(reducer, initialArg, init) {
  // ...

  queue.lastRenderedReducer = reducer;

  // ...
```

In other words, the `reducer` parameter is variable at any time.

::: details reducer variable Demo
The reducer used by `useReducer` will change once every second

After clicking the button, the effect of `+1` or `-1` will appear over time

[Follow the public account](../me.html), backstage reply **582** to get the online Demo address
:::