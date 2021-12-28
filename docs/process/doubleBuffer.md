Through the study in the previous section, we understand what `Fiber` is, and know that `Fiber node` can save the corresponding `DOM node`.

Correspondingly, the `Fiber tree` formed by `Fiber nodes` corresponds to the `DOM tree`.

So how to update `DOM`? This requires the use of a technique called "double buffering".

## What is "Double Cache"

When we draw an animation with `canvas`, before drawing each frame, `ctx.clearRect` will be called to clear the previous frame.

If the calculation amount of the current frame is relatively large, resulting in a long gap between clearing the previous frame and drawing the current frame, a white screen will appear.

In order to solve this problem, we can draw the current frame of animation in the memory, and directly replace the previous frame with the current frame after drawing. Since the calculation time between two frame replacements is omitted, there will be no change from the white screen to the screen appearing. Flicker situation.

This **build in memory and replace directly** technology is called [Double Cache](https://baike.baidu.com/item/%E5%8F%8C%E7%BC%93%E5%86% B2).

`React` uses "double cache" to complete the construction and replacement of the `Fiber tree`-corresponding to the creation and update of the `DOM tree`.

## Double Cache Fiber Tree

There will be at most two `Fiber trees` in `React` at the same time. The `Fiber tree` corresponding to the content displayed on the current screen is called the `current Fiber tree`, and the `Fiber tree` being built in memory is called the `workInProgress Fiber tree`.

The `Fiber node` in the `current Fiber tree` is called `current fiber`, and the `Fiber node` in the `workInProgress Fiber tree` is called `workInProgress fiber`, and they are connected by the `alternate` property.

```js
currentFiber.alternate === workInProgressFiber;
workInProgressFiber.alternate === currentFiber;
```

The root node of the `React` application completes the switching of the `current Fiber` tree point by switching the `current` pointer between the `rootFiber` of different `Fiber trees`.

That is, after the construction of the `workInProgress Fiber tree` is completed and handed over to the `Renderer` to render on the page, the `current` pointer of the application root node points to the `workInProgress Fiber tree`, at this time the `workInProgress Fiber tree` becomes the `current Fiber tree` .

A new `workInProgress Fiber tree` will be generated for each status update. The `DOM` update is completed by replacing `current` and `workInProgress`.

Next, we will explain the construction/replacement process of `mount time` and `update time` with specific examples.

## When mount

Consider the following example:

```js
function App() {
  const [num, add] = useState(0);
  return (
    <p onClick={() => add(num + 1)}>{num}</p>
  )
}

ReactDOM.render(<App/>, document.getElementById('root'));
```

1. The first execution of `ReactDOM.render` will create `fiberRootNode` (called `fiberRoot` in the source code) and `rootFiber`. Among them, `fiberRootNode` is the root node of the entire application, and `rootFiber` is the root node of the component tree where `<App/>` is located.

The reason why `fiberRootNode` and `rootFiber` are distinguished is because in the application we can call `ReactDOM.render` multiple times to render different component trees, and they will have different `rootFiber`. But there is only one root node for the entire application, and that is `fiberRootNode`.

The `current` of `fiberRootNode` will point to the `Fiber tree` corresponding to the rendered content on the current page, that is, the `current Fiber tree`.

<img :src="$withBase('/img/rootfiber.png')" alt="rootFiber">

```js
fiberRootNode.current = rootFiber;
```

Since it is the first screen rendering, there is no `DOM` mounted on the page, so the `rootFiber` pointed to by `fiberRootNode.current` does not have any `child Fiber nodes` (ie, the `current Fiber tree` is empty).


2. Next enter the `render phase`, and create a `Fiber node` in memory according to the `JSX` returned by the component and connect them together to build a `Fiber tree`, which is called a `workInProgress Fiber tree`. (The right side of the figure below is the tree built in memory, and the left is the tree displayed on the page)

When constructing the `workInProgress Fiber tree`, it will try to reuse the properties of the existing `Fiber node` in the `current Fiber tree`. When the `first screen rendering`, only the `rootFiber` has the corresponding `current fiber` (ie ` rootFiber.alternate`).

<img :src="$withBase('/img/workInProgressFiber.png')" alt="workInProgressFiber">

3. The completed `workInProgress Fiber tree` on the right side of the figure is rendered to the page in the `commit phase`.

At this time, `DOM` is updated to correspond to the tree on the right. The `current` pointer of `fiberRootNode` points to the `workInProgress Fiber tree` so that it becomes the `current Fiber tree`.

<img :src="$withBase('/img/wipTreeFinish.png')" alt="workInProgressFiberFinish">

## update time

1. Next we click on the `p node` to trigger the state change, which will start a new `render phase` and build a new `workInProgress Fiber tree`.

<img :src="$withBase('/img/wipTreeUpdate.png')" alt="wipTreeUpdate">

As with `mount`, the creation of `workInProgress fiber` can reuse the node data corresponding to the `current Fiber tree`.

> The process of determining whether to reuse is the Diff algorithm, which will be explained in detail in the following chapters

2. The `workInProgress Fiber tree` enters the `commit phase` after the completion of the construction in the `render phase` and is rendered on the page. After rendering, the `workInProgress Fiber tree` becomes the `current Fiber tree`.

<img :src="$withBase('/img/currentTreeUpdate.png')" alt="currentTreeUpdate">

## Summarize

This article introduces the process of constructing and replacing the `Fiber tree`, which is accompanied by the update of `DOM`.

So how is each `Fiber node` created during the construction process? We will explain in the [render stage](../process/reconciler.html) of the `architecture`.

## Reference

:::details Demo of Fiber Tree Creation and Switching

This `Demo` will print information on the console at the following timing:

-When constructing `WorkInProgrss Fiber`

-After the rendering is completed, when the `workInProgress Fiber tree` becomes the `current Fiber tree`

[Follow the public account](../me.html), backstage reply **812** to get the online Demo address

:::