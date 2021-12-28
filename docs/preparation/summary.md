Through the study of this chapter, we have understood the `Scheduler-Reconciler-Renderer` architecture system of `React`. Before ending this chapter, I would like to introduce a few terms in the source code:

-The stage in which the `Reconciler` works is called the `render` stage. Because at this stage, the `render` method of the component will be called.
-The stage in which the `Renderer` works is called the `commit` stage. Just like you execute `git commit` to submit the code after completing a required coding. The `commit` stage will render the information submitted by the `render` stage on the page.
-The `render` and `commit` phases are collectively referred to as `work`, that is, `React` is at work. Correspondingly, if the task is being scheduled in `Scheduler`, it does not belong to `work`.

In the `architecture chapter`, we will separately explain the workflow of `Reconciler` and `Renderer`, so the chapter names are `render phase` and `commit phase` respectively.