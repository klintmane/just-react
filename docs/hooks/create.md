In order to better understand the principle of `Hooks`, in this section we follow the running process of `React` and implement a minimalist `useState Hook` with less than 100 lines of code. It is recommended to look at the content of this section against the code.

## working principle

For `useState Hook`, consider the following example:

```js
function App() {
  const [num, updateNum] = useState(0);

  return <p onClick={() => updateNum(num => num + 1)}>{num}</p>;
}
```

The work can be divided into two parts:

1. Generate `update` through some ways, `update` will cause component `render`.

2. When the component `render`, the `num` returned by `useState` is the updated result.

Among them, the `update` of `step 1` can be divided into `mount` and `update`:

1. Calling `ReactDOM.render` will generate `update` of `mount`, and the content of `update` is `initialValue` of `useState` (ie `0`).

2. Clicking the `p` tag to trigger `updateNum` will generate an `update` of `update`, and the content of `update` is `num => num + 1`.

Next, explain how to achieve these two steps.

## What is the update

> 1. Generate `update` through some ways, `update` will cause component `render`.

First of all, we have to clarify what the `update` is.

In our minimalist example, `update` is the following data structure:

```js
const update = {
  // update the executed function
  action,
  // Form a linked list with other updates of the same Hook
  next: null
}
```

For `App`, the `action` of `update` generated by clicking the `p` tag is `num => num + 1`.

If we write `onClick` of `App` instead:

```js
// Before
return <p onClick={() => updateNum(num => num + 1)}>{num}</p>;

// after
return <p onClick={() => {
  updateNum(num => num + 1);
  updateNum(num => num + 1);
  updateNum(num => num + 1);
}}>{num}</p>;
```

Then clicking the `p` label will generate three `update`.

## update data structure

How are these `update` combined together?

The answer is: they will form a `ring singly linked list`.

Calling `updateNum` actually calls `dispatchAction.bind(null, hook.queue)`, let’s first understand this function:

```js
function dispatchAction(queue, action) {
  // Create update
  const update = {
    action,
    next: null
  }

  // Circular singly linked list operation
  if (queue.pending === null) {
    update.next = update;
  } else {
    update.next = queue.pending.next;
    queue.pending.next = update;
  }
  queue.pending = update;

  // Simulate React and start scheduling updates
  schedule();
}
```

The operation of circular linked list is not easy to understand. Here we will explain it in detail.

When the first `update` (we call him `u0`) is generated, then `queue.pending === null`.

`update.next = update;` that is, `u0.next = u0`, he will connect end to end with himself to form a `single-directional circular linked list`.

Then `queue.pending = update;` that is, `queue.pending = u0`

```js
queue.pending = u0 ---> u0
                ^ |
                | |
                ---------
```

When the second `update` (we call him `u1`) is generated, `update.next = queue.pending.next;`, at this time `queue.pending.next === u0`,
That is, `u1.next = u0`.

`queue.pending.next = update;`, that is, `u0.next = u1`.

Then `queue.pending = update;` i.e. `queue.pending = u1`

```js
queue.pending = u1 ---> u0
                ^ |
                | |
                ---------
```

You can follow this example to simulate the situation of inserting multiple `update`, and you will find that `queue.pending` always points to the last inserted `update`.

The advantage of this is that when we want to traverse `update`, `queue.pending.next` points to the first inserted `update`.

## How to save the status

Now we know that the `update` object generated by the `update` will be stored in the `queue`.

Instances other than `ClassComponent` can store data. For `FunctionComponent`, where is `queue` stored?

The answer is: in `fiber` corresponding to `FunctionComponent`.

We use the following simplified `fiber` structure:

```js
// The fiber object corresponding to the App component
const fiber = {
  // Save the Hooks linked list corresponding to the FunctionComponent
  memoizedState: null,
  // Point to App function
  stateNode: App
};
```

## Hook data structure

Next we pay attention to the data structure of `Hook` saved in `fiber.memoizedState`.

As you can see, `Hook` is similar to `update`, and both are connected through a `linked list`. However, `Hook` is a `singly linked list` without a ring.

```js
hook = {
  // Save the update queue, which is the queue described above
  queue: {
    pending: null
  },
  // Save the state corresponding to the hook
  memoizedState: initialState,
  // Connect with the next Hook to form a one-way acyclic linked list
  next: null
}
```

::: warning note
Pay attention to distinguish the belonging relationship between `update` and `hook`:

Each `useState` corresponds to a `hook` object.

When calling `const [num, updateNum] = useState(0);`, the `update` generated by `updateNum` (that is, the `dispatchAction` described above) is saved in the `hook.queue` corresponding to `useState`.

:::

## Simulate the React scheduling update process

At the end of `dispatchAction` above, we use the `schedule` method to simulate the `React` scheduling update process.

```js
function dispatchAction(queue, action) {
  // ... create update
  
  // ... circular singly linked list operation

  // Simulate React and start scheduling updates
  schedule();
}
```

Now we come to realize him.

We use the `isMount` variable to refer to whether it is `mount` or `update`.

```js
// The first render is mount
isMount = true;

function schedule() {
  // Reset workInProgressHook to the first Hook saved by the fiber before updating
  workInProgressHook = fiber.memoizedState;
  // trigger component render
  fiber.stateNode();
  // The first render of the component is mount, and the update to be triggered later is update
  isMount = false;
}
```

