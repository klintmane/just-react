In the [New React Architecture Section](../preparation/newConstructure.md), the **virtual DOM** we mentioned has a formal name in `React`-`Fiber`. In the following study, we will gradually use `Fiber` to replace the name **React16 virtual DOM**.

Next, let us understand why `Fiber` comes from? What is his role?

## Origin of Fiber

> The earliest official explanation of `Fiber` comes from [An introduction by React team member Acdlite in 2016](https://github.com/acdlite/react-fiber-architecture).

From the study in the previous chapter, we know:

In `React15` and before, `Reconciler` used a recursive method to create a virtual DOM, and the recursive process could not be interrupted. If the level of the component tree is very deep, recursion will take up a lot of thread time and cause lag.

In order to solve this problem, `React16` restructured **recursive uninterruptible update** into **asynchronous interruptible update**, because the **virtual DOM** data structure used for recursion can no longer meet the needs. . Thus, the new `Fiber` architecture came into being.

## The meaning of Fiber

`Fiber` has three meanings:

1. As an architecture, the previous `Reconciler` of `React15` was executed recursively, and the data was stored in the recursive call stack, so it was called `stack Reconciler`. The `Reconciler` of `React16` is implemented based on the `Fiber node` and is called `Fiber Reconciler`.

2. As a static data structure, each `Fiber node` corresponds to a `React element`, which saves the type of the component (function component/class component/native component...), corresponding DOM node and other information.

3. As a dynamic unit of work, each `Fiber node` saves the changed state of the component in this update and the work to be performed (need to be deleted/inserted into the page/updated...).

## Fiber structure

You can see [Attribute definition of Fiber node](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiber.new.js#L117) from here. Although there are many attributes, we can classify them according to three meanings

```js
function FiberNode(
  tag: WorkTag,
  pendingProps: mixed,
  key: null | string,
  mode: TypeOfMode,
) {
  // as an attribute of a static data structure
  this.tag = tag;
  this.key = key;
  this.elementType = null;
  this.type = null;
  this.stateNode = null;

  // Used to connect other Fiber nodes to form a Fiber tree
  this.return = null;
  this.child = null;
  this.sibling = null;
  this.index = 0;

  this.ref = null;

  // Attributes as a dynamic unit of work
  this.pendingProps = pendingProps;
  this.memoizedProps = null;
  this.updateQueue = null;
  this.memoizedState = null;
  this.dependencies = null;

  this.mode = mode;

  this.effectTag = NoEffect;
  this.nextEffect = null;

  this.firstEffect = null;
  this.lastEffect = null;

  // Scheduling priority related
  this.lanes = NoLanes;
  this.childLanes = NoLanes;

  // Point to the fiber corresponding to the fiber in another update
  this.alternate = null;
}
```

### As an architecture

Each Fiber node has a corresponding `React element`. How are multiple `Fiber nodes` connected to form a tree? Rely on the following three attributes:

```js
// Point to the parent Fiber node
this.return = null;
// Point to child Fiber node
this.child = null;
// Point to the first sibling Fiber node on the right
this.sibling = null;
```

For example, the following component structure:

```js
function App() {
  return (
    <div>
      i am
      <span>KaSong</span>
    </div>
  )
}
```

The corresponding `Fiber tree` structure:
<img :src="$withBase('/img/fiber.png')" alt="Fiber Architecture">

> I need to mention here, why is the parent pointer called `return` instead of `parent` or `father`? Because as a unit of work, `return` refers to the next node that the node will return after completing `completeWork` (described later in this chapter). The child `Fiber node` and its sibling nodes will return to their parent node after completing their work, so use `return` to refer to the parent node.

### As a static data structure

As a static data structure, it saves component-related information:

```js
// Fiber corresponding component type Function/Class/Host...
this.tag = tag;
// key attribute
this.key = key;
// Most cases are the same type, some cases are different, for example, FunctionComponent uses React.memo package
this.elementType = null;
// For FunctionComponent, it refers to the function itself, for ClassComponent, it refers to class, and for HostComponent, it refers to the DOM node tagName
this.type = null;
// The real DOM node corresponding to Fiber
this.stateNode = null;
```

### As a dynamic unit of work

As a dynamic work unit, the following parameters in `Fiber` save the information related to this update. We will introduce them in detail when specific attributes are used in the subsequent update process.

```js

// Save the information about the status change caused by this update
this.pendingProps = pendingProps;
this.memoizedProps = null;
this.updateQueue = null;
this.memoizedState = null;
this.dependencies = null;

this.mode = mode;

// Save the DOM operation caused by this update
this.effectTag = NoEffect;
this.nextEffect = null;

this.firstEffect = null;
this.lastEffect = null;
```

The following two fields store information related to scheduling priority, which will be introduced when explaining `Scheduler`.

```js
// Scheduling priority related
this.lanes = NoLanes;
this.childLanes = NoLanes;
```

::: warning note
In May 2020, the scheduling priority strategy has undergone a relatively large restructuring. The priority model represented by the `expirationTime` property is replaced by `lane`. See [this PR](https://github.com/facebook/react/pull/18796) for details

If `fiber.expirationTime` still exists in your source code, please refer to the [Debug Source](../preparation/source.html) chapter to get the latest code.
:::

## Summarize

In this section, we understand the origin and structure of `Fiber`, among which `Fiber nodes` can form `Fiber trees`. So what is the relationship between the `Fiber tree` and the `DOM tree` presented on the page, and how does `React` update the `DOM`?

We will explain in the next section.

## Reference

[Lin Clark-A Cartoon Intro to Fiber-React Conf 2017](https://www.bilibili.com/video/BV1it411p7v6?from=search&seid=3508901752524570226)