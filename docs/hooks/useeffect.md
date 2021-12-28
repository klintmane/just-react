In [Architecture chapter commit stage process overview](../renderer/prepare.html) we explained the workflow of `useEffect`.

Where we talked about

> Inside the `flushPassiveEffects` method, the `effectList` is obtained from the global variable `rootWithPendingPassiveEffects`.

In this section, we dive into the internals of the `flushPassiveEffects` method to explore the working principle of `useEffect`.

## flushPassiveEffectsImpl

`FlushPassiveEffects` internally sets `priority` and executes `flushPassiveEffectsImpl`.

> You can see the code of `flushPassiveEffects` from [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberWorkLoop.old.js#L2458)

`flushPassiveEffectsImpl` mainly does three things:

-Call the destruction function of the `useEffect` in the last `render`

-Call the callback function of this `useEffect` in this `render`

-If there is a synchronization task, there is no need to wait for the next `macro task` of the `event loop`, and execute it in advance

In this section we focus on the first two steps.

The first step in `v16` is executed synchronously, in [Official Blog](https://zh-hans.reactjs.org/blog/2020/08/10/react-v17-rc.html#effect-cleanup -timing) mentioned:

> The side-effect cleanup function (if it exists) runs synchronously in React 16. We found that this is not ideal for large applications, because synchronization slows down screen transitions (for example, switching tabs).

For this reason, in `v17.0.0`, the two stages of `useEffect` will be executed asynchronously after the page is rendered (after the `layout` stage).

> In fact, judging from the code, it is already executed asynchronously in `v16.13.1`

Next we explain these two steps in detail.

## Phase 1: Execution of the destruction function

The execution of `useEffect` needs to ensure that the `destruction function` of all components of `useEffect` must be executed before the `callback function` of `useEffect` of any one component can be executed.

This is because multiple `components` may share the same `ref`.

If it is not in the order of "Destroy all" and then "Execute all", the modified `ref.current` in the `destruction function` of a certain component `useEffect` may affect the `callback function` of another component `useEffect` The `current` attribute of the same `ref`.

The same problem exists in `useLayoutEffect`, so they all follow the order of "Destroy All" and then "Execute All".

In the first stage, all the `destruction functions` of `useEffect` will be traversed and executed.

```js
// All useEffects that need to be destroyed are saved in pendingPassiveHookEffectsUnmount
const unmountEffects = pendingPassiveHookEffectsUnmount;
  pendingPassiveHookEffectsUnmount = [];
  for (let i = 0; i <unmountEffects.length; i += 2) {
    const effect = ((unmountEffects[i]: any): HookEffect);
    const fiber = ((unmountEffects[i + 1]: any): Fiber);
    const destroy = effect.destroy;
    effect.destroy = undefined;

    if (typeof destroy ==='function') {
      // The destruction function is executed if it exists
      try {
        destroy();
      } catch (error) {
        captureCommitPhaseError(fiber, error);
      }
    }
  }
```

Among them, the index `i` of the `pendingPassiveHookEffectsUnmount` array saves the `effect` that needs to be destroyed, and `i+1` saves the `fiber` corresponding to the `effect`.

The operation of pushing data in the `pendingPassiveHookEffectsUnmount` array occurs in the `schedulePassiveEffects` method inside the `layout phase` `commitLayoutEffectOnFiber` method.

> `commitLayoutEffectOnFiber` method we have introduced in [Layout stage](../renderer/layout.html#commitlayouteffectonfiber)

```js
function schedulePassiveEffects(finishedWork: Fiber) {
  const updateQueue: FunctionComponentUpdateQueue | null = (finishedWork.updateQueue: any);
  const lastEffect = updateQueue !== null? updateQueue.lastEffect: null;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      const {next, tag} = effect;
      if (
        (tag & HookPassive) !== NoHookEffect &&
        (tag & HookHasEffect) !== NoHookEffect
      ) {
        // To the effect to be destroyed by `push` in the `pendingPassiveHookEffectsUnmount` array
        enqueuePendingPassiveHookEffectUnmount(finishedWork, effect);
        // To execute the callback effect to `push` in the `pendingPassiveHookEffectsMount` array
        enqueuePendingPassiveHookEffectMount(finishedWork, effect);
      }
      effect = next;
    } while (effect !== firstEffect);
  }
}
```

## Phase 2: Execution of the callback function

Similar to stage one, the array is also traversed and the callback function corresponding to the effect is executed.

The operation of pushing data in `pendingPassiveHookEffectsMount` also occurs in `schedulePassiveEffects`.

```js
// All useEffects that need to execute callbacks are saved in pendingPassiveHookEffectsMount
const mountEffects = pendingPassiveHookEffectsMount;
pendingPassiveHookEffectsMount = [];
for (let i = 0; i <mountEffects.length; i += 2) {
  const effect = ((mountEffects[i]: any): HookEffect);
  const fiber = ((mountEffects[i + 1]: any): Fiber);
  
  try {
    const create = effect.create;
   effect.destroy = create();
  } catch (error) {
    captureCommitPhaseError(fiber, error);
  }
}
```