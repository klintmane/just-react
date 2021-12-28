This stage is called `layout` because the code in this stage is executed after the rendering of the `DOM` is completed (the `mutation phase` is completed).

The life cycle hooks and `hooks` triggered at this stage can directly access the changed `DOM`, that is, this stage is a stage that can participate in the `DOM layout`.

## Overview

Similar to the first two stages, the `layout stage` also traverses the `effectList` and executes functions.

The specific execution function is `commitLayoutEffects`.

```js
root.current = finishedWork;

nextEffect = firstEffect;
do {
  try {
    commitLayoutEffects(root, lanes);
  } catch (error) {
    invariant(nextEffect !== null, "Should be working on an effect.");
    captureCommitPhaseError(nextEffect, error);
    nextEffect = nextEffect.nextEffect;
  }
} while (nextEffect !== null);

nextEffect = null;
```

## commitLayoutEffects

code show as below:

> You can see the source code of `commitLayoutEffects` in [here](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L2302)

```js
function commitLayoutEffects(root: FiberRoot, committedLanes: Lanes) {
  while (nextEffect !== null) {
    const effectTag = nextEffect.effectTag;

    // call life cycle hooks and hooks
    if (effectTag & (Update | Callback)) {
      const current = nextEffect.alternate;
      commitLayoutEffectOnFiber(root, current, nextEffect, committedLanes);
    }

    // Assign ref
    if (effectTag & Ref) {
      commitAttachRef(nextEffect);
    }

    nextEffect = nextEffect.nextEffect;
  }
}
```

`commitLayoutEffects` did two things in total:

1. commitLayoutEffectOnFiber (call `lifecycle hook` and `hook` related operations)

2. commitAttachRef (assignment ref)

## commitLayoutEffectOnFiber

The `commitLayoutEffectOnFiber` method will process different types of nodes separately according to `fiber.tag`.

> You can see the source code of `commitLayoutEffectOnFiber` (`commitLayoutEffectOnFiber` Is an alias, the method was originally named `commitLifeCycles`)

-For `ClassComponent`, he will distinguish between `mount` and `update` by `current === null?`, and call [`componentDidMount`](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/ packages/react-reconciler/src/ReactFiberCommitWork.new.js#L538) or [`componentDidUpdate`](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactFiberCommitWork. .js#L592).

If the `this.setState` that triggers the `state update` is assigned the second parameter `callback function`, it will also be called at this time.

```js
this.setState({ xxx: 1 }, () => {
  console.log("i am update~");
});
```

-For `FunctionComponent` and related types, he will call the `callback function` of `useLayoutEffect hook`, and schedule the `destroy` and `callback` functions of `useEffect`

> `Related type` refers to the special processed `FunctionComponent`, such as `ForwardRef`, `FunctionComponent` packaged by `React.memo`

```js
  switch (finishedWork.tag) {
    // The following are FunctionComponent and related types
    case FunctionComponent:
    case ForwardRef:
    case SimpleMemoComponent:
    case Block: {
      // Execute the callback function of useLayoutEffect
      commitHookEffectListMount(HookLayout | HookHasEffect, finishedWork);
      // Scheduling the destroy function and callback function of useEffect
      schedulePassiveEffects(finishedWork);
      return;
    }
```

> You can see this code from [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberCommitWork.old.js#L465-L491)

As mentioned in the previous section [Update effect](./mutation.html#update-effect), the `mutation stage` will execute the `destruction function` of the `useLayoutEffect hook`.

Combining this, we can find that the `useLayoutEffect hook` is executed synchronously from the `destruction function` call of the last update to the `callback function` call of this update.

And `useEffect` needs to be scheduled first, and then asynchronously executed after the completion of the `Layout phase`.

This is the difference between `useLayoutEffect` and `useEffect`.

-For `HostRoot`, that is `rootFiber`, if the third parameter `callback function` is assigned, it will also be called at this time.

```js
ReactDOM.render(<App />, document.querySelector("#root"), function() {
  console.log("i am mount~");
});
```

## commitAttachRef

The second thing `commitLayoutEffects` will do is `commitAttachRef`.

> You can see the source code of `commitAttachRef` in [here](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactFiberCommitWork.new.js#L823)

```js
function commitAttachRef(finishedWork: Fiber) {
  const ref = finishedWork.ref;
  if (ref !== null) {
    const instance = finishedWork.stateNode;

    // Get DOM instance
    let instanceToUse;
    switch (finishedWork.tag) {
      case HostComponent:
        instanceToUse = getPublicInstance(instance);
        break;
      default:
        instanceToUse = instance;
    }

    if (typeof ref === "function") {
      // If ref is in the form of a function, call the callback function
      ref(instanceToUse);
    } else {
      // If ref is in the form of ref instance, assign ref.current
      ref.current = instanceToUse;
    }
  }
}
```

The code logic is very simple: get the `DOM` instance and update the `ref`.

## current Fiber tree switch

At this point, the entire `layout phase` is over.

Before ending the study of this section, let's focus on this line of code:

```js
root.current = finishedWork;
```

> You can see this line of code in [here](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L2022)

In the section of [Double Buffer Mechanism](../process/doubleBuffer.html#What is-Double Buffer), we have introduced that the `workInProgress Fiber tree` will become the `current Fiber tree` after rendering in the `commit phase`. The function of this line of code is to switch the `current Fiber tree` pointed to by `fiberRootNode`.

So why is this line of code here? (After the end of the `mutation phase`, before the start of the `layout phase`.)

We know that `componentWillUnmount` will be executed in the `mutation phase`. At this time, the `current Fiber tree` also points to the previously updated `Fiber tree`, and the `DOM` obtained in the life cycle hook is still before the update.

`componentDidMount` and `componentDidUpdate` will be executed in the `layout phase`. At this time, the `current Fiber tree` has pointed to the updated `Fiber tree`, and the `DOM` obtained in the life cycle hook is the updated one.

## Summarize

We learned from this section that the `layout stage` will traverse the `effectList` and execute the `commitLayoutEffects` in turn. The main work of this method is "call different processing functions according to `effectTag` to process `Fiber` and update `ref`.