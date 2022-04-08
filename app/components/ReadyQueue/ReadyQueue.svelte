<script lang="ts">
	import indexColor from "@app/constant/color";

	import {
		state,
		send,
		service,
		type TNamedProcess,
	} from "@app/store/schedule.store";
	let queue: Array<Array<TNamedProcess>>;
	service.subscribe((state) => {
		console.log(state.context.queue);
		queue = state.context.queue;
	});
</script>

<div class="ReadyQueue">
	{#each queue as readyQueue}
		<div class="ReadyQueue__queue">
			{#each readyQueue as task}
				<div
					class="ReadyQueue__task"
					style="background-color: {indexColor[task.id]}"
				>
					P{task.id + 1}
				</div>
			{/each}
		</div>
	{/each}
</div>

<style lang="scss">
	@import "./ReadyQueue.scss";
</style>
