@doop/deepstream
================
[Deepstream.io](https://deepstream.io) adapter for [Doop](https://github.com/MomsFriendlyDevCo/Doop).


Features vs. Vanilla Deepstream:

* Entirely promise based - no weird callbacks that DS seems to prefer for _some_ methods
* Minimal `get()` / `set()` implementations which try to avoid subscribing to Deepstream to fetch data when possible
* Names are dropped entirely to use paths which can be in `dotted.notation`, `slash/notation` or `['array', 'format']`
* Distinction from record names and subkeys via At notation - e.g. `this/is/a/record@this/is/a/subkey`
* Array format paths are automatically escaped if any member contains a splitter character (dots or slashes)


Backend
=======
See [config.js](./config.js) for example config to merge.

The module will be detected and loaded automatically with the server as `app.deepstream`.


Frontend
========
The `vm.$deepstream` service should be loaded by default.

```javascript
app.component({
	data() { return {
		doc: {},
	}},
	watch: {
		doc: {
			deep: true,
			handler() {
				this.$debug('SET', this.doc);
				this.$deepstream.set(this.doc);
			},
		},
	},
	created() {
		this.$debug.enable(true);
		this.record = this.$deepstream.get('debug/deepstream');
		this.record.subscribe(values => {
			this.$debug('GET', this.doc);
			this.doc = values;
		});
	},
});
```


API
===

client
------
The actual DeepstreamClient instance.


options
-------
General options for the Deepstram wrapper.

Options are:

| Option           | Type       | Default  | Description                              |
|------------------|------------|----------|------------------------------------------|
| `pathAtNotation` | `boolean`  | `true`   | Support At notation when splitting paths |
| `pathSplitSlash` | `boolean`  | `true`   | Support path seperators with slashes     |
| `pathSplitDot`   | `boolean`  | `false`  | Support path seperators with dots        |
| `split`          | `function` | See code | Path spliter function                    |


pathCache
---------
An object containing all loaded records.


isReady
-------
Boolean indicating if the module has loaded, connected and authenticated.


connect(url, auth?)
-------------------
Async function which establishes a connection with an optional `auth` object.


getRecord(path)
---------------
Fetch (+cache) a DeepstreamRecord instance for a given path.


splitPath(path)
---------------
Internal function used to seperate a regular path into component deepstream `docName` + `docPath` specs, used by some DS functions.
This function supports `dotted.notation`, `slash/notation` and `['array', 'notation']`. Array members are sanitised and is the recommended method to specifiy a path.


get(path, fallback?)
--------------------
Async function to fetch a given, nested path.
See `splitPath()` for valid path specifications.
If the record doesn't exist the fallback is used instead of throwing.


has(path)
---------
Async function which will return a boolean if the path exists.


set(path, value)
----------------
Async function to set a given, nested path.
See `splitPath()` for valid path specifications.


merge(path, values)
-------------------
Convenience async function to merge the given `values` object into an existing object + save.
See `splitPath()` for valid path specifications.


subscribe(path, cb, options?)
-----------------------------
Subscribe to a path, calling the callback as `cb(newValue)` for any change.

Options can be:

| Option      | Type      | Default | Description                                                                                                       |
|-------------|-----------|---------|-------------------------------------------------------------------------------------------------------------------|
| `immediate` | `boolean` | `true`  | Whether to fire the subscription immediately with the current value, if falsy only updates will fire the callback |


unsubscribe(path, cb)
---------------------
Release a given callback from its subscription.


VUE: bindData(vuePath, dsPath, options?)
----------------------------------------
Bind a local Vue variable to a remote Deepstream path.
Read or writes to the remote will sync with local (assuming the correct `allow{Read,Write}` options are enabled).

Options can be:

| Option       | Type       | Default | Description                                                              |
|--------------|------------|---------|--------------------------------------------------------------------------|
| `immediate`  | `boolean`  | `true`  | Whether to fetch the state immediately after subscription                |
| `allowRead`  | `boolean`  | `true`  | Keep the local state up to date with the remote                          |
| `allowWrite` | `boolean`  | `true`  | Keep the remote state up to date with local                              |
| `readData`   | `function` |         | Function to call as `(newData)` when any data is incomming from remote   |
| `writeData`  | `function` |         | Function to call as `(newData)` before changes are transmitted to remote |

**Notes:**
* Data object parameters in `readData` and `writeData` can mutate incomming / outgoing data respectively
* Setting `{allowWrite: false}` is essencially the same as `$deepstream.subscribe(path, cb)` but automatically updates local state without a callback


VUE: destroyVM()
----------------
Clean up all bindings and release any pending subscriptions.
Called automatically when a Vue component is entering the `beforeDestroy` lifecycle stage.



rpc
---
Object for Remote-Procedure-Calls.



rpc.provide(name, cb)
---------------------
Regisiter an RPC function.


rpc.call(name, data?)
---------------------
Call a registered RPC function with an optional data object.
