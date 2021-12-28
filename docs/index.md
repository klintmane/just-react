The purpose of this book is to create a rigorous and easy-to-understand `React` source code analysis tutorial.

In order to achieve this goal, in terms of writing, this book will follow:

1. Unpredictable opinions-all opinions are shared by members of the core team of `React` in public.

2. Rich reference materials-including online demos, articles, and videos.

3. Keep up-to-date-will be added in time after the `React` version is updated. The current version is `v17.0.0-alpha`.

## Tutorial video

Each student's foundation, learning purpose, and disposable learning time are different. For things like "learning source code" that require long-term investment, you need to carefully consider the input-output ratio.

To this end, I recorded a [Guide Video](https://www.bilibili.com/video/BV1Ki4y1u7Vr) at station B.

In the first half of the video, I divided the "learning source code" into 5 levels and explained:

-What knowledge needs to be mastered to reach each level

-How to master this knowledge the fastest

-What will you gain after reaching this level

Before studying this book, you can make trade-offs based on your own situation, with a target.

In the second half of the video, I will use a `Demo` to demonstrate the running process of the `React` source code to lay a foundation for you to learn the contents of this book.

::: warning video course
The amount of information contained in the text is limited, students who are pursuing efficiency can consider [video course](https://ke.segmentfault.com/course/1650000023864436), let me take you with you to debug the source code.
:::

## Chapter description

We did not start with the familiar APIs such as `ReactDOM.render`, `this.setState` or `Hooks`, etc., but started from a relatively high level of abstraction such as **idea**. This is Deliberately.

From concept to architecture, from architecture to implementation, from implementation to specific code.

This is a process of top-down, diminishing abstraction, in line with cognition. If you directly explain the API, it is easy to fall into the ocean of source code.

Based on this, the book is divided into `ideas`, `architecture`, and `implementation`.

## Chapter list

### Idea

#### Chapter 1 React Concept

✅ React concept

✅ Old React architecture

✅ New React architecture

✅ The mental model of Fiber architecture

✅ The realization principle of Fiber architecture

✅ How the Fiber architecture works

✅ Summary

#### Chapter 2 Pre-Knowledge

✅ The file structure of the source code

✅ Debug source code

✅ Deep understanding of JSX

### Architecture

#### Chapter 3 Render Phase

✅ Process overview

✅ beginWork

✅ completeWork

#### Chapter 4 commit stage

✅ Process overview

✅ Before mutation stage

✅ Mutation stage

✅ Layout stage

### Implementation

#### Chapter 5 Diff Algorithm

✅ Overview

✅ Single node Diff

✅ Multi-node Diff

#### Chapter 6 Status Update

✅ Process overview

✅ Mental model

✅ Update

✅ In-depth understanding of priorities

✅ ReactDOM.render

✅ this.setState

#### Chapter 7 Hooks

✅ Hooks concept

✅ Minimalist Hooks implementation

✅ Hooks data structure

✅ useState and useReducer

✅ useEffect

✅ useRef

✅ useMemo and useCallback

#### Chapter 8 Concurrent Mode

✅ Overview

✅ Principle and implementation of Scheduler

✅ lane model

📝 Asynchronous interruptible update

📝 High-quality task interruption mechanism

📝 batchedUpdates

📝 Suspense