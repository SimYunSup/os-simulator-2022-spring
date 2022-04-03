<script lang="ts">
	import Router from "svelte-spa-router";
	import routes from "@app/routes/pages";
	import "./index";
	import { useMachine } from "@xstate/svelte";
	import scheduleMachine from "@app/store/schedule.store";
	const { service } = useMachine(scheduleMachine);
	service.init();
</script>

<Router {routes} />

<style lang="scss" global>
	@import "smelte/src/tailwind.css";
	@import "./index.scss";
</style>
