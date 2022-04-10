<script lang="ts">
	import Header from "@components/header/header.svelte";
	import ProcessTable from "@components/ProcessTable/ProcessTable.svelte";
	import CPUTable from "@components/CPUTable/CPUTable.svelte";
	import ReadyQueue from "@components/ReadyQueue/ReadyQueue.svelte";
	import GanttChart from "@components/GanttChart/GanttChart.svelte";
</script>

<Header />

<main class="home">
	<div class="home__setting">
		<ProcessTable />
		<CPUTable />
		<ReadyQueue />
		<GanttChart />
	</div>
</main>

<style lang="scss">
	@import "./home.scss";
</style>
