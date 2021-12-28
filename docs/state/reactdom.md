After five chapters of learning, we finally returned to the starting point of the `React` application.

In this section, we will walk through `ReactDOM.render` to complete the entire process of page rendering.

## Create fiber

From the section of [Double Buffer Mechanism](../process/doubleBuffer.html#mount), we know that the first execution of `ReactDOM.render` will create `fiberRootNode` and `rootFiber`. Among them, `fiberRootNode` is the root node of the entire application, and `rootFiber` is the `root node` of the component tree where the component is to be rendered.

This step occurs in the `legacyRenderSubtreeIntoContainer` method entered after calling `ReactDOM.render`.

```js
// container refers to the second parameter of ReactDOM.render (ie the DOM node mounted by the application)
root = container._reactRootContainer = legacyCreateRootFromDOMContainer(
  container,
  forceHydrate,
);
fiberRoot = root._internalRoot;
```

> You can see the code for this step from [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-dom/src/client/ReactDOMLegacy.js#L193)

The `legacyCreateRootFromDOMContainer` method internally calls the `createFiberRoot` method to complete the creation and association of `fiberRootNode` and `rootFiber`. And initialize `updateQueue`.

```js
export function createFiberRoot(
  containerInfo: any,
  tag: RootTag,
  hydrate: boolean,
  hydrationCallbacks: null | SuspenseHydrationCallbacks,
): FiberRoot {
  // Create fiberRootNode
  const root: FiberRoot = (new FiberRootNode(containerInfo, tag, hydrate): any);
  
  // Create rootFiber
  const uninitializedFiber = createHostRootFiber(tag);

  // Connect rootFiber and fiberRootNode
  root.current = uninitializedFiber;
  uninitializedFiber.stateNode = root;

  // Initialize updateQueue
  initializeUpdateQueue(uninitializedFiber);

  return root;
}
```

Based on the above code, now we can add references from `rootFiber` to `fiberRootNode` on the basis of [Double Buffer Mechanism](../process/doubleBuffer.html#mount).

<img :src="$withBase('/img/fiberroot.png')" alt="fiberRoot">

> You can see the code for this step from [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberRoot.new.js#L97)

## Create update

We have completed the initialization of the component, and then wait for the creation of `Update` to start an update.

This step occurs in the `updateContainer` method.

```js
export function updateContainer(
  element: ReactNodeList,
  container: OpaqueRoot,
  parentComponent: ?React$Component<any, any>,
  callback: ?Function,
): Lane {
  // ...omit code not related to logic

  // Create update
  const update = createUpdate(eventTime, lane, suspenseConfig);
  
  // update.payload is a component that needs to be mounted on the root node
  update.payload = {element};

  // callback is the third parameter of ReactDOM.render-callback function
  callback = callback === undefined? null: callback;
  if (callback !== null) {
    update.callback = callback;
  }

  // Add the generated update to updateQueue
  enqueueUpdate(current, update);
  // schedule update
  scheduleUpdateOnFiber(current, lane, eventTime);

  // ...omit code not related to logic
}
```

> You can see the code of `updateContainer` from [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberReconciler.new.js#L255)

It is worth noting that `update.payload = {element};`

This is what we introduced in the [Update section](the structure of./update.html#update). For `HostRoot`, `payload` is the first parameter of `ReactDOM.render`.

## Process overview

At this point, the process of `ReactDOM.render` is connected to the process we already know.

The whole process is as follows:

```sh
Create fiberRootNode, rootFiber, updateQueue (`legacyCreateRootFromDOMContainer`)

    |
    |
    v

Create an Update object (`updateContainer`)

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

## Other entry functions of React

There are currently three modes of `React`:

-`legacy`, this is the current method used by `React`. There are currently no plans to remove this mode, but this mode may not support some new features.

-`blocking`, an intermediate mode that enables some features of `concurrent` mode. Currently in experiment. As the first step in migrating to `concurrent` mode.

-`concurrent`, a future-oriented development model. The `task interrupt/task priority` we talked about before are all aimed at the `concurrent` mode.

You can see the feature support of various modes from the following table:

| | legacy mode | blocking mode | concurrent mode |
|--- |--- |--- |--- |
|[String Refs](https://zh-hans.reactjs.org/docs/refs-and-the-dom.html#legacy-api-string-refs) |✅ |🚫** |🚫** |
|[Legacy Context](https://zh-hans.reactjs.org/docs/legacy-context.html) |✅ |🚫** |🚫** |
|[findDOMNode](https://zh-hans.reactjs.org/docs/strict-mode.html#warning-about-deprecated-finddomnode-usage) |✅ |🚫** |🚫** |
|[Suspense](https://zh-hans.reactjs.org/docs/concurrent-mode-suspense.html#what-is-suspense-exactly) |✅ |✅ |✅ |
|[SuspenseList](https://zh-hans.reactjs.org/docs/concurrent-mode-patterns.html#suspenselist) |🚫 |✅ |✅ |
|Suspense SSR + Hydration |🚫 |✅ |✅ |
|Progressive Hydration |🚫 |✅ |✅ |
|Selective Hydration |🚫 |🚫 |✅ |
|Cooperative Multitasking |🚫 |🚫 |✅ |
|Automatic batching of multiple setStates|🚫* |✅ |✅ |
|[Priority-based Rendering](https://zh-hans.reactjs.org/docs/concurrent-mode-patterns.html#splitting-high-and-low-priority-state) |🚫 |🚫 |✅ |
|[Interruptible Prerendering](https://zh-hans.reactjs.org/docs/concurrent-mode-intro.html#interruptible-rendering) |🚫 |🚫 |✅ |
|[useTransition](https://zh-hans.reactjs.org/docs/concurrent-mode-patterns.html#transitions) |🚫 |🚫 |✅ |
|[useDeferredValue](https://zh-hans.reactjs.org/docs/concurrent-mode-patterns.html#deferring-a-value) |🚫 |🚫 |✅ |
|[Suspense Reveal "Train"](https://zh-hans.reactjs.org/docs/concurrent-mode-patterns.html#suspense-reveal-train) |🚫 |🚫 |✅ |

*: The `legacy` mode has the function of automatic batch processing in the synthesis event, but it is limited to one browser task. If you want to use this function for non-`React` events, you must use `unstable_batchedUpdates`. In `blocking` mode and `concurrent` mode, all `setState` are batched by default.

**: A warning will be issued during development.

The change of mode affects the way the entire application works, so it is not possible to enable different modes for only one component.

For this reason, different modes can be opened through different `entry functions`:

-`legacy` - `ReactDOM.render(<App />, rootNode)`
-`blocking` - `ReactDOM.createBlockingRoot(rootNode).render(<App />)`
-`concurrent` - `ReactDOM.createRoot(rootNode).render(<App />)`

> You can see the `React` team explaining why there are so many model

Although the `entry functions` of different modes are different, they only affect the `fiber.mode` variables, and have no effect on the process described in [Process Overview](./reactdom.html#Process Overview).