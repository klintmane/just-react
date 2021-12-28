`ref` is short for `reference` (reference). In `React`, we are used to saving `DOM` with `ref`.

In fact, any data that needs to be "quoted" can be stored in `ref`, and the emergence of `useRef` further promotes this idea.

In the [Hooks data structure section](./structure.html#memoizedstate) we talked about:

> For `useRef(1)`, `memoizedState` saves `{current: 1}`

In this section, we will introduce the implementation of `useRef` and the workflow of `ref`.

Since the use of `ref` of type `string` is deprecated, this section focuses on `ref` of type `function | {current: any}`.

## useRef

Like other `Hook`, for `mount` and `update`, `useRef` corresponds to two different `dispatcher`.

```js
function mountRef<T>(initialValue: T): {|current: T|} {
  // Get the current useRef hook
  const hook = mountWorkInProgressHook();
  // Create ref
  const ref = {current: initialValue};
  hook.memoizedState = ref;
  return ref;
}

function updateRef<T>(initialValue: T): {|current: T|} {
  // Get the current useRef hook
  const hook = updateWorkInProgressHook();
  // Return the saved data
  return hook.memoizedState;
}
```

> You can see this code in [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberHooks.old.js#L1208-L1221)

It can be seen that `useRef` just returns an object containing the `current` property.

In order to verify this point of view, let's look at the implementation of the `React.createRef` method:

```js
export function createRef(): RefObject {
  const refObject = {
    current: null,
  };
  return refObject;
}
```

> You can see this code from [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react/src/ReactCreateRef.js)

After understanding the data structure of `ref`, let's take a look at the workflow of `ref`.

## ref's workflow

In `React`, `HostComponent`, `ClassComponent`, and `ForwardRef` can be assigned to the `ref` attribute.

```js
// HostComponent
<div ref={domRef}></div>
// ClassComponent / ForwardRef
<App ref={cpnRef} />
```

Among them, `ForwardRef` just passes `ref` as the second parameter and will not enter the workflow of `ref`.

So when discussing the workflow of `ref`, `ForwardRef` will be excluded.

```js
// For ForwardRef, secondArg is the ref passed down
let children = Component(props, secondArg);
```

> You can see this code in [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberHooks.old.js#L415)

We know that `HostComponent` performs `DOM` operations in the `mutation phase` of the `commit phase`.

Therefore, the update corresponding to `ref` also occurs in the `mutation phase`.

Furthermore, the basis for executing the `DOM` operation in the `mutation stage` is `effectTag`.

Therefore, for `HostComponent` and `ClassComponent`, if the `ref` operation is included, the corresponding `effectTag` will also be assigned.

```js
// ...
export const Placement = /* */ 0b0000000000000010;
export const Update = /* */ 0b0000000000000100;
export const Deletion = /* */ 0b0000000000001000;
export const Ref = /* */ 0b0000000010000000;
// ...
```

> You can see the `effectTag` corresponding to `ref` in [ReactSideEffectTags file](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactSideEffectTags.js#`L24)

Therefore, the workflow of `ref` can be divided into two parts:

-`render phase` adds `Ref effectTag` to `fiber` with `ref` attribute

-The `commit phase` performs the corresponding operation for the `fiber` containing the `Ref effectTag`

## render stage

In the `beginWork` and `completeWork` of the `render phase`, there is a method `markRef` with the same name, which is used to add `Ref effectTag` to `fiber` with `ref` attribute.

```js
// beginWork's markRef
function markRef(current: Fiber | null, workInProgress: Fiber) {
  const ref = workInProgress.ref;
  if (
    (current === null && ref !== null) ||
    (current !== null && current.ref !== ref)
  ) {
    // Schedule a Ref effect
    workInProgress.effectTag |= Ref;
  }
}
// markRef of completeWork
function markRef(workInProgress: Fiber) {
  workInProgress.effectTag |= Ref;
}
```
> You can see the `markRef` of `beginWork`, [Here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberCompleteWork.old.js#L153) see `markRef` of `completeWork`

In `beginWork`, `markRef` is called in the following two places:

-[finishClassComponent](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberBeginWork.old.js#L958) in `updateClassComponent`, corresponding to `ClassComponent`

Note that `ClassComponent` will call `markRef` even if `shouldComponentUpdate` is `false`

-[updateHostComponent](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberBeginWork.old.js#L1156), corresponding to `HostComponent`

In `completeWork`, `markRef` is called in the following two places:

-[HostComponent](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberCompleteWork.old.js#L728) type in `completeWork`

-[ScopeComponent](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberCompleteWork.old.js#L1278) type in `completeWork`

> `ScopeComponent` is a test feature used to manage `focus`, see [PR](https://github.com/facebook/react/pull/16587)

Summarize the conditions that the `component` corresponding to the `fiber` is assigned the value of `Ref effectTag` to meet:

-The type of `fiber` is `HostComponent`, `ClassComponent`, and `ScopeComponent` (we will not discuss this case)

-For `mount`, `workInProgress.ref !== null`, that is, there is a `ref` attribute

-For `update`, `current.ref !== workInProgress.ref`, that is, `ref` property changes



## commit stage

In the `mutation phase` of the `commit phase`, for the change of the attribute of `ref`, the previous `ref` needs to be removed first.

```js
function commitMutationEffects(root: FiberRoot, renderPriorityLevel) {
  while (nextEffect !== null) {

    const effectTag = nextEffect.effectTag;
    // ...

    if (effectTag & Ref) {
      const current = nextEffect.alternate;
      if (current !== null) {
        // remove the previous ref
        commitDetachRef(current);
      }
    }
    // ...
  }
  // ...
```

> You can see this code in [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberWorkLoop.old.js#L2342)

```js
function commitDetachRef(current: Fiber) {
  const currentRef = current.ref;
  if (currentRef !== null) {
    if (typeof currentRef ==='function') {
      // function type ref, call him, pass parameter is null
      currentRef(null);
    } else {
      // Object type ref, current is assigned to null
      currentRef.current = null;
    }
  }
}
```

Next, in the `mutation phase`, for the `fiber` of `Deletion effectTag` (corresponding to the `DOM node` that needs to be deleted), it is necessary to recurse its subtree, and execute similar `commitDetachRef` to the `ref` of the descendants of `fiber` Operation.

In the [mutation stage section](renderer/mutation.html#commitmutationeffects) we talked about

> For `fiber` of `Deletion effectTag`, `commitDeletion` will be executed.

The `safelyDetachRef` method called in `commitDeletion`-`unmountHostComponents`-`commitUnmount`-`ClassComponent | HostComponent` type `case` is responsible for performing operations similar to `commitDetachRef`.

```js
function safelyDetachRef(current: Fiber) {
  const ref = current.ref;
  if (ref !== null) {
    if (typeof ref ==='function') {
      try {
        ref(null);
      } catch (refError) {
        captureCommitPhaseError(current, refError);
      }
    } else {
      ref.current = null;
    }
  }
}
```

> You can see this code in [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberCommitWork.old.js#L183)

Next enter the assignment phase of `ref`. We talked about in [Layout stage section](../renderer/layout.html#commitlayouteffects)

> `commitLayoutEffect` will execute `commitAttachRef` (assignment of `ref`)

```js
function commitAttachRef(finishedWork: Fiber) {
  const ref = finishedWork.ref;
  if (ref !== null) {
    // Get the Component instance corresponding to the ref attribute
    const instance = finishedWork.stateNode;
    let instanceToUse;
    switch (finishedWork.tag) {
      case HostComponent:
        instanceToUse = getPublicInstance(instance);
        break;
      default:
        instanceToUse = instance;
    }

    // Assign ref
    if (typeof ref ==='function') {
      ref(instanceToUse);
    } else {
      ref.current = instanceToUse;
    }
  }
}
```

At this point, the workflow of `ref` is complete.

## Summarize

In this section we have learned the workflow of `ref`.

-For `FunctionComponent`, `useRef` is responsible for creating and returning the corresponding `ref`.

-For the `HostComponent` and `ClassComponent` assigned with the `ref` attribute, they will undergo the assignment of `Ref effectTag` in the `render phase`, and execute the corresponding `ref` operation in the `commit phase`.