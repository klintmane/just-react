In the previous section we introduced `Diff` with a single node, now consider that we have a `FunctionComponent`:

```jsx
function List () {
  return (
    <ul>
      <li key="0">0</li>
      <li key="1">1</li>
      <li key="2">2</li>
      <li key="3">3</li>
    </ul>
  )
}
```
The `children` property of his return value `JSX object` is not a single node, but an array containing four objects

```js
{
  $$typeof: Symbol(react.element),
  key: null,
  props: {
    children: [
      {$$typeof: Symbol(react.element), type: "li", key: "0", ref: null, props: {…}, …}
      {$$typeof: Symbol(react.element), type: "li", key: "1", ref: null, props: {…}, …}
      {$$typeof: Symbol(react.element), type: "li", key: "2", ref: null, props: {…}, …}
      {$$typeof: Symbol(react.element), type: "li", key: "3", ref: null, props: {…}, …}
    ]
  },
  ref: null,
  type: "ul"
}
```

In this case, the parameter type of `newChild` of `reconcileChildFibers` is `Array`, which corresponds to the following situations in the `reconcileChildFibers` function:

> You can see this source logic in [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactChildFiber.new.js#L1352)

```js
  if (isArray(newChild)) {
    // call reconcileChildrenArray to process
    // ... omitted
  }
```

In this section, let's take a look at how to deal with `Diff` of multiple nodes at the same level.

## Overview

First, summarize the situation we need to deal with:

We use **before** to represent the `JSX object` before the update, and **after** to represent the `JSX object` after the update

### Case 1: Node update

```jsx
// Before
<ul>
  <li key="0" className="before">0<li>
  <li key="1">1<li>
</ul>

// After case 1-node attribute changes
<ul>
  <li key="0" className="after">0<li>
  <li key="1">1<li>
</ul>

// After case 2-node type update
<ul>
  <div key="0">0</div>
  <li key="1">1<li>
</ul>
```

### Case 2: New or reduced nodes

```jsx
// Before
<ul>
  <li key="0">0<li>
  <li key="1">1<li>
</ul>

// After case 1-new node
<ul>
  <li key="0">0<li>
  <li key="1">1<li>
  <li key="2">2<li>
</ul>

// After case 2-delete node
<ul>
  <li key="1">1<li>
</ul>
```

### Case 3: Node location changes

```jsx
// Before
<ul>
  <li key="0">0<li>
  <li key="1">1<li>
</ul>

// after
<ul>
  <li key="1">1<li>
  <li key="0">0<li>
</ul>
```

The `Diff` of multiple nodes at the same level must belong to one or more of the above three situations.

## Diff's ideas

How to design an algorithm? If I were to design a `Diff algorithm`, the first solution I thought of was:

1. Determine what kind of situation the current node update belongs to
2. If it is `new`, execute the new logic
3. If it is `Delete`, execute the delete logic
4. If it is `update`, execute the update logic

According to this scheme, there is actually an implicit premise-**The priority of different operations is the same**

However, the `React team` found that in daily development, compared to `add` and `delete`, `update` components occur more frequently. So `Diff` will prioritize whether the current node belongs to `update`.

::: warning note
When we do array-related arithmetic problems, we often use **double pointer** to traverse from the beginning and the end of the array at the same time to improve efficiency, but this is not the case.

Although the updated `JSX object` `newChildren` is in the form of an array, the comparison with each component in `newChildren` is `current fiber`, and the `Fiber node` at the same level is formed by the `sibling` pointer link Single linked list, that is, does not support double pointer traversal.

That is, `newChildren[0]` is compared with `fiber`, and `newChildren[1]` is compared with `fiber.sibling`.

So it is not possible to use **dual pointer** optimization.
:::

For the above reasons, the overall logic of the `Diff algorithm` will go through two rounds of traversal:

The first round of traversal: processing the nodes of `update`.

The second round of traversal: processing the remaining nodes that are not part of `update`.

## The first round of traversal

The first round of traversal steps are as follows:

1. `let i = 0`, traverse `newChildren`, compare `newChildren[i]` with `oldFiber`, and judge whether the `DOM node` is reusable.

2. If it can be reused, `i++`, continue to compare `newChildren[i]` and `oldFiber.sibling`, and continue to traverse if it can be reused.

3. If it is not reusable, there are two cases:

-The `key` is different and cannot be reused. The entire traversal is immediately jumped out, and the first round of traversal ends. **

-`key` is the same and `type` is different and cannot be reused, and `oldFiber` will be marked as `DELETION`, and the traversal will continue

4. If `newChildren` is traversed (ie `i === newChildren.length-1`) or `oldFiber` is traversed (ie `oldFiber.sibling === null`), jump out of the traversal, ** the first round of traversal Finish. **

> You can see the source code of this round of traversal from [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactChildFiber.new.js#L818)

When the traversal is over, there will be two results:

### Step 3 out of the traversal

At this time, `newChildren` has not completed the traversal, and `oldFiber` has not completed the traversal.

For example, consider the following code:

```jsx
// Before
<li key="0">0</li>
<li key="1">1</li>
<li key="2">2</li>
            
// after
<li key="0">0</li>
<li key="2">1</li>
<li key="1">2</li>
```

The first node can be reused, and the node that traverses to `key === 2` finds that the `key` has changed and is not reusable. It jumps out of the traversal and waits for the second round of traversal processing.

At this time, `oldFiber` is left with `key === 1` and `key === 2` not traversed, and `newChildren` is left with `key === 2` and `key === 1` not traversed.


### Step 4 out of the traversal

It is possible that `newChildren` has been traversed, or `oldFiber` has been traversed, or they have been traversed at the same time.

For example, consider the following code:

```jsx
// Before
<li key="0" className="a">0</li>
<li key="1" className="b">1</li>
            
// After that, case 1-both newChildren and oldFiber are traversed
<li key="0" className="aa">0</li>
<li key="1" className="bb">1</li>
            
// After that, case 2-newChildren has not been traversed, oldFiber has been traversed
// newChildren left key==="2" not traversed
<li key="0" className="aa">0</li>
<li key="1" className="bb">1</li>
<li key="2" className="cc">2</li>
            
// After the case 3-newChildren is traversed, oldFiber is not traversed
// oldFiber left key==="1" not traversed
<li key="0" className="aa">0</li>
```

With the results of the first round of traversal, we start the second round of traversal.

## Second round of traversal

For the results of the first round of traversal, we discuss separately:

### `newChildren` and `oldFiber` are traversed at the same time

That is the ideal situation: you only need to perform the component [`update`](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactChildFiber.new. js#L825). At this point `Diff` is over.

### `newChildren` is not traversed, `oldFiber` is traversed

The existing `DOM nodes` are all reused. At this time, there are newly added nodes, which means that there are new nodes inserted in this update. We only need to traverse the remaining `newChildren` to mark the generated `workInProgress fiber` in turn `Placement`.

> You can see this source logic in [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactChildFiber.new.js#L869)

### `newChildren` is traversed, `oldFiber` is not traversed

It means that the number of nodes in this update is less than the previous ones, and some nodes have been deleted. So it is necessary to traverse the remaining `oldFiber` and mark `Deletion` in turn.

> You can see this source logic in [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactChildFiber.new.js#L863)

### `newChildren` and `oldFiber` have not been traversed

This means that a node has changed position in this update.

This is the essence and the most difficult part of the `Diff algorithm`. We will focus on it next.

> You can see this source logic in [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactChildFiber.new.js#L893)

## Handling moving nodes

Since some nodes have changed their positions, the position index `i` can no longer be used to compare the nodes before and after. So how can the same node be matched in two updates?

We need to use `key`.

In order to quickly find the `oldFiber` corresponding to the `key`, we save all the unprocessed `oldFiber` into the `Map` with `key` as the key and `oldFiber` as the value.

```javascript
const existingChildren = mapRemainingChildren(returnFiber, oldFiber);
```

> You can see this source logic in [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactChildFiber.new.js#L890)

Next, traverse the remaining `newChildren` and find the `oldFiber` with the same `key` in `existingChildren` through `newChildren[i].key`.

## Mark whether the node is moving

Since our goal is to find moving nodes, we need to be clear: Is the node moving based on what is the reference?

Our reference is: the position index of the last reusable node in `oldFiber` (represented by the variable `lastPlacedIndex`).

Because the nodes in this update are arranged in the order of `newChildren`. In the process of traversing `newChildren`, each reusable node` to be traversed must be the **most rightmost** among all reusable nodes` currently traversed, that is, it must correspond to `lastPlacedIndex` The `reusable node` is behind the position in this update.

Then we only need to compare whether the reusable nodes that are traversed are also behind the oldFiber corresponding to the lastPlacedIndex in the last update, and then we can know whether the relative positions of the two nodes have changed in the two updates.

We use the variable `oldIndex` to represent the position index of the reusable node that is traversed in `oldFiber`. If `oldIndex <lastPlacedIndex`, it means that the node needs to be moved to the right this time.

`lastPlacedIndex` is initially `0`, and each reusable node is traversed, if `oldIndex >= lastPlacedIndex`, then `lastPlacedIndex = oldIndex`.

Simple text is more obscure, here we provide two demos, you can compare and understand.

## Demo1

In the Demo, we simplify the writing, each letter represents a node, and the value of the letter represents the key of the node.
```jsx

// Before
abcd

// after
acdb

===The first round of traversal begins===
a (after) vs a (before)
The key is unchanged and can be reused
At this time, the oldFiber (previous a) corresponding to a is indexed as 0 in the previous array (abcd)
So lastPlacedIndex = 0;

Continue the first round of traversal...

c (after) vs b (before)
Key changes, cannot be reused, jump out of the first round of traversal
At this time lastPlacedIndex === 0;
===End of the first round of traversal===

===Beginning of the second round of traversal ===
newChildren === cdb, not used up, no need to delete old nodes
oldFiber === bcd, not used up, no need to perform inserting new nodes

Save the remaining oldFiber (bcd) as a map

// current oldFiber: bcd
// current newChildren: cdb

Continue to traverse the remaining newChildren

key === c exists in oldFiber
const oldIndex = c (before).index;
At this time oldIndex === 2; // The previous node was abcd, so c.index === 2
Compare oldIndex with lastPlacedIndex;

If oldIndex >= lastPlacedIndex, it means that the reusable node does not need to be moved
And put lastPlacedIndex = oldIndex;
If oldIndex <lastplacedIndex, the previously inserted position index of the reusable node is less than the position index that needs to be inserted in this update, which means that the node needs to move to the right

In the example, oldIndex 2> lastPlacedIndex 0,
Then lastPlacedIndex = 2;
c-node position remains unchanged

Continue to traverse the remaining newChildren

// current oldFiber: bd
// current newChildren: db

key === d exists in oldFiber
const oldIndex = d (before).index;
oldIndex 3> lastPlacedIndex 2 // The previous node was abcd, so d.index === 3
Then lastPlacedIndex = 3;
d node position remains unchanged

Continue to traverse the remaining newChildren

// current oldFiber: b
// current newChildren: b

key === b exists in oldFiber
const oldIndex = b (before).index;
oldIndex 1 <lastPlacedIndex 3 // The previous node was abcd, so b.index === 1
Then the b node needs to move to the right
===End of second round of traversal===

In the end, none of the acd 3 nodes moved, and the b node was marked as mobile

```

## Demo2

```jsx
// Before
abcd

// after
dabc

===The first round of traversal begins===
d (after) vs a (before)
Key changes, cannot be reused, jump out of traversal
===End of the first round of traversal===

===Beginning of the second round of traversal ===
newChildren === dabc, not used up, no need to delete old nodes
oldFiber === abcd, not used up, no need to perform inserting new nodes

Save the remaining oldFiber (abcd) as a map

Continue to traverse the remaining newChildren

// current oldFiber: abcd
// current newChildren dabc

key === d exists in oldFiber
const oldIndex = d (before).index;
At this time oldIndex === 3; // The previous node was abcd, so d.index === 3
Compare oldIndex with lastPlacedIndex;
oldIndex 3> lastPlacedIndex 0
Then lastPlacedIndex = 3;
d node position remains unchanged

Continue to traverse the remaining newChildren

// current oldFiber: abc
// current newChildren abc

key === a exists in oldFiber
const oldIndex = a (before).index; // The previous node was abcd, so a.index === 0
At this time oldIndex === 0;
Compare oldIndex with lastPlacedIndex;
oldIndex 0 <lastPlacedIndex 3
Then a node needs to move to the right

Continue to traverse the remaining newChildren

// current oldFiber: bc
// current newChildren bc

key === b exists in oldFiber
const oldIndex = b (before).index; // The previous node was abcd, so b.index === 1
At this time oldIndex === 1;
Compare oldIndex with lastPlacedIndex;
oldIndex 1 <lastPlacedIndex 3
Then the b node needs to move to the right

Continue to traverse the remaining newChildren

// current oldFiber: c
// current newChildren c

key === c exists in oldFiber
const oldIndex = c (before).index; // The previous node was abcd, so c.index === 2
At this time oldIndex === 2;
Compare oldIndex with lastPlacedIndex;
oldIndex 2 <lastPlacedIndex 3
Then the c node needs to move to the right

===End of second round of traversal===

```

As you can see, we think that to change from `abcd` to `dabc`, we only need to move `d` to the front.

But in fact, React keeps `d` unchanged, and moves `abc` to the back of `d`.

It can be seen from this point that considering performance, we should minimize the operation of moving nodes from the back to the front.