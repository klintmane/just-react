Before diving into the source code, let us first establish the `mental model` of the `update mechanism`.

When explaining the source code in the next two sections, we will associate the code with the `mental model` so that you can better understand it.

## Synchronously updated React

We can compare `update mechanism` to `code version control`.

Before `code version control`, we gradually superimposed functions in the code. Everything looked orderly until we encountered an emergency online bug (red node).

<img :src="$withBase('/img/git1.png')" alt="process1">

In order to fix this bug, we need to submit the previous code first.

In `React`, all applications created by `ReactDOM.render` (for other ways to create applications refer to [ReactDOM.render section](./reactdom.html#react's other entry functions)) are in a similar way `Update status`.

That is, there is no concept of `priority`, and `high-quality update` (red node) needs to be executed after other `updates`.

## React with concurrent updates

When there is `code version control` and there is an urgent online bug that needs to be fixed, we temporarily store the modification of the current branch, fix the bug in the `master branch` and go online urgently.

<img :src="$withBase('/img/git2.png')" alt="process2">

After the bug fix is ​​online, use the `git rebase` command to connect to the `development branch`. `Development branch` Continue development based on `bug-fixed version`.

<img :src="$withBase('/img/git3.png')" alt="process3">

In `React`, applications created by `ReactDOM.createBlockingRoot` and `ReactDOM.createRoot` will use the method of `concurrent` to `update state`.

`High-quality update` (red node) interrupts the ongoing `low-quality update` (blue node), first complete the `render-commit process`.

After the completion of `high-quality update`, `low-quality update` will re-update based on the result of `high-quality update`.

In the next two sections, we will explain how this set of `concurrent updates` is implemented from the perspective of source code.

## Reference

[`Extranet` `English` React Core Team Dan introduces the future development direction of React](https://www.youtube.com/watch?v=v6iR3Zk4oDY)