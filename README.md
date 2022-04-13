@doop/deepstream
================
[Deepstream.io](https://deepstream.io) adapter for [Doop](https://github.com/MomsFriendlyDevCo/Doop).


Features vs. Vanilla Deepstream:

* Entirely promise based - no weird callbacks that DS seems to prefer for _some_ methods
* Minimal `get()` / `set()` implementations which try to avoid subscribing to Deepstream to fetch data when possible
* Names are dropped entirely to use paths which can be in `dotted.notation`, `slash/notation` or `['array', 'format']`
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


subscribe(path, cb, options?)
-----------------------------
Subscribe to a path, calling the callback as `cb(newValue)` for any change.

Options can be:

| Option      | Type      | Default | Description                                                                                                       |
|-------------|-----------|---------|-------------------------------------------------------------------------------------------------------------------|
| `immediate` | `boolean` | `true`  | Whether to fire the subscription immediately with the current value, if falsy only updates will fire the callback |



rpc
---
Object for Remote-Procedure-Calls.



rpc.provide(name, cb)
---------------------
Regisiter an RPC function.


rpc.call(name, data?)
---------------------
Call a registered RPC function with an optional data object.
