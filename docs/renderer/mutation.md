Finally came the `mutation stage` to perform `DOM` operations.

## Overview

Similar to the `before mutation phase`, the `mutation phase` also traverses the `effectList` and executes functions. The implementation here is `commitMutationEffects`.

```js
nextEffect = firstEffect;
do {
  try {
      commitMutationEffects(root, renderPriorityLevel);
    } catch (error) {
      invariant(nextEffect !== null,'Should be working on an effect.');
      captureCommitPhaseError(nextEffect, error);
      nextEffect = nextEffect.nextEffect;
    }
} while (nextEffect !== null);
```

## commitMutationEffects

code show as below:

> You can see the source code of `commitMutationEffects` in [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactFiberWorkLoop.old.js#L2091)

```js
function commitMutationEffects(root: FiberRoot, renderPriorityLevel) {
  // Traverse the effectList
  while (nextEffect !== null) {

    const effectTag = nextEffect.effectTag;

    // Reset the text node according to ContentReset effectTag
    if (effectTag & ContentReset) {
      commitResetTextContent(nextEffect);
    }

    // update ref
    if (effectTag & Ref) {
      const current = nextEffect.alternate;
      if (current !== null) {
        commitDetachRef(current);
      }
    }

    // Process separately according to effectTag
    const primaryEffectTag =
      effectTag & (Placement | Update | Deletion | Hydrating);
    switch (primaryEffectTag) {
      // Insert DOM
      case Placement: {
        commitPlacement(nextEffect);
        nextEffect.effectTag &= ~Placement;
        break;
      }
      // Insert DOM and update DOM
      case PlacementAndUpdate: {
        // insert
        commitPlacement(nextEffect);

        nextEffect.effectTag &= ~Placement;

        // renew
        const current = nextEffect.alternate;
        commitWork(current, nextEffect);
        break;
      }
      // SSR
      case Hydrating: {
        nextEffect.effectTag &= ~Hydrating;
        break;
      }
      // SSR
      case HydratingAndUpdate: {
        nextEffect.effectTag &= ~Hydrating;

        const current = nextEffect.alternate;
        commitWork(current, nextEffect);
        break;
      }
      // Update the DOM
      case Update: {
        const current = nextEffect.alternate;
        commitWork(current, nextEffect);
        break;
      }
      // delete DOM
      case Deletion: {
        commitDeletion(root, nextEffect, renderPriorityLevel);
        break;
      }
    }

    nextEffect = nextEffect.nextEffect;
  }
}
```

`commitMutationEffects` will traverse the `effectList` and perform the following three operations on each `Fiber node`:

1. Reset the text node according to `ContentReset effectTag`
2. Update `ref`
3. Separate processing according to `effectTag`, where `effectTag` includes (`Placement` | `Update` | `Deletion` | `Hydrating`)

We focus on `Placement` | `Update` | `Deletion` in step 3. `Hydrating` is related to server-side rendering, so let's not pay attention to it.

## Placement effect

When the `Fiber node` contains `Placement effectTag`, it means that the `DOM node` corresponding to the `Fiber node` needs to be inserted into the page.

The method called is `commitPlacement`.

> You can see the source code of `commitPlacement` in [here](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactFiberCommitWork.new.js#L1156)

The work done by this method is divided into three steps:

1. Get the parent `DOM node`. Among them, `finishedWork` is the incoming `Fiber node`.

```js
const parentFiber = getHostParentFiber(finishedWork);
// Parent DOM node
const parentStateNode = parentFiber.stateNode;
```

2. Get the `DOM` sibling node of `Fiber node`

```js
const before = getHostSibling(finishedWork);
```

3. According to whether the `DOM` sibling node exists, it is decided to call `parentNode.insertBefore` or `parentNode.appendChild` to perform the `DOM` insertion operation.

```js
// Is parentStateNode rootFiber
if (isContainer) {
  insertOrAppendPlacementNodeIntoContainer(finishedWork, before, parent);
} else {
  insertOrAppendPlacementNode(finishedWork, before, parent);
}
```

It is worth noting that the execution of `getHostSibling` (get sibling `DOM node`) is time-consuming. When multiple insertion operations are performed in sequence under the same parent `Fiber node`, the complexity of the `getHostSibling` algorithm is exponential.

This is because the `Fiber node` does not only include the `HostComponent`, so the `Fiber tree` and the rendered `DOM tree` node are not one-to-one correspondence. To find the `DOM node` from the `Fiber node`, it is possible to traverse across levels.

Consider the following example:

```jsx

function Item() {
  return <li><li>;
}

function App() {
  return (
    <div>
      <Item/>
    </div>
  )
}

ReactDOM.render(<App/>, document.getElementById('root'));
```

The corresponding `Fiber tree` and `DOM tree` structures are:

```js
// Fiber tree
          child child child child
rootFiber -----> App -----> div -----> Item -----> li

// DOM tree
#root ---> div ---> li
```

When inserting a new node `p` before the child node `Item` of `div`, that is, `App` becomes:

```jsx
function App() {
  return (
    <div>
      <p></p>
      <Item/>
    </div>
  )
}
```

The corresponding `Fiber tree` and `DOM tree` structures are:

```js
// Fiber tree
          child child child
rootFiber -----> App -----> div -----> p
                                       | sibling child
                                       | -------> Item -----> li
// DOM tree
#root ---> div ---> p
             |
               ---> li
```

At this time, the sibling node of `DOM node` `p` is `li`, and the sibling `DOM node` corresponding to `Fiber node` `p` is:

```js
fiberP.sibling.child
```
That is, the `brother fiber` of `fiber p`, the `child fiber` of `Item`, `li`

## Update effect

When the `Fiber node` contains `Update effectTag`, it means that the `Fiber node` needs to be updated. The method called is `commitWork`, which will be processed separately according to `Fiber.tag`.

> You can see the source code of `commitWork` in [here](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactFiberCommitWork.new.js#L1441)

Here we mainly focus on `FunctionComponent` and `HostComponent`.

### FunctionComponent mutation

When `fiber.tag` is `FunctionComponent`, `commitHookEffectListUnmount` will be called. This method will traverse the `effectList` and execute all the destruction functions of the `useLayoutEffect hook`.

> You can see the source code of `commitHookEffectListUnmount` in [here](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactFiberCommitWork.new.js#L314)

The so-called "destroy function", see the following example:

```js
useLayoutEffect(() => {
  // ...some side-effect logic

  return () => {
    // ...this is the destruction function
  }
})
```

You don't need to know much about `useLayoutEffect`, we will introduce it in detail in the next section. You just need to know that the destruction function of `useLayoutEffect` will be executed in the `mutation phase`.

### HostComponent mutation

When `fiber.tag` is `HostComponent`, `commitUpdate` will be called.

> You can see the source code of `commitUpdate` in [here](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-dom/src/client/ReactDOMHostConfig.js#L423)

Eventually it will be [`render phase completeWork`] in [`updateDOMProperties`](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-dom/src/client/ReactDOMComponent.js#L378) (https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactFiberCompleteWork.new.js#L229) The content corresponding to the `updateQueue` assigned to the `Fiber node` is rendered on the page superior.

```js
for (let i = 0; i <updatePayload.length; i += 2) {
  const propKey = updatePayload[i];
  const propValue = updatePayload[i + 1];

  // handle style
  if (propKey === STYLE) {
    setValueForStyles(domElement, propValue);
  // Process DANGEROUSLY_SET_INNER_HTML
  } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
    setInnerHTML(domElement, propValue);
  // handle children
  } else if (propKey === CHILDREN) {
    setTextContent(domElement, propValue);
  } else {
  // Process remaining props
    setValueForProperty(domElement, propKey, propValue, isCustomComponentTag);
  }
}
```

## Deletion effect

When the `Fiber node` contains `Deletion effectTag`, it means that the `DOM node` corresponding to the `Fiber node` needs to be deleted from the page. The method called is `commitDeletion`.

> You can see the source code of `commitDeletion` in [here](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/react-reconciler/src/ReactFiberCommitWork.new.js#L1421)

This method will perform the following operations:

1. Recursively call `Fiber node` and its descendants `Fiber node`, `fiber.tag` is [`componentWillUnmount`](https://github.com/facebook/react/blob/970fa122d8188bafa600e9b5214833487fbf1092/packages/ react-reconciler/src/ReactFiberCommitWork.new.js#L920) life cycle hook, remove the `Fiber node` from the page corresponding to the `DOM node`
2. Unbind `ref`
3. Scheduling the destruction function of `useEffect`

## Summarize

We learned from this section that the `mutation phase` will traverse the `effectList` and execute the `commitMutationEffects` in turn. The main work of this method is "call different processing functions to process `Fiber` according to `effectTag`.