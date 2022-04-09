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
	* Get the current value of a Deepstream path ONCE
	* @see subscribe() for updates
	* @param {string} path The Deepstream path to fetch
	* @returns {Promise<*>} A promise which will resolve with the record value
	*/
	get(path) {
		return this.getRecord(path)
			.then(record => record.get())
	};


	/**
	* Returns if a given path is present and has data
	* @param {string} path The Deepstream path to check
	* @returns {Promise<boolean>} A promise which will resolve if the path has a non-empty value
	*/
	has(path) {
		return this.getRecord(path)
			.then(record => record.get())
			.then(data =>
				data
				&& ( // Either it has a scalar value or is a non-empty object
					typeof data != 'object'
					|| Object.keys(data).length > 0
				)
			)
	};


	/**
	* Simple setter for a Deepstream path
	* @param {string} path The Deepstream to set
	* @param {*} value The value to set
	* @returns {*} The new value set
	*/
	set(path, value) {
		return this.getRecord(path)
			.then(record => new Promise(resolve => record.set(value, resolve)))
			.then(()=> value)
	};


	/**
	* Wraps the Deepstrem get + subscribe functionality to return a function which will exec on each change
	* @param {string} path The Deepstream path to subscribe to
	* @param {function} cb The callback function, called as `(data)` which will be called on changes
	* @returns {Promise} A promise which resolves when the fetching + subscription has completed
	*/
	subscribe(path, cb) {
		return this.getRecord(path)
			.then(record => record.subscribe(cb))
	};
}
