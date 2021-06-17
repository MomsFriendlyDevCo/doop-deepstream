var _ = require('lodash');
var {Deepstream} = require('@deepstream/server');
var url = require('url');

if (!app.config.deepstream) return app.log.warn.as('deepstream', 'No app.config.deepstream config specified - aborting');
if (!app.config.deepstream.enabled) return app.log.warn('deepstream', 'Deepstream is disabled');

var parsedUrl = url.parse(app.config.publicUrl);
app.config.layout.csp['connect-src'].push(`ws://${parsedUrl.host}:6020/deepstream`);

app.on('postServer', ()=> {
	app.deepstreamServer = new Deepstream(_.merge(_.omit(app.config.deepstream, 'enabled'), {
		serverName: app.config.name,
		showLogo: false,
		logLevel: 'INFO',
		httpServer:  {
			type: 'default',
			options: {
				urlPath: '/api/deepstream',
			},
		},
	}));
	app.deepstreamServer.start();
});
