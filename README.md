@doop/deepstream
================
[Deepstream.io](https://deepstream.io) adapter for [Doop](https://github.com/MomsFriendlyDevCo/Doop).


Backend
=======
Specify some config in `app.config.deepstream`:

```javascript
{
	deepstream: {
		enabled: true,
	},
}
```

The module will be detected and loaded automatically with the server.


Frontend
========
The `vm.$deepstream` service should be loaded by default which is a DeepstreamClient instance.

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
				this.record.set(this.doc);
			},
		},
	},
	created() {
		// this.$debug.enabled = true;
		this.record = this.$deepstream.record.getRecord('debug/deepstream');
		this.record.subscribe(values => {
			this.$debug('GET', this.doc);
			this.doc = values;
		});
	},
});
```

See the default `/debug/deepstream` debug endpoint for an example.
