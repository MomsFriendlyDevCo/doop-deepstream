<script lang="js" frontend>
/**
* Expose vm.$deepstream as a library all components can use
* @see ./deepstream.mjs
*/
import {DeepstreamService} from './deepstream.mjs';

// Shim the Front-end Buffer library as the WebSocket component of Deepstream seems really obsessed with having it instead of the native Blob
import {Buffer} from 'buffer/'; // NOTE: Intentional trailing slash to override regular built-in to use NPM library
globalThis.Buffer = Buffer;

app.service('$deepstream', function() {
	let $deepstream = new DeepstreamService();

	// $deepstream.connect(this.$config.deepstream.url);

	app.vue.$on('$session.settled', ()=>
		$deepstream.connect(this.$config.deepstream.url)
	);

	return $deepstream;
})
</script>
