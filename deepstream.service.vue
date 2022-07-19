<script lang="js" frontend>
/**
* Expose vm.$deepstream as a library all components can use
* @see ./deepstream.mjs
*/
import {DeepstreamService} from './deepstream.mjs';

// Shim the Front-end Buffer library as the WebSocket component of Deepstream seems really obsessed with having it instead of the native Blob
import {Buffer} from 'buffer/'; // NOTE: Intentional trailing slash to override regular built-in to use NPM library
globalThis.Buffer = Buffer;


/**
* General Deepstream service
*/
app.service('$deepstream', function() {
	let $deepstream = new DeepstreamService();

	app.vue.$on('$session.settled', ()=>
		$deepstream.connect(this.$config.deepstream.url)
	);

	return $deepstream;
});


// Attach local vm.$deepstream to each component instance
app.mixin({
	beforeCreate() {
		// Proxy object inheritor to main service (if available) or empty object prototype
		let $deepstream = this.$deepstream = app.service.$deepstream ? new Proxy(app.service.$deepstream, {}) : {};

		/**
		* Tracking object for all dsPaths that are subscribed via this Vue component instance
		* This is used by `$deepstream.destroyVM()` to release all subscriptions on termination
		* @type {Object<Array<function>>}
		*/
		$deepstream.bindings = {};


		/**
		* Bind a local Vue data path to a remote Deepstream path, allowing two-way binding for each
		* @param {string} vuePath The local Vue data path in dotted notation to bind
		* @param {string} dsPath The remote Deepstream path in dotted notation
		* @param {Object} [options] Additional options
		* @param {boolean} [options.immediate] Recieve the current state immediately after binding
		* @param {boolean} [options.allowRead=true] Whether to fetch data into the local state - if disabled only write operations are permitted
		* @param {boolean} [options.allowWrite=true] Whether to send data from the local state on change - if disabled only read subscriptions are permitted
		* @param {function} [options.readData] Optional callback to call as `(newData)` when any data is incoming from remote. Can mutate incoming data
		* @param {function} [options.writeData] Optional callback to call as `(newData)` before changes are transmitted to remote. Can mutate incoming data
		*/
		$deepstream.bindData = (vuePath, dsPath, options) => {
			let settings = {
				immediate: true,
				allowRead: true,
				allowWrite: true,
				readData: null,
				writeData: null,
				...options,
			};

			// Argument processing {{{
			if (!settings.allowRead && !settings.allowWrite) throw new Error('Both allowRead + allowWrite are disabled for $deepstream.bindData - chose one or the other at least');
			if (!settings.allowRead && settings.readData) throw new Error('allowRead is disabled but a readData function is specified');
			if (!settings.allowWrite && settings.writeData) throw new Error('allowWrite is disabled but a writeData function is specified');
			// }}}

			// Set up a watcher on the data so we know when writes happen
			if (settings.allowWrite) {
				this.$watch(
					vuePath,
					newData => { // React to Vue writes and send them to the server
						if (settings.writeData) settings.writeData(newData);
						$deepstream.set(dsPath, newData);
					},
					{
						deep: true,
					},
				);
			}

			// Subscribe to the data
			let listenFunc = newData => {
				if (settings.readData) settings.readData(newData);
				this.$set(this, vuePath, newData);
			};

			if (settings.allowRead) {
				$deepstream.subscribe(dsPath, listenFunc, {immediate: settings.immediate});

				$deepstream.bindings[dsPath] = [ // Push onto callback stack
					...($deepstream.bindings[dsPath] || []),
					listenFunc,
				];
			}
		};


		/**
		* Release all subscriptions
		* This function is called in the `beforeDestroy` lifecycle stage of a VueComponent
		* @returns {Promise} A promise which resolves when the operation has completed
		*/
		$deepstream.destroyVM = ()=> {
			return Promise.all(
				Object.entries($deepstream.bindings)
					.flatMap(([path, cbs]) => cbs.map(cb =>
						$deepstream.unsubscribe(path, cb)
					))
			);

		};
	},

	beforeDestroy() {
		return this.$deepstream.destroyVM();
	},
})
</script>
