<script lang="ts">
	import Router from "svelte-spa-router";
	import routes from "@app/routes/pages";
	import "./index";
</script>

<Router {routes} />

<style lang="scss" global>
	@import "./index.scss";
</style>
