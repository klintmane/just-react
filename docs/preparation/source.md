Knowing the file directory of the source code, in this section we look at how to debug the source code.

Even though the version number is the same (the current latest version is `17.0.0 RC`), the code of the `master` branch of the `facebook/react` project is the same as the `react` under the project `node_modules` that we created with `create-react-app` `The project code is still somewhat different.

Because the new code of `React` is directly submitted to the `master` branch, and the `react` in `create-react-app` uses the stable version of the package.

In order to always use the latest version of `React` for teaching, we debug the source code and follow the steps below:

1. Pull the latest source code from the `master` branch of the `facebook/react` project
2. Build three packages of `react`, `scheduler`, and `react-dom` based on the latest source code
3. Create a test project by `create-react-app`, and use the package created in step 2 as the package that the project depends on

## Pull the source code

Pull the `facebook/react` code

```sh
# Pull code
git clone https://github.com/facebook/react.git

# If the pull speed is very slow, you can consider the following 2 solutions:

# 1. Use cnpm proxy
git clone https://github.com.cnpmjs.org/facebook/react

# 2. Use code cloud mirroring (synchronize with react once a day)
git clone https://gitee.com/mirrors/react.git

```

Installation dependencies

```sh
# Cut into the folder where the react source code is located
cd react

# Installation dependencies
yarn
```

The three packages `react`, `scheduler`, and `react-dom` are packaged as `cjs` packages that can be used in the dev environment.

> Our steps only contain specific methods. For a more detailed introduction to each step, please refer to the `React` document [Source code contribution chapter](https://zh-hans.reactjs.org/docs/how-to-contribute.html# development-workflow)

```sh

# Execute packaging commands
yarn build react/index,react/jsx,react-dom/index,scheduler --type=NODE


```

:::details Check here for students with bad internet

If the network is not good, the dependency installation cannot be completed by executing the `yarn` command, or the packaging cannot be completed by executing the `yarn build`, you can use the package I prepared.

The version is `17.0.0-alpha.0`

[Address](https://gitee.com/kasong/react)

:::

Now the package with the latest code will be generated under the source directory `build/node_modules`. We create `yarn link` for `react` and `react-dom`.

> Through `yarn link`, you can change the directory point of the dependent package in the project
```sh
cd build/node_modules/react
# Declare that react points to
yarn link
cd build/node_modules/react-dom
# Declare that react-dom points to
yarn link
```

## Create project

Next, we create new projects elsewhere via `create-react-app`. Here we name it arbitrarily, such as "a-react-demo".

```sh
npx create-react-app a-react-demo
```

In the new project, point the two packages of `react` and `react-dom` to the package we just generated under `facebook/react`.

```sh
# Point react react-dom in the project to the previously declared package
yarn link react react-dom
```

Now try to print something in `react/build/node_modules/react-dom/cjs/react-dom.development.js`.

Execute `yarn start` under the `a-react-demo` project. Now the browser console can print out what we entered.


Through the above method, our runtime code is consistent with the latest code of `React`.