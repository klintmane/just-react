::: warning This chapter is an optional chapter

Whether to study this chapter has no effect on the study of subsequent chapters.

:::

In the [beginWork section](../process/beginWork.html#reconcilechildren) we mentioned

> For the `update` component, he will compare the current component with the corresponding Fiber node of the component when it was last updated (also known as the Diff algorithm), and generate a new Fiber node from the result of the comparison.

In this chapter we explain the implementation of `Diff Algorithm`.

> You can see the introduction of `Diff algorithm` from [here](https://zh-hans.reactjs.org/docs/reconciliation.html#the-diffing-algorithm).

::: warning In order to prevent the concept from being confused, I will emphasize it again here

A `DOM node` can have up to 4 nodes related to it at a certain time.

1. `current Fiber`. If the `DOM node` is already in the page, `current Fiber` represents the `Fiber node` corresponding to the `DOM node`.

2. `workInProgress Fiber`. If the `DOM node` will be rendered to the page in this update, `workInProgress Fiber` represents the `Fiber node` corresponding to the `DOM node`.

3. The `DOM node` itself.

4. `JSX Object`. That is, the return result of the `render` method of `ClassComponent`, or the call result of `FunctionComponent`. The `JSX object` contains information describing the `DOM node`.

The essence of the `Diff algorithm` is to compare 1 and 4 to generate 2.

:::


## The bottleneck of Diff and how React responds

Since the `Diff` operation itself will also bring performance loss, the React document mentions that even in the most cutting-edge algorithm, the complexity of the algorithm that completely compares the two trees before and after is O(n 3 ), where `n `Is the number of elements in the tree.

If this algorithm is used in `React`, the amount of calculation required to display 1000 elements will be in the order of billions. This overhead is too high.

In order to reduce the complexity of the algorithm, the `diff` of `React` will preset three restrictions:

1. Only perform `Diff` on the same level elements. If a `DOM node` crosses the hierarchy in two updates, then `React` will not try to reuse it.

2. Two different types of elements will produce different trees. If the element changes from `div` to `p`, React will destroy `div` and its descendants, and create new `p` and its descendants.

3. Developers can use `key prop` to hint which child elements can remain stable under different renderings. Consider the following example:

```jsx
// Before update
<div>
  <p key="ka">ka</p>
  <h3 key="song">song</h3>
</div>

// Updated
<div>
  <h3 key="song">song</h3>
  <p key="ka">ka</p>
</div>

```
If there is no `key`, `React` will think that the first child node of `div` changes from `p` to `h3`, and the second child node changes from `h3` to `p`. This complies with the setting of Limit 2 and will be destroyed and newly created.

But when we use `key` to indicate the correspondence between the nodes before and after, `React` knows that the `p` of `key === "ka"` still exists after the update, so the `DOM node` can be reused, but it needs to be exchanged The next order.

These are the three restrictions made by React in order to cope with the algorithm performance bottleneck.

## How Diff is implemented

We start from the entry function `reconcileChildFibers` of `Diff`, which will call different processing functions according to the type of `newChild` (ie, `JSX object`).

> You can see the source code of `reconcileChildFibers` from [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactChildFiber.new.js#L1280).

```js
// Choose different diff function processing according to newChild type
function reconcileChildFibers(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChild: any,
): Fiber | null {

  const isObject = typeof newChild ==='object' && newChild !== null;

  if (isObject) {
    // object type, may be REACT_ELEMENT_TYPE or REACT_PORTAL_TYPE
    switch (newChild.$$typeof) {
      case REACT_ELEMENT_TYPE:
        // call reconcileSingleElement to process
      // // ... omit other cases
    }
  }

  if (typeof newChild ==='string' || typeof newChild ==='number') {
    // call reconcileSingleTextNode to process
    // ... omitted
  }

  if (isArray(newChild)) {
    // call reconcileChildrenArray to process
    // ... omitted
  }

  // Some other situations call the processing function
  // ... omitted

  // None of the above hits, delete the node
  return deleteRemainingChildren(returnFiber, currentFirstChild);
}
```

We can divide Diff into two categories from the number of nodes at the same level:

1. When the `newChild` type is `object`, `number`, `string`, it means there is only one node at the same level

2. When the type of `newChild` is `Array`, there are multiple nodes at the same level

In the next two sections we will discuss the `Diff` of these two types of nodes respectively.