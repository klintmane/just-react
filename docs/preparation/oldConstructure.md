In the previous section, we learned about the concept of `React`, a simple summary is **Quick Response**.

After upgrading from v15 to v16, `React` refactored the entire architecture. In this section, we will talk about v15 and see why it can't satisfy the concept of **quick response**, so that it has been refactored.

## React15 architecture

The React15 architecture can be divided into two layers:

-Reconciler-Responsible for finding the changed components
-Renderer (renderer)-responsible for rendering the changed components to the page

### Reconciler (Coordinator)

We know that in `React`, updates can be triggered through APIs such as `this.setState`, `this.forceUpdate`, and `ReactDOM.render`.

Whenever an update occurs, **Reconciler** will do the following:

-Call the `render` method of the function component or class component to convert the returned JSX into a virtual DOM
-Compare the virtual DOM with the virtual DOM at the last update
-Find out the virtual DOM that has changed in this update through comparison
-Notify **Renderer** to render the changed virtual DOM onto the page

> You can see the official explanation of `React` on **Reconciler** in [here](https://zh-hans.reactjs.org/docs/codebase-overview.html#reconcilers)

### Renderer

Since `React` supports cross-platform, different platforms have different **Renderers**. Our front-end is most familiar with the **Renderer** responsible for rendering in the browser environment-[ReactDOM](https://www.npmjs.com/package/react-dom).

Besides that:

-[ReactNative](https://www.npmjs.com/package/react-native) renderer, rendering App native components
-[ReactTest](https://www.npmjs.com/package/react-test-renderer) renderer, which renders pure Js objects for testing
-[ReactArt](https://www.npmjs.com/package/react-art) renderer, rendering to Canvas, SVG or VML (IE8)

When each update occurs, **Renderer** receives **Reconciler** notification and renders the changed components in the current host environment.

> You can see the official explanation of `React` on **Renderer** in [here](https://zh-hans.reactjs.org/docs/codebase-overview.html#renderers)

## Disadvantages of React15 architecture

In **Reconciler**, the component of `mount` will call [mountComponent](https://github.com/facebook/react/blob/15-stable/src/renderers/dom/shared/ReactDOMComponent.js#L498 ), the component of `update` will call [updateComponent](https://github.com/facebook/react/blob/15-stable/src/renderers/dom/shared/ReactDOMComponent.js#L877). Both of these methods update subcomponents recursively.

### Disadvantages of recursive updates

Due to the recursive execution, once the update starts, it cannot be interrupted in the middle. When the hierarchy is deep, the recursive update time exceeds 16ms, and the user interaction will be stuck.

In the previous section, we have proposed a solution-use **interruptible asynchronous update** instead of **synchronous update**. So does React15's architecture support asynchronous updates? Let's look at an example:

::: details Multiplication Demo
[Follow the public account](../me.html), backstage reply **222** to get the online Demo address

When initializing `state.count = 1`, every time you click the button `state.count++`

The values ​​of the 3 elements in the list are 1, 2, and 3 multiplied by the result of `state.count`
:::

I marked the update steps in red.
<img :src="$withBase('/img/v15.png')" alt="Update process">

We can see that **Reconciler** and **Renderer** work alternately. When the first `li` has changed on the page, the second `li` enters **Reconciler** again.

Since the entire process is synchronized, all DOMs are updated at the same time from the user's perspective.

Next, let us simulate what happens if the update is interrupted in the middle?

:::danger Attention
The following is our simulated interruption. In fact, `React15` will not interrupt the ongoing update
:::

<img :src="$withBase('/img/dist.png')" alt="Interrupt the update process">

The update is interrupted when the first `li` completes the update, that is, the update is interrupted after the completion of step 3, and the subsequent steps have not been executed yet.

The user originally expected `123` to become `246`. In fact, I saw an incompletely updated DOM! (Ie `223`)

For this reason, `React` decided to rewrite the entire architecture.