Point to the currently working `hook` through the `workInProgressHook` variable.

```js
workInProgressHook = fiber.memoizedState;
```

When the component `render`, whenever we encounter the next `useState`, we move the pointer of `workInProgressHook`.

```js
workInProgressHook = workInProgressHook.next;
```

In this way, as long as the calling sequence and number of `useState` are the same every time the component `render`, then the `hook` object corresponding to the current `useState` can always be found through `workInProgressHook`.


So far, we have completed the first step.

> 1. Generate `update` through some ways, `update` will cause component `render`.

Next, implement the second step.

> 2. When the component `render`, the `num` returned by `useState` is the updated result.

## Calculate state

The component `render` will call `useState`, and its general logic is as follows:

```js
function useState(initialState) {
  // The hook currently used by useState will be assigned to this variable
  let hook;

  if (isMount) {
    // ... the hook object needs to be generated when mounting
  } else {
    //...Retrieve the hook corresponding to the useState from workInProgressHook during update
  }

  let baseState = hook.memoizedState;
  if (hook.queue.pending) {
    //...Update the state according to the update saved in queue.pending
  }
  hook.memoizedState = baseState;

  return [baseState, dispatchAction.bind(null, hook.queue)];
}
```

We first focus on how to obtain the `hook` object:

```js
if (isMount) {
  // Generate a hook for the useState when mounting
  hook = {
    queue: {
      pending: null
    },
    memoizedState: initialState,
    next: null
  }

  // Insert the hook into the end of the fiber.memoizedState linked list
  if (!fiber.memoizedState) {
    fiber.memoizedState = hook;
  } else {
    workInProgressHook.next = hook;
  }
  // Move the workInProgressHook pointer
  workInProgressHook = hook;
} else {
  // Find the corresponding hook during update
  hook = workInProgressHook;
  // Move the workInProgressHook pointer
  workInProgressHook = workInProgressHook.next;
}

```

When the `hook` corresponding to the `useState` is found, if the `hook.queue.pending` is not empty (that is, there is `update`), the `state` is updated.

```js
// Initial state before update execution
let baseState = hook.memoizedState;

if (hook.queue.pending) {
  // Get the first update in the update ring singly linked list
  let firstUpdate = hook.queue.pending.next;

  do {
    // Execute update action
    const action = firstUpdate.action;
    baseState = action(baseState);
    firstUpdate = firstUpdate.next;

    // Jump out of the loop after the last update is executed
  } while (firstUpdate !== hook.queue.pending.next)

  // Clear queue.pending
  hook.queue.pending = null;
}

// Use the state after the update action is executed as memoizedState
hook.memoizedState = baseState;
```

The complete code is as follows:

```js
function useState(initialState) {
  let hook;

  if (isMount) {
    hook = {
      queue: {
        pending: null
      },
      memoizedState: initialState,
      next: null
    }
    if (!fiber.memoizedState) {
      fiber.memoizedState = hook;
    } else {
      workInProgressHook.next = hook;
    }
    workInProgressHook = hook;
  } else {
    hook = workInProgressHook;
    workInProgressHook = workInProgressHook.next;
  }

  let baseState = hook.memoizedState;
  if (hook.queue.pending) {
    let firstUpdate = hook.queue.pending.next;

    do {
      const action = firstUpdate.action;
      baseState = action(baseState);
      firstUpdate = firstUpdate.next;
    } while (firstUpdate !== hook.queue.pending.next)

    hook.queue.pending = null;
  }
  hook.memoizedState = baseState;

  return [baseState, dispatchAction.bind(null, hook.queue)];
}
```

## Abstract the trigger event

Finally, let's abstract a little bit about how events are triggered by `React`.

Simulate the behavior of the component `click` by calling the `click` method returned by the `App`.

```js
function App() {
  const [num, updateNum] = useState(0);

  console.log(`${isMount?'mount':'update'} num: `, num);

  return {
    click() {
      updateNum(num => num + 1);
    }
  }
}
```

## Online Demo

So far, we have completed a `Hooks` with less than 100 lines of code. The important thing is that it has the same operating logic as `React`.

::: details Streamline Hooks' online demo

Call `window.app.click()` to simulate component click event.

You can also use multiple `useState`.

```js
function App() {
  const [num, updateNum] = useState(0);
  const [num1, updateNum1] = useState(100);

  console.log(`${isMount?'mount':'update'} num: `, num);
  console.log(`${isMount?'mount':'update'} num1: `, num1);

  return {
    click() {
      updateNum(num => num + 1);
    },
    focus() {
      updateNum1(num => num + 3);
    }
  }
}
```

[Follow the public account](../me.html), backstage reply **616** to get the online Demo address

:::

## Difference with React

We simulated the operation of `Hooks` with as little code as possible, but compared to `React Hooks`, it has many shortcomings. The following are the differences between him and `React Hooks`:

1. `React Hooks` does not use the `isMount` variable, but uses different `dispatcher` at different times. In other words, `useState` at `mount` and `useState` at `update` are not the same function.

2. `React Hooks` has an optimization method to skip the `update` halfway.

3. `React Hooks` has `batchedUpdates`. When `updateNum` is triggered three times in `click`, `Streamline React` will trigger three updates, while `React` will only trigger once.

4. The `update` of `React Hooks` has the concept of `priority`, and you can skip the `update` with low priority.

For more details, we will explain in subsequent sections of this chapter.