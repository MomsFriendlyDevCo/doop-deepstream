exports let config = {
	deepstream: {
		port: 6020,
		path: '/api/stream',
		ssl: {
			enabled: false,
			key: '/etc/letsencrypt/live/FIXME:SITE/privkey.pem',
			cert: '/etc/letsencrypt/live/FIXME:SITE/cert.pem',
		},
		config: { // Deepstream specific config
			serverName: config => url.parse(config.url).hostname,
			storage: {
				name: 'mongodb',
				options: {
					connectionString: config => config.mongo.uri,
					database: config => url.parse(config.url).pathname.replace(/^\//, ''),
					defaultTable: 'deepstream',
				},
			},
		},
	},
	layout: {
		$config: {
			deepstream: {
				url: `${app.config.deepstream.config.serverName}${app.config.deepstream.path}:${app.config.deepstream.port}`,
			},
		},
	},
};
