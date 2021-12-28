As a data structure describing the content of components, `JSX` gives JS more visual expressiveness. We use it a lot in `React`. Before diving into the source code, there are some questions we need to solve first:

-Is `JSX` and `Fiber node` the same thing?
-Are `React Component` and `React Element` the same thing? What is their relationship with `JSX`?

With these questions, let us start this section of learning.

## Introduction to JSX
I believe that as a user of `React`, you have already been exposed to `JSX`. If you don’t know him yet, you can read [Description of it on the official website](https://react.docschina.org/docs/introducing-jsx.html).

`JSX` will be compiled into `React.createElement` method by `Babel` at compile time.

::: details JSX compilation

[Follow the public account](../me.html), backstage reply **712** to get the online Demo address
:::

This is why you must explicitly declare in every JS file that uses `JSX`
```js
import React from'react';
```
Otherwise, an error of `undefined variable React` will be reported in the module at runtime.

::: warning note

In React 17, it is no longer necessary to explicitly import React. For details, see [Introducing the new JSX transformation](https://zh-hans.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html)
:::

`JSX` is not only compiled into `React.createElement` method, you can pass [@babel/plugin-transform-react-jsx](https://babeljs.io/docs/en/babel-plugin-transform -react-jsx) The plugin explicitly tells `Babel` what function call needs to be compiled with `JSX` when compiling (the default is `React.createElement`).

For example, in the class `React` library [preact](https://github.com/preactjs/preact), `JSX` will be compiled into a function call called `h`.
```jsx
// Before compilation
<p>KaSong</p>
// after compilation
h("p", null, "KaSong");
```

## [React.createElement](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react/src/ReactElement.js#L348)

Now that `JSX` will be compiled to `React.createElement`, let's see what he did:

```js
export function createElement(type, config, children) {
  let propName;

  const props = {};

  let key = null;
  let ref = null;
  let self = null;
  let source = null;

  if (config != null) {
    // Assign value to props after processing config
    // ... omitted
  }

  const childrenLength = arguments.length-2;
  // Processing children, will be assigned to props.children
  // ... omitted

  // handle defaultProps
  // ... omitted

  return ReactElement(
    type,
    key,
    ref,
    self,
    source,
    ReactCurrentOwner.current,
    props,
  );
}

const ReactElement = function(type, key, ref, self, source, owner, props) {
  const element = {
    // mark this as a React Element
    $$typeof: REACT_ELEMENT_TYPE,

    type: type,
    key: key,
    ref: ref,
    props: props,
    _owner: owner,
  };

  return element;
};
```

We can see that `React.createElement` will eventually call the `ReactElement` method to return an object containing component data. The object has a parameter `$$typeof: REACT_ELEMENT_TYPE` that marks the object as a `React Element`.

So the object returned by calling `React.createElement` is `React Element`?

`React` provides a global API [React.isValidElement](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/react/src/ReactElement.js#L547) to verify the legal `React Element`, we Look at his realization:

```js
export function isValidElement(object) {
  return (
    typeof object ==='object' &&
    object !== null &&
    object.$$typeof === REACT_ELEMENT_TYPE
  );
}
```

As you can see, the non-null object of `$$typeof === REACT_ELEMENT_TYPE` is a valid `React Element`. In other words, in `React`, all the results returned by `JSX` at runtime (that is, the return value of `React.createElement()`) are `React Element`.

So what is the relationship between `JSX` and `React Component`?

## React Component

In `React`, we often use `ClassComponent` and `FunctionComponent` to build components.

```jsx
class AppClass extends React.Component {
  render() {
    return <p>KaSong</p>
  }
}
console.log('This is ClassComponent:', AppClass);
console.log('This is Element:', <AppClass/>);


function AppFunc() {
  return <p>KaSong</p>;
}
console.log('This is FunctionComponent:', AppFunc);
console.log('This is Element:', <AppFunc/>);
```

::: details React Component Category Demo
[Follow the public account](../me.html), backstage reply **901** to get the online Demo address
:::

We can see from the object printed in the Demo console that the `type` field of `Element` corresponding to `ClassComponent` is `AppClass` itself.

The `type` field of `Element` corresponding to `FunctionComponent` is `AppFunc` itself, as shown below:

```js
{
  $$typeof: Symbol(react.element),
  key: null,
  props: {},
  ref: null,
  type: ƒ AppFunc(),
  _owner: null,
  _store: {validated: false},
  _self: null,
  _source: null
}
```

It’s worth noting that because

```js
AppClass instanceof Function === true;
AppFunc instanceof Function === true;
```

So it is impossible to distinguish `ClassComponent` and `FunctionComponent` by reference type. `React` judges whether it is `ClassComponent` through the `isReactComponent` variable on the prototype of the `ClassComponent` instance.

```js
ClassComponent.prototype.isReactComponent = {};
```

## JSX and Fiber Node

From the above content, we can find that `JSX` is a data structure that describes the content of the current component. It does not contain the relevant information required by the components **schedule**, **reconcile**, and **render**.

For example, the following information is not included in `JSX`:

-`Priority` of the component in the update
-The `state` of the component
-The component is marked with a `mark` for **Renderer**

These contents are contained in the `Fiber node`.

Therefore, when the component is `mount`, the `Reconciler` generates the `Fiber node` corresponding to the component according to the content of the component described by the `JSX`.

During `update`, `Reconciler` compares the data saved by `JSX` and `Fiber node`, generates a `Fiber node` corresponding to the component, and marks the `Fiber node` with a `mark` according to the comparison result.

## Reference

-[How to get rid of all the DIVs in Zhihu - Modify `React.createElement` at runtime through this article to achieve the effect of eliminating all `div` elements on the page](https://mp.weixin.qq.com/s/ ICjOlJL-fUGRb2S_xqBT7Q)

-[React official website Blog, Introduction to React Component, Element, Instance, Reconciliation](https://reactjs.org/blog/2015/12/18/react-components-elements-and-instances.html)