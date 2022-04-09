<script lang="js" frontend>
app.component({
	route: '/debug/deepstream',
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
		this.$debug.enable(false);
		this.$deepstream.subscribe('debug/deepstream', values => {
			this.$debug('Update debug/deepstream', this.doc);
			this.doc = values;
		});
	},
});
</script>

<template>
	<div class="card">
		<div class="card-header">
			<h2>Deepstream</h2>
		</div>
		<div class="card-body">
			<form class="form-horizontal">
				<div class="form-group row">
					<label class="col-sm-3 col-form-label">Text</label>
					<div class="col-sm-9">
						<input v-model="doc.text" type="text" class="form-control"/>
					</div>
				</div>
				<div class="form-group row">
					<label class="col-sm-3 col-form-label">Number</label>
					<div class="col-sm-9">
						<input v-model.number="doc.number" type="number" class="form-control" min="1" max="1000"/>
					</div>
				</div>
				<div class="form-group row">
					<label class="col-sm-3 col-form-label">Textarea</label>
					<div class="col-sm-9">
						<textarea v-model="doc.textarea" class="form-control" rows="20" placeholder="Type anything here across multiple tabs..."/>
					</div>
				</div>
			</form>
		</div>
	</div>
</template>
