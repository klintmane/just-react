For a single node, we take the type `object` as an example, and enter `reconcileSingleElement`

> You can see the source code of `reconcileSingleElement` from [here](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react-reconciler/src/ReactChildFiber.new.js#L1141)

```javascript
  const isObject = typeof newChild ==='object' && newChild !== null;

  if (isObject) {
    // Object type, it may be REACT_ELEMENT_TYPE or REACT_PORTAL_TYPE
    switch (newChild.$$typeof) {
      case REACT_ELEMENT_TYPE:
        // call reconcileSingleElement to process
      // ...other case
    }
  }
```
This function will do the following:

<img :src="$withBase('/img/diff.png')" alt="diff">

Let us see how the second step **determine whether the DOM node can be reused** is achieved.

```javascript
function reconcileSingleElement(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  element: ReactElement
): Fiber {
  const key = element.key;
  let child = currentFirstChild;
  
  // First determine whether there is a corresponding DOM node
  while (child !== null) {
    // The DOM node exists in the last update, and then determine whether it can be reused

    // First compare whether the keys are the same
    if (child.key === key) {

      // The key is the same, then compare whether the type is the same

      switch (child.tag) {
        // ... omitted case
        
        default: {
          if (child.elementType === element.type) {
            // The same type means it can be reused
            // Return the reused fiber
            return existing;
          }
          
          // If the type is different, jump out of the switch
          break;
        }
      }
      // The code execution here means: the key is the same but the type is different
      // Mark the fiber and its sibling fiber for deletion
      deleteRemainingChildren(returnFiber, child);
      break;
    } else {
      // If the key is different, mark the fiber for deletion
      deleteChild(returnFiber, child);
    }
    child = child.sibling;
  }

  // Create a new Fiber, and return ... omitted
}
```

Remember what we just mentioned, the preset limitations of React,

It can be seen from the code that React first judges whether the `key` is the same, and if the `key` is the same, it judges whether the `type` is the same. Only when the same is the same, a `DOM node` can be reused.

Here is a detail to pay attention to:

-When `child !== null` and `key is the same` and `type is different`, execute `deleteRemainingChildren` to mark both `child` and its brother `fiber` for deletion.

-When `child !== null` and `keys are different`, only the `child` tag is deleted.

Consider the following example:

There are 3 `li`s on the current page, we want to delete them all, and then insert a `p`.

```js
// Displayed on the current page
ul> li * 3

// need to be updated this time
ul> p
```

Since there is only one `p` in this update, `Diff` belonging to a single node will follow the code logic introduced above.

Traverse the previous 3 `fiber` in `reconcileSingleElement` (the corresponding `DOM` is 3 `li`), and find out whether the updated `p` can reuse one of the previous 3 `fiber` `DOM`.

When `keys are the same` and `types are different`, it means that we have found the last `fiber` corresponding to the updated `p`, but `p` and `li` `type` are different and cannot be reused. Since the only possibility can no longer be reused, the remaining `fiber` has no chance, so all need to be marked for deletion.

When `keys are different`, it only means that the traversed `fiber` cannot be reused by `p`, and there is a brother `fiber` that has not been traversed yet. So just mark the `fiber` for deletion.


## Practice questions
Let us do a few exercises to consolidate it:

Please judge whether the `DOM` element corresponding to the following `JSX object` can be reused:

```jsx
// Exercise 1 before update
<div>ka song</div>
// Updated
<p>ka song</p>

// Exercise 2 before update
<div key="xxx">ka song</div>
// Updated
<div key="ooo">ka song</div>

// Exercise 3 before update
<div key="xxx">ka song</div>
// Updated
<p key="ooo">ka song</p>

// Exercise 4 before update
<div key="xxx">ka song</div>
// Updated
<div key="xxx">xiao bei</div>

```

.

.

.

.

Announce the answer:

Exercise 1: `key prop` is not set by default.`key = null;`, so the key before and after the update is the same, both are `null`, but before the update, the `type` is `div`, after the update, it is `p`, `type` Changes cannot be reused.

Exercise 2: The `key` changes before and after the update, there is no need to judge the `type`, and it cannot be reused.

Exercise 3: The `key` changes before and after the update, there is no need to judge the `type`, and it cannot be reused.

Exercise 4: Before and after the update, both `key` and `type` have not changed and can be reused. `Children` changes, the child elements of `DOM` need to be updated.

Did you get all the answers right?