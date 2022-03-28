<script lang="ts">
	/**
	 * Index HTML
	 * =====================
	 * Svelte Page
	 *
	 * @contributors: Patryk Rzucidło [@ptkdev] <support@ptkdev.io> (https://ptk.dev)
	 *
	 * @license: MIT License
	 *
	 */
	import Router from "svelte-spa-router";
	import routes from "@app/routes/pages";
	import "./index";
</script>

<Router {routes} />

<style lang="scss" global>
	@import "./index.scss";
</style>
