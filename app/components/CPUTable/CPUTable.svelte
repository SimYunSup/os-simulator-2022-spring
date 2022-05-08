<script lang="ts">
	import { send, service } from "@app/store/schedule.store";
	import type { TCPUType } from "@app/types/method.interface";
	import { afterUpdate } from "svelte";

	let cpuData: TCPUType[] = ["P"];
	let definedCpuData: TCPUType[];
	let taskHistoryArray: number[][];
	const addCPUData = () => {
		if (cpuData.length >= 4) {
			return;
		}
		cpuData = [...cpuData, "P"];
	};
	const createRemoveCPUData = (index: number) => () => {
		if (cpuData.length <= 1) {
			return;
		}
		const newCPUData = Array.from(cpuData);
		newCPUData.splice(index, 1);
		cpuData = newCPUData;
	};
	service.onTransition((state) => {
		if (state.matches("setup.pending.cpu.idle")) {
			const newCPUData = Array.from(cpuData);
			newCPUData.sort((a, b) => b.charCodeAt(0) - a.charCodeAt(0));
			cpuData = newCPUData;
			send({
				type: "send.cpu",
				payload: {
					cpuData: newCPUData,
				},
			});
		}
		if (
			state.matches("setup.idle") &&
			state.context.taskHistoryArray.length !== 0
		) {
			taskHistoryArray = state.context.taskHistoryArray;
			definedCpuData = Array.from(cpuData);
		}
	});
</script>

<article class="cputable">
	<table class="cputable__table">
		<thead>
			<tr>
				<th>CPU</th>
				<th>Type</th>
				<th>Watt</th>
				<th>
					<button
						class="waves-effect waves-light btn btn-small blue accent-4"
						on:click={addCPUData}>+</button
					>
				</th>
			</tr>
		</thead>
		<tbody>
			{#each cpuData as cpu, index}
				<tr>
					<td>
						Core {index + 1}
					</td>
					<td>
						<select
							class="no-autoinit"
							style="display: block"
							bind:value={cpu}
						>
							<option value="P">P Core</option>
							<option value="E">E Core</option>
						</select>
					</td>
					<td>
						{taskHistoryArray && taskHistoryArray[index]
							? taskHistoryArray[index]
									.reduce(
										(prev, cur) =>
											prev +
											(cur !== -1
												? definedCpuData[index] === "P"
													? 3
													: 1
												: 0.1),
										0
									)
									.toFixed(2)
							: 0} W
					</td>
					<td>
						<button
							class="waves-effect waves-light btn btn-small red accent-4"
							on:click={createRemoveCPUData(index)}
						>
							-
						</button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</article>

<style lang="scss">
	@import "./CPUTable.scss";
</style>
