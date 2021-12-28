In the previous section, we implemented a minimalist `useState` and understood the operating principle of `Hooks`.

In this section, we explain the data structure of `Hooks` to lay the foundation for the specific `hook` introduced later.

## dispatcher

In the minimalist implementation of `useState` in the previous section, the `isMount` variable is used to distinguish between `mount` and `update`.

In the real `Hooks`, the `hook` at the time of the component `mount` and the `hook` at the time of the update are derived from different objects. Such objects are called `dispatcher` in the source code.

```js
// Dispatcher at mount
const HooksDispatcherOnMount: Dispatcher = {
  useCallback: mountCallback,
  useContext: readContext,
  useEffect: mountEffect,
  useImperativeHandle: mountImperativeHandle,
  useLayoutEffect: mountLayoutEffect,
  useMemo: mountMemo,
  useReducer: mountReducer,
  useRef: mountRef,
  useState: mountState,
  // ... omitted
};

// Dispatcher during update
const HooksDispatcherOnUpdate: Dispatcher = {
  useCallback: updateCallback,
  useContext: readContext,
  useEffect: updateEffect,
  useImperativeHandle: updateImperativeHandle,
  useLayoutEffect: updateLayoutEffect,
  useMemo: updateMemo,
  useReducer: updateReducer,
  useRef: updateRef,
  useState: updateState,
  // ... omitted
};
```

It can be seen that the `hook` called during `mount` and the `hook` called during `update` are actually two different functions.

Before `FunctionComponent` `render`, `mount` and `update` will be distinguished based on the following conditions of `FunctionComponent` corresponding to `fiber`.

```js
current === null || current.memoizedState === null
```

And assign the `dispatcher` corresponding to different situations to the `current` property of the global variable `ReactCurrentDispatcher`.
 
```js
ReactCurrentDispatcher.current =
      current === null || current.memoizedState === null
        ? HooksDispatcherOnMount
        : HooksDispatcherOnUpdate;
```
 
<!-- react17-alpha -->
> You can see this line of code in [here](https://github.com/acdlite/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberHooks.new.js#L409)

When `FunctionComponent` `render`, it will look for the required `hook` from `ReactCurrentDispatcher.current` (that is, the current `dispatcher`).

In other words, if different call stack contexts assign different `dispatcher` to `ReactCurrentDispatcher.current`, then the `hook` called when `FunctionComponent` `render` is also a different function.

> In addition to these two `dispatchers`, you can see [here](https://github.com/acdlite/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberHooks.new.js#L1775) Other `dispatcher` definitions

## A dispatcher usage scenario

 When the nested form of `hook` is written incorrectly, such as:

```js
useEffect(() => {
  useState(0);
})
```

At this time, `ReactCurrentDispatcher.current` has pointed to `ContextOnlyDispatcher`, so calling `useState` will actually call `throwInvalidHookError`, which directly throws an exception.

```js
export const ContextOnlyDispatcher: Dispatcher = {
  useCallback: throwInvalidHookError,
  useContext: throwInvalidHookError,
  useEffect: throwInvalidHookError,
  useImperativeHandle: throwInvalidHookError,
  useLayoutEffect: throwInvalidHookError,
  // ... omitted
```

> You can see this logic in [here](https://github.com/acdlite/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberHooks.new.js#L458)

## Hook's data structure

Next we learn the data structure of `hook`.

```js
const hook: Hook = {
  memoizedState: null,

  baseState: null,
  baseQueue: null,
  queue: null,

  next: null,
};
```

> You can see the logic of creating `hook` in [here](https://github.com/acdlite/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberHooks.new.js#L546)


The meaning of the fields other than `memoizedState` is similar to the [updateQueue](../state/update.html#updatequeue) introduced in the previous chapter.

## memoizedState

::: warning note
Both `hook` and `FunctionComponent fiber` have the `memoizedState` property, don't confuse their concepts.

-`fiber.memoizedState`: `FunctionComponent` corresponds to the `Hooks` linked list saved by `fiber`.

-`hook.memoizedState`: the data corresponding to a single `hook` saved in the `Hooks` linked list.
:::

The `memoizedState` of different types of `hooks` store different types of data, as follows:

-useState: For `const [state, updateState] = useState(initialState)`, `memoizedState` saves the value of `state`

-useReducer: For `const [state, dispatch] = useReducer(reducer, {});`, `memoizedState` saves the value of `state`

-useEffect: `memoizedState` saves the linked list data structure `effect` that contains `useEffect callback functions`, `dependencies`, etc. You can click here [here](https://github.com/acdlite/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/ packages/react-reconciler/src/ReactFiberHooks.new.js#L1181) See the creation process of `effect`. `effect` linked list will also be saved in `fiber.updateQueue`

-useRef: For `useRef(1)`, `memoizedState` saves `{current: 1}`

-useMemo: For `useMemo(callback, [depA])`, `memoizedState` saves `[callback(), depA]`

-useCallback: For `useCallback(callback, [depA])`, `memoizedState` saves `[callback, depA]`. The difference with `useMemo` is that `useCallback` saves the `callback` function itself, while `useMemo` saves the execution result of the `callback` function

Some `hooks` do not have `memoizedState`, such as:

-useContext