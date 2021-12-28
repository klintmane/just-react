In the [process overview section](/process/reconciler) we understand that the component will go through the `beginWork` and `completeWork` in the `render phase`.

In the previous section, we explained that after the component executes `beginWork`, a `child Fiber node` will be created, and there may be an `effectTag` on the node.

In this section, let us see what work `completeWork` will do.

You can see the definition of `completeWork` method from [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberCompleteWork.new.js#L673).

## Process overview

Similar to `beginWork`, `completeWork` also calls different processing logic for different `fiber.tag`.

```js
function completeWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
  const newProps = workInProgress.pendingProps;

  switch (workInProgress.tag) {
    case IndeterminateComponent:
    case LazyComponent:
    case SimpleMemoComponent:
    case FunctionComponent:
    case ForwardRef:
    case Fragment:
    case Mode:
    case Profiler:
    case ContextConsumer:
    case MemoComponent:
      return null;
    case ClassComponent: {
      // ... omitted
      return null;
    }
    case HostRoot: {
      // ... omitted
      updateHostContainer(workInProgress);
      return null;
    }
    case HostComponent: {
      // ... omitted
      return null;
    }
  // ... omitted
```

We focus on the `HostComponent` (that is, the `Fiber node` corresponding to the native `DOM component`) necessary for page rendering, and the processing of other types of `Fiber` will be explained when the specific function is implemented.

## Process HostComponent

Like `beginWork`, we judge whether it is `mount` or `update` based on `current === null ?`.

At the same time for `HostComponent`, when judging `update`, we also need to consider `workInProgress.stateNode != null?` (that is, whether the `Fiber node` has a corresponding `DOM node`)

```js
case HostComponent: {
  popHostContext(workInProgress);
  const rootContainerInstance = getRootHostContainer();
  const type = workInProgress.type;

  if (current !== null && workInProgress.stateNode != null) {
    // update situation
    // ... omitted
  } else {
    // mount situation
    // ... omitted
  }
  return null;
}
```

## update time

When `update`, the `Fiber node` already has a corresponding `DOM node`, so there is no need to generate a `DOM node`. The main thing that needs to be done is to deal with `props`, such as:

-Registration of callback functions such as `onClick` and `onChange`
-Handling `style prop`
-Handling `DANGEROUSLY_SET_INNER_HTML prop`
-Handling `children prop`

We remove some functions that currently don't need attention (such as `ref`). You can see that the main logic is to call the `updateHostComponent` method.

```js
if (current !== null && workInProgress.stateNode != null) {
  // update situation
  updateHostComponent(
    current,
    workInProgress,
    type,
    newProps,
    rootContainerInstance,
  );
}
```

You can see the definition of `updateHostComponent` method from [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberCompleteWork.new.js#L225).

Inside `updateHostComponent`, the processed `props` will be assigned to `workInProgress.updateQueue`, and finally will be rendered on the page in the `commit phase`.

```ts
workInProgress.updateQueue = (updatePayload: any);
```

Among them, `updatePayload` is in the form of an array, the value of its even index is the changed `prop key`, and the value of the odd index is the changed `prop value`.

> For the specific rendering process, see [mutation stage section](../renderer/mutation.html#hostcomponent-mutation)

::: details updatePayload attribute Demo

The `type` and `updatePayload` corresponding to the `Fiber node` are printed in the `updateHostComponent` method.

You can intuitively feel the data structure of `updatePayload`

[Follow the public account](../me.html), backstage reply **431** to get the online Demo address
:::

## When mount

Likewise, we have omitted irrelevant logic. As you can see, the main logic of `mount` includes three:

-Generate the corresponding `DOM node` for `Fiber node`
-Insert the descendant `DOM node` into the newly generated `DOM node`
-The process of processing `props` similar to `updateHostComponent` in `update` logic

```js
// mount situation

// ...omit server-side rendering related logic

const currentHostContext = getHostContext();
// Create the corresponding DOM node for the fiber
const instance = createInstance(
    type,
    newProps,
    rootContainerInstance,
    currentHostContext,
    workInProgress,
  );
// Insert the descendant DOM node into the newly generated DOM node
appendAllChildren(instance, workInProgress, false, false);
// DOM node is assigned to fiber.stateNode
workInProgress.stateNode = instance;

// Process props similar to updateHostComponent in update logic
if (
  finalizeInitialChildren(
    instance,
    type,
    newProps,
    rootContainerInstance,
    currentHostContext,
  )
) {
  markUpdate(workInProgress);
}
```

Remember that [previous section](./beginWork.html#effecttag) we said: When `mount`, only `Placement effectTag` exists in `rootFiber`. So how does the `commit phase` insert the entire `DOM tree` into the page through one insertion of the `DOM` operation (corresponding to a `Placement effectTag`)?

The reason lies in the `appendAllChildren` method in `completeWork`.

Since `completeWork` belongs to the function called in the "return" phase, every time `appendAllChildren` is called, the generated descendant `DOM node` will be inserted under the currently generated `DOM node`. Then when "return" to `rootFiber`, we already have a built off-screen `DOM tree`.

## effectList

So far, most of the work of the `render phase` is completed.

There is another problem: as the basis of the `DOM` operation, the `commit phase` needs to find all `Fiber nodes` with `effectTag` and execute the corresponding operations of `effectTag` in turn. Is it necessary to traverse the `Fiber tree` again in the `commit phase` to find the `Fiber node` of `effectTag !== null`?

This is obviously very inefficient.

In order to solve this problem, in the upper function `completeUnitOfWork` of `completeWork`, each `Fiber node` that has completed `completeWork` and has an `effectTag` will be saved in a singly linked list called `effectList` .

The first `Fiber node` in `effectList` is stored in `fiber.firstEffect`, and the last element is stored in `fiber.lastEffect`.

Similar to `appendAllChildren`, in the "return" phase, all `Fiber nodes` with `effectTag` will be appended to `effectList`, and finally a singly linked list starting from `rootFiber.firstEffect` is formed.

```js
                       nextEffect nextEffect
rootFiber.firstEffect -----------> fiber -----------> fiber
```

In this way, you only need to traverse the `effectList` in the `commit phase` to execute all the `effects.

You can see this code logic [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L1744).

To borrow the words of `React` team member **Dan Abramov**: Compared with `Fiber Tree`, `effectList` is like the string of colorful lights hanging on a Christmas tree.

## End of process

At this point, all the work of the `render phase` is completed. In the `performSyncWorkOnRoot` function, the `fiberRootNode` is passed to the `commitRoot` method to start the `commit phase` workflow.

```js
commitRoot(root);
```

See the code [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L1107).

## Reference

`completeWork` flowchart

<img :src="$withBase('/img/completeWork.png')" alt="completeWork flowchart">