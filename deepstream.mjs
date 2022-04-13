import {DeepstreamClient} from '@deepstream/client';

export class DeepstreamService {
	/**
	* Deepstream client object after connect
	* @type {DeepstreamClient}
	*/
	client = null;


	/**
	* Paths currently being held in local cache
	* All value DeepstreamRecords will have already fired their whenReady() promise before they are cached
	* @type {Object} An object where each key is the path and the value is the DeepstreamRecord
	*/
	pathCache = {};


	/**
	* Whether this component is ready
	* @type {boolean}
	*/
	isReady = false;


	/**
	* Connect to the server, this must be called before any other method is used
	* @param {Object} [auth] Optional auth params to use
	* @returns {Promise} A promise which will resolve when the connection is complete
	*/
	connect(url, auth = {}) {
		this.client = new DeepstreamClient(url);
		return new Promise((resolve, reject) =>
			this.client.login(auth, (success, err) => {
				if (success) {
					this.isReady = true;
					resolve();
				} else {
					reject(err);
				}
			})
		);
	};


	/**
	* Get a Deepstream record and cache it
	* @param {string} path The Deepstream path to fetch
	* @returns {Promise<DeepstreamRecord>} A promise which will resolve with the (now cached) Deepstream record
	*/
	getRecord(path) {
		if (this.pathCache[path]) { // Already in cache
			return Promise.resolve(this.pathCache[path]);
		} else { // Need to fetch + wait on ready
			return new Promise(resolve =>
				 this.client.record.getRecord(path)
					.whenReady(record => {
						this.pathCache[path] = record;
						resolve(record);
					})
			);
		}
	};


	/**
	* Split a simple path into Deepstream compatible name + path components
	* Note that the name is always the first path segment for deepstream and the path is the remaining part
	* @param {string|array} Path to seperate in either dotted notation, slash notation or array form
	* @param {boolean} [nameOnly=false] Whether to split into name+path or just name
	* @returns {Object} An object composed of `{docName: String, docPath: String|Undefined}`
	*/
	splitPath(path, nameOnly = false) {
		let pathBits = Array.isArray(path)
			? path.map(p => p.replace(/[\.\/]+/g, '_')) // Remove splitter characters from the path
			: path.split(/[\.\/]+/);

		if (nameOnly) {
			return {
				docName: pathBits.join('.'),
			};
		} else if (pathBits.length == 1) {
			return {
				docName: pathBits[0],
				docPath: undefined,
			};
		} else {
			return {
				docName: pathBits.shift(),
				docPath: pathBits.join('.'),
			}
		}
	};


	/**
	* Get the current value of a Deepstream path ONCE
	* @see subscribe() for updates
	* @param {string} path The Deepstream path to fetch
	* @param {*} fallback Fallback value if the record doesn't exist, if undefined the function will instead throw if no value is found
	* @returns {Promise<*>} A promise which will resolve with the record value
	*/
	get(path, fallback) {
		let {docPath, docName} = this.splitPath(path);

		if (docPath) { // Complex path setter - we have to use getRecord()
			return this.getRecord(docName)
				.then(record => record.get(docPath) || fallback)
		} else { // Simple key/val setter - can use direct setting via snapshot()
			return new Promise((resolve, reject) =>
				this.client.record.snapshot(
					docName,
					(err, val) => {
						err === 'RECORD_NOT_FOUND' && fallback ? resolve(fallback)
						: err ? reject(err, val)
						: resolve(val)
					}
				)
			);
		}
	};


	/**
	* Returns if a given path is present and has data
	* @param {string} path The Deepstream path to check
	* @returns {Promise<boolean>} A promise which will resolve if the path has a non-empty value
	*/
	has(path) {
		return new Promise((resolve, reject) =>
			this.client.record.has(
				path.splitPath(path, true).docName,
				(err, hasRecord) => err ? reject(err) : resolve(hasRecord)
			)
		);
	};


	/**
	* Simple setter for a Deepstream path
	* @param {string} path The Deepstream to set in dotted, slash or array notation
	* @param {*} value The value to set
	* @returns {*} The new value set
	*
	* @example Set a simple key/val
	* deeepstream.set('foo', {bar: {baz: [1, 2, 3]}});
	*
	* @example Append a new key to foo.bar
	* deeepstream.set('foo/bar', {quz: 'Hello'});
	*
	* @example Append to an array
	* deeepstream.set('foo/bar/baz/3', 'New item')
	*/
	set(path, value) {
		let {docName, docPath} = this.splitPath(path);
		return new Promise(resolve =>
			this.client.record.setData(docName, docPath, value, ()=> resolve(value))
		);
	};


	/**
	* Wraps the Deepstrem get + subscribe functionality to return a function which will exec on each change
	* @param {string} path The Deepstream path to subscribe to
	* @param {function} cb The callback function, called as `(data)` which will be called on changes
	* @param {Object} [options] Initial options to use when subscribing
	* @param {boolean} [options.immediate=true] Whether to fire the subscription immediately with the current value, if falsy only updates will fire the callback
	* @returns {Promise} A promise which resolves when the fetching + subscription has completed
	*/
	subscribe(path, cb, options) {
		var settings = {
			immediate: true,
			...options,
		};

		return this.getRecord(this.splitPath(path, true).docName)
			.then(record => {
				if (settings.immediate) cb(record.get());
				return record.subscribe(cb)
			})
	};


	/**
	* RPC wrapper for Deepstream
	* @type {Object}
	*/
	rpc = {
		/**
		* Set up a RPC endpoint similar to `app.get()`
		* @param {string} name The name of the endpoint, usually in big-endian `noun.verb` notation (e.g. 'users.refresh')
		* @param {function} cb Async function to handle the endpoint
		* @returns {Object} The root chainable object
		*/
		provide: (name, cb) => {
			this.client.rpc.provide(name, (data, response) => {
				Promise.resolve(cb(data))
					.then(cbResponse => response.send(cbResponse))
					.catch(e => response.error(e.toString()))
			});

			return this;
		},


		/**
		* Call an RPC endpoint, returning a promise for the eventual result
		* @param {string} name The RPC registered function name to call
		* @param {*} [args...] Optional additional arguments
		* @returns {Promise<*>} A promise which will return the result of the RPC call, if any
		*/
		call: (name, args) => new Promise((resolve, reject) =>
			this.client.rpc.make(name, args, (err, res) =>
				err ? reject(err, res) : resolve(res)
			)
		),
	};
}
