<script lang="ts">
	import { state, send, service } from "@app/store/schedule.store";
	import type { TCPUType } from "@app/types/method.interface";

	let cpuData: TCPUType[] = ["P"];
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
			send({
				type: "send.cpu",
				payload: {
					cpuData,
				},
			});
		}
	});
</script>

<article class="cputable">
	<table class="cputable__table">
		<thead>
			<tr>
				<th>CPU</th>
				<th>Type</th>
				<th>
					<button on:click={addCPUData}>+</button>
				</th>
			</tr>
		</thead>
		<tbody>
			{#each cpuData as cpu, index}
				<tr>
					<td>
						Process {index + 1}
					</td>
					<td>
						<select bind:value={cpu}>
							<option value="P">P Core</option>
							<option value="E">E Core</option>
						</select>
					</td>
					<td>
						<button on:click={createRemoveCPUData(index)}>
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
