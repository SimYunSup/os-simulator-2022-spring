<script lang="ts">
	import { state, send, service } from "@app/store/schedule.store";
	import type { TProcess } from "@app/types/method.interface";
	import indexColor from "@app/constant/color";

	let processData: TProcess[] = [
		{
			arrivalTime: 0,
			burstTime: 2,
		},
	];
	const addProcessData = () => {
		if (processData.length >= 15) {
			return;
		}
		processData = [
			...processData,
			{
				arrivalTime: 0,
				burstTime: 2,
			},
		];
	};
	const createRemoveProcessData = (index: number) => () => {
		if (processData.length <= 1) {
			return;
		}
		const newProcessData = Array.from(processData);
		newProcessData.splice(index, 1);
		processData = newProcessData;
	};
	service.onTransition((state) => {
		if (state.matches("setup.pending.process.idle")) {
			send({
				type: "send.process",
				payload: {
					processData: processData.map((process, index) => ({
						...process,
						id: index,
					})),
				},
			});
		}
	});
</script>

<article class="processtable">
	<table class="processtable__table">
		<thead>
			<tr>
				<th>Process Name</th>
				<th>Burst Time(BT)</th>
				<th>Arrival Time(AT)</th>
				<th>
					<button on:click={addProcessData}>+</button>
				</th>
			</tr>
		</thead>
		<tbody>
			{#each processData as process, index}
				<tr style="background-color: {indexColor[index]}">
					<td>
						Process {index + 1}
					</td>
					<td>
						<input type="number" bind:value={process.burstTime} />
					</td>
					<td>
						<input type="number" bind:value={process.arrivalTime} />
					</td>
					<td>
						<button on:click={createRemoveProcessData(index)}>
							-
						</button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</article>

<style lang="scss">
	@import "./ProcessTable.scss";
</style>
