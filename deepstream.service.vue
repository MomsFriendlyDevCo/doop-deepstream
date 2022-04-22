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

	$deepstream.id = 666;
	$deepstream.connect(this.$config.deepstream.url);

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
		* Bind a local Vue data path to a remote Deepstream path, allowing two-way binding for each
		* @param {string} vuePath The local Vue data path in dotted notation to bind
		* @param {string} dsPath The remote Deepstream path in dotted notation
		* @param {Object} [options] Additional options
		* @param {boolean} [options.immediate] Recieve the current state immediately after binding
		* @param {function} [options.readData] Optional callback to call as `(newData)` when any data is incoming from remote. Can mutate incoming data
		* @param {function} [options.writeData] Optional callback to call as `(newData)` before changes are transmitted to remote. Can mutate incoming data
		*/
		$deepstream.bind = (vuePath, dsPath, options) => {
			let settings = {
				immediate: true,
				readData: data => {},
				writeData: data => {},
				...options,
			};

			// Set up a watcher on the data so we know when writes happen
			this.$watch(
				vuePath,
				newData => { // React to Vue writes and send them to the server
					settings.writeData(newData);
					this.$deepstream.set(dsPath, newData);
				},
				{
					deep: true,
				},
			);

			// Subscribe to the data
			this.$deepstream.subscribe(
				dsPath,
				newData => {
					settings.readData(newData);
					this.$set(this, vuePath, newData);
				},
				settings,
			);
		};
	},
})
</script>
