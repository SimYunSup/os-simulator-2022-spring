<script lang="ts">
	import { state, send, service } from "@app/store/schedule.store";
	import type { TProcess } from "@app/types/method.interface";

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
	const indexColor = [
		"#ADD8E6",
		"#DEB887",
		"#F5FFFA",
		"#00FF7F",
		"#DA70D6",
		"#DB7093",
		"#DCDCDC",
		"#9400D3",
		"#E6E6FA",
		"#ADFF2F",
		"#FF8C00",
		"#1E90FF",
		"#BA55D3",
		"#FF4500",
		"#7FFFD4",
		"#FF1493",
	];
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
