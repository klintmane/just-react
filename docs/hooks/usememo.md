After understanding the implementation of other `hook`, it is very easy to understand the implementation of `useMemo` and `useCallback`.

In this section, we will discuss the two `hooks` separately in the case of `mount` and `update`.

## mount

```js
function mountMemo<T>(
  nextCreate: () => T,
  deps: Array<mixed> | void | null,
): T {
  // Create and return the current hook
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined? null: deps;
  // Calculate value
  const nextValue = nextCreate();
  // Save value and deps in hook.memoizedState
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}

function mountCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
  // Create and return the current hook
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined? null: deps;
  // Save value and deps in hook.memoizedState
  hook.memoizedState = [callback, nextDeps];
  return callback;
}
```

As you can see, the only difference with `mountCallback` is

-`mountMemo` will save the execution result of `callback function` (nextCreate) as `value`

-`mountCallback` will save the `callback function` as `value`

## update

```js
function updateMemo<T>(
  nextCreate: () => T,
  deps: Array<mixed> | void | null,
): T {
  // return the current hook
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined? null: deps;
  const prevState = hook.memoizedState;

  if (prevState !== null) {
    if (nextDeps !== null) {
      const prevDeps: Array<mixed> | null = prevState[1];
      // Determine whether the value changes before and after update
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        // unchanged
        return prevState[0];
      }
    }
  }
  // change, recalculate value
  const nextValue = nextCreate();
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}

function updateCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
  // return the current hook
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined? null: deps;
  const prevState = hook.memoizedState;

  if (prevState !== null) {
    if (nextDeps !== null) {
      const prevDeps: Array<mixed> | null = prevState[1];
      // Determine whether the value changes before and after update
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        // unchanged
        return prevState[0];
      }
    }
  }

  // Change, use the new callback as the value
  hook.memoizedState = [callback, nextDeps];
  return callback;
}
```

It can be seen that for `update`, the only difference between the two `hooks` is whether it is the callback function itself or the execution result of the callback function as the value**.