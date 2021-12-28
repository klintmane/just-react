The design of the software is to serve the concept. Only when you understand the design concept, can you understand how to structure in order to realize such a concept.

So, before we dive into the source code architecture, let's talk about the concept of `React`.

## React concept
We can see the concept of `React` from [Official Website](https://zh-hans.reactjs.org/docs/thinking-in-react.html):
> We believe that React is the preferred way to build large, **responsive** web applications with JavaScript. It performs well on Facebook and Instagram.

It can be seen that the key is to achieve `quick response`. So what are the factors restricting `quick response`?

When we use apps every day, when we browse the web, there are two types of scenarios that restrict `quick response`:

-When encountering a large amount of computing operations or insufficient device performance, the page will drop frames, resulting in freezes.

-After sending the network request, it is unable to respond quickly due to the need to wait for the data to return before further operations.

These two types of scenarios can be summarized as:

-CPU bottleneck

-IO bottleneck

How does React solve these two bottlenecks?

## CPU bottleneck

When the project becomes huge and the number of components is numerous, it is easy to encounter the CPU bottleneck.

Consider the following Demo, we render 3000 `li` to the view:

```js
function App() {
  const len ​​= 3000;
  return (
    <ul>
      {Array(len).fill(0).map((_, i) => <li>{i}</li>)}
    </ul>
  );
}

const rootEl = document.querySelector("#root");
ReactDOM.render(<App/>, rootEl);
```

The refresh rate of mainstream browsers is 60Hz, that is, the browser refreshes every (1000ms / 60Hz) 16.6ms.

We know that JS can manipulate the DOM, and `GUI rendering thread` and `JS thread` are mutually exclusive. So **JS script execution** and **browser layout and drawing** cannot be executed at the same time.

In every 16.6ms, the following tasks need to be completed:

```
JS script execution ----- style layout ----- style drawing
```

When the JS execution time is too long, exceeding 16.6ms, there will be no time to execute **style layout** and **style drawing** in this refresh.

In the Demo, due to the large number of components (3000), the execution time of the JS script is too long, and the page drops frames, causing a freeze.

As you can see from the printed execution stack diagram, the JS execution time is 73.65ms, which is much more than one frame.

<img :src="$withBase('/img/long-task.png')" alt="long task">

How to solve this problem?

The answer is: in each frame of the browser, some time is reserved for the JS thread, and `React` uses this part of the time to update the components (you can see it in [source code](https://github.com/facebook/ react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/scheduler/src/forks/SchedulerHostConfig.default.js#L119), the initial time reserved is 5ms).

When the reserved time is not enough, `React` returns thread control to the browser to allow time to render the UI, and `React` waits for the next frame time to continue the interrupted work.

> This kind of operation of splitting long tasks into each frame and performing a short period of tasks at a time like ants moving is called `time slice` (time slice)

Next we turn on the `Concurrent Mode` (the subsequent chapters will talk about it, currently you only need to understand that the `time slice` will be enabled after turning it on):

```js {3}
// Turn on Concurrent Mode by using ReactDOM.unstable_createRoot
// ReactDOM.render(<App/>, rootEl);
ReactDOM.unstable_createRoot(rootEl).render(<App/>);
```

At this time, our long task is split into different `tasks` in each frame, and the execution time of `JS script` is roughly around `5ms`, so that the browser has the remaining time to execute **style layout** and ** Style drawing** to reduce the possibility of dropped frames.

<img :src="$withBase('/img/time-slice.png')" alt="long task">

Therefore, the key to solving the `CPU bottleneck` is to implement `time slicing`, and the key to `time slicing` is to change the **synchronous update** into an **interruptible asynchronous update**.

::: details Synchronous update vs asynchronous update Demo
We have a large list of very time-consuming updates, let us see the response speed of the input box when **Synchronous Update** and **Asynchronous Update**

[Follow the public account](../me.html), backstage reply **323** to get the online Demo address

As you can see from the Demo, when sacrificing the update speed of the list, `React` greatly improves the input response speed and makes the interaction more natural.

:::

## IO bottleneck

`Network delay` is something that front-end developers cannot solve. How to reduce the user's perception of `network delay` when `network delay` exists objectively?

The answer given by `React` is [Integrate the results of human-computer interaction research into the real UI](https://zh-hans.reactjs.org/docs/concurrent-mode-intro.html#putting-research- into-production).

Here we take the industry's top human-computer interaction apple as an example, in the IOS system:

Click "General" in the "Settings" panel to enter the "General" interface:

<img :src="$withBase('/img/legacy-move.gif')" alt="synchronization">

For comparison, click "Siri and Search" in the "Settings" panel to enter the "Siri and Search" interface:

<img :src="$withBase('/img/concurrent-mov.gif')" alt="asynchronous">

Can you feel the difference in experience between the two?

In fact, the interaction after clicking "General" is synchronized, and the subsequent interface is displayed directly. The interaction after clicking "Siri and Search" is asynchronous, and you need to wait for the request to return before displaying the subsequent interface. But from the perspective of user perception, the difference between the two is minimal.

The trick here is: After clicking "Siri and Search", first stay on the current page for a short period of time, and this short period of time is used to request data.

When "this short period of time" is short enough, the user is unaware. If the request time exceeds a range, the effect of `loading` will be displayed.

Imagine if we clicked "Siri and Search" to display the `loading` effect, even if the data request time is very short, the `loading` effect will flash by. The user can also perceive it.

To this end, `React` implements the [Suspense](https://zh-hans.reactjs.org/docs/concurrent-mode-suspense.html) function and the supporting `hook`——[useDeferredValue](https:/ /zh-hans.reactjs.org/docs/concurrent-mode-reference.html#usedeferredvalue).

In the source code, in order to support these features, it is also necessary to change the **synchronous update** to the **interruptible asynchronous update**.


## Summarize

Through the above content, we can see the efforts made by `React` in order to implement the concept of "building a large-scale web application that is **fast and responsive**".

The key is to solve the CPU bottleneck and IO bottleneck. To implement it, you need to change the **synchronous update** into an **interruptible asynchronous update**.

## Reference

["English" You Yuxi on JavaScript Framework Design Philosophy: Balance](https://www.bilibili.com/video/BV134411c7Sk?from=search&seid=17404881291635824595)