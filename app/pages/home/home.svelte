<script lang="ts">
	import Header from "@components/header/header.svelte";
	import ProcessTable from "@components/ProcessTable/ProcessTable.svelte";
	import CPUTable from "@components/CPUTable/CPUTable.svelte";
	import ReadyQueue from "@components/ReadyQueue/ReadyQueue.svelte";
</script>

<Header />

<main class="home">
	<div class="home__setting">
		<ProcessTable />
		<CPUTable />
		<ReadyQueue />
	</div>
</main>

<style lang="scss">
	@import "./home.scss";
</style>
