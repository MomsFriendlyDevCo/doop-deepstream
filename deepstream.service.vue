<script lang="js" frontend>
import {DeepstreamClient} from '@deepstream/client/dist/src/deepstream';

// Shim the Front-end Buffer library as the WebSocket component of Deepstream seems really obsessed with having it instead of the native Blob
import {Buffer} from 'buffer/'; // NOTE: Intentional trailing slash to override regular built-in to use NPM library
window.Buffer = Buffer;

/**
* Deepstream service
*/
app.service('$deepstream', function() {
	var $deepstream = new DeepstreamClient(`ws://${window.location.host}:6020/deepstream`);
	$deepstream.login();

	return $deepstream;
});
</script>
