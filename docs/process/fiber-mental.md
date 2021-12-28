React core team member [Sebastian Markbåge](https://github.com/sebmarkbage/) (the inventor of `React Hooks`) once said: What we do in `React` is to practice `Algebraic Effects` (Algebraic Effects) ).

So, what is the `algebraic effect`? What does he have to do with `React`.

## What is algebraic effect

`Algebraic effect` is a concept in `functional programming`, used to separate `side effects` from `function` calls.

Next, we use `fictional grammar` to explain.

Suppose we have a function `getTotalPicNum`, after passing in two `user names`, respectively find the number of pictures saved by the user on the platform, and finally add the number of pictures and return.

```js
function getTotalPicNum(user1, user2) {
  const picNum1 = getPicNum(user1);
  const picNum2 = getPicNum(user2);

  return picNum1 + picNum2;
}
```

In `getTotalPicNum`, we don't care about the implementation of `getPicNum`, only the process of "getting two numbers and returning the result of adding them".

Next we will implement `getPicNum`.

The "number of pictures saved by the user on the platform" is stored in the server. Therefore, in order to obtain this value, we need to initiate an asynchronous request.

In order to keep the calling method of `getTotalPicNum` unchanged as much as possible, we first thought of using `async await`:

```js
async function getTotalPicNum(user1, user2) {
  const picNum1 = await getPicNum(user1);
  const picNum2 = await getPicNum(user2);

  return picNum1 + picNum2;
}
```

However, `async await` is `contagious`-when a function becomes `async`, it means that the function that calls it also needs to be `async`, which destroys the synchronization characteristics of `getTotalPicNum`.

Is there any way to implement asynchronous requests while keeping `getTotalPicNum` unchanged from the existing calling method?

no. But we can `make up` one.

We make up a grammar similar to `try...catch`-`try...handle` and two operators `perform` and `resume`.

```js
function getPicNum(name) {
  const picNum = perform name;
  return picNum;
}

try {
  getTotalPicNum('kaSong','xiaoMing');
} handle (who) {
  switch (who) {
    case'kaSong':
      resume with 230;
    case'xiaoMing':
      resume with 122;
    default:
      resume with 0;
  }
}
```

When the `getPicNum` method inside `getTotalPicNum` is executed, the `perform name` will be executed.

At this time, the function call stack will jump out of the `getPicNum` method and be captured by the most recent `try...handle`. Similar to `throw Error`, it was caught by the latest `try...catch`.

Similar to `throw Error`, `Error` will be used as the parameter of `catch`, and after `perform name`, `name` will be used as the parameter of `handle`.

The biggest difference with `try...catch` is that when `Error` is caught by `catch`, the previous call stack is destroyed. And after `handle` executes `resume`, it will return to the call stack of previous `perform`.

For `case'kaSong'`, the call stack will return to `getPicNum` after executing `resume with 230;`, at this time `picNum === 230`

::: warning note

Again, the syntax of `try...handle` is fictitious, just to demonstrate the idea of ​​`algebraic effect`.

:::

To summarize: the `algebraic effect` can separate the `side effects` (in the example, the number of images requested) from the function logic, keeping the focus of the function pure.

And, as can be seen from the example, `perform resume` does not need to distinguish between synchronous and asynchronous.

## Application of Algebraic Effect in React

So what is the relationship between `Algebraic Effect` and `React`? The most obvious example is `Hooks`.

For `Hook`s like `useState`, `useReducer`, and `useRef`, we don't need to pay attention to how the `state` of `FunctionComponent` is saved in `Hook`, `React` will handle it for us.

We just need to assume that `useState` returns the `state` we want, and write business logic.

```js
function App() {
  const [num, updateNum] = useState(0);
  
  return (
    <button onClick={() => updateNum(num => num + 1)}>{num}</button>
  )
}
```

If this example is not obvious enough, you can take a look at the official [Suspense Demo](https://codesandbox.io/s/frosty-hermann-bztrp?file=/src/index.js:152-160)

In `Demo`, `ProfileDetails` is used to display `user name`. The `username` is an `asynchronous request`.

But in `Demo` it is completely the way of writing `Synchronous`.

```js
function ProfileDetails() {
  const user = resource.user.read();
  return <h1>{user.name}</h1>;
}
```

## Algebraic Effects and Generator

From `React15` to `React16`, a major goal of the refactoring of the reconciler (`Reconciler`) is to change the architecture of the old `synchronous update` into an `asynchronous interruptible update`.

`Asynchronous interruptible update` can be understood as: `Update` may be interrupted in the execution process (the browser time slice is exhausted or there is a higher-quality task jump in the queue), and the intermediate state of the previous execution will be restored when the execution can continue. .

This is the role of `try...handle` in `Algebraic Effect`.

In fact, the browser natively supports a similar implementation, this is `Generator`.

But some flaws in `Generator` caused the `React` team to abandon him:

-Similar to `async`, `Generator` is also `contagious`, and other functions of the context need to be changed if `Generator` is used. This kind of mental burden is heavier.

-The `Intermediate state` executed by `Generator` is context dependent.

Consider the following example:

```js
function* doWork(A, B, C) {
  var x = doExpensiveWorkA(A);
  yield;
  var y = x + doExpensiveWorkB(B);
  yield;
  var z = y + doExpensiveWorkC(C);
  return z;
}
```

Whenever the browser has free time, it will execute one of the `doExpensiveWork`s in sequence. When the time runs out, it will be interrupted, and when it resumes again, it will continue to execute from the interrupted location.

Only considering the "interruption and continuation of a single priority task" `Generator` can well implement `asynchronous interruptible update`.

But when we consider the "high-priority task jumping in line" situation, if the `doExpensiveWorkA` and `doExpensiveWorkB` have been completed at this time, the `x` and `y` are calculated.

At this time, the `B` component receives a `high-quality update`. Since the `intermediate state` executed by the `Generator` is context-dependent, the previously calculated `x` cannot be reused when calculating the `y`, and it needs to be renewed calculate.

If the previously executed `intermediate state` is saved through `global variables`, new complexity will be introduced.

> For more detailed explanation, please refer to [this issue](https://github.com/facebook/react/issues/7942#issuecomment-254987818)

For these reasons, `React` did not use `Generator` to implement `Coordinator`.

## Algebraic Effects and Fiber

`Fiber` is not a new term in computer terminology. Its Chinese translation is called `丝程`, which is the same program execution process as Process, Thread, and Coroutine.

In many articles, `fiber` is understood as an implementation of `coroutine`. In `JS`, the implementation of `coroutine` is `Generator`.

Therefore, we can understand `Fiber` (Fiber) and `Coroutine` (Generator) as the embodiment of the idea of ​​`Algebraic Effect` in `JS`.

`React Fiber` can be understood as:

A set of state update mechanism implemented internally by `React`. Support tasks with different `priorities`, which can be interrupted and resumed, and the previous `intermediate state` can be reused after recovery.

Each task update unit is the `Fiber node` corresponding to `React Element`.

In the next section, we will explain the implementation of `Fiber Architecture` in detail.