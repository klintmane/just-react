After previous studies, we already know that the architecture of `React16` is divided into three layers:

-Scheduler-priority of scheduling tasks, high-quality tasks enter **Reconciler** first
-Reconciler-Responsible for finding the changed components
-Renderer (renderer)-responsible for rendering the changed components to the page

So how is the architecture reflected in the file structure of the source code? Let's take a look.

## Top level directory

Excluding configuration files and hidden folders, there are three folders in the root directory:

```
Root directory
├── fixtures # Contains some small React test projects for contributors
├── packages # Contains metadata (such as package.json) and the source code of all packages in the React warehouse (subdirectory src)
├── scripts # Scripts of various tool chains, such as git, jest, eslint, etc.
```

Here we focus on the **packages** directory

## packages directory

There are many folders in the directory, let's take a look:

### [react](https://github.com/facebook/react/tree/master/packages/react) folder

The core of React, including all global React APIs, such as:

-React.createElement
-React.Component
-React.Children

These APIs are common to all platforms, and they do not contain platform-specific codes such as `ReactDOM` and `ReactNative`. Published on NPM as [a separate package](https://www.npmjs.com/package/react).

### [scheduler](https://github.com/facebook/react/tree/master/packages/scheduler) folder

Implementation of Scheduler (Scheduler).

### [shared](https://github.com/facebook/react/tree/master/packages/shared) folder

**Methods** and **Global variables** common to other modules in the source code, such as in [shared/ReactSymbols.js](https://github.com/facebook/react/blob/1fb18e22ae66fdb1dc127347e169e73948778e5a/packages/shared/ReactSymbols .js) save the definition of the different component types of `React`.

```js
// ...
export let REACT_ELEMENT_TYPE = 0xeac7;
export let REACT_PORTAL_TYPE = 0xeaca;
export let REACT_FRAGMENT_TYPE = 0xeacb;
// ...
```

### Renderer related folders

The following folders are the corresponding **Renderer**

```
-react-art
-react-dom # Note that this is the entrance to both DOM and SSR (server rendering)
-react-native-renderer
-react-noop-renderer # for debug fiber (fiber will be introduced later)
-react-test-renderer
```

### Experimental package folder

`React` extracts part of its own process to form a package that can be used independently. Because they are experimental in nature, they are not recommended to be used in a production environment. Include the following folders:

```
-react-server # Create a custom SSR stream
-react-client # Create a custom stream
-react-fetch # For data request
-react-interactions # Used to test interaction-related internal features, such as React's event model
-react-reconciler # The realization of Reconciler, you can use it to build your own Renderer
```

### Auxiliary package folder

`React` forms some auxiliary functions into a separate package. Include the following folders:

```
-react-is # Used to test whether the component is of a certain type
-react-client # Create a custom stream
-react-fetch # For data request
-react-refresh # The official implementation of "hot reload" in React
```

### [react-reconciler](https://github.com/facebook/react/tree/master/packages/react-reconciler) folder

We need to focus on **react-reconciler**, 80% of the code volume in the next source code learning comes from this package.

Although it is an experimental package, many internal functions have not yet been opened in the official version. But he docked **Scheduler** while docking **Renderer** of different platforms, forming the entire React16 architecture system.