<script lang="ts">
	import { send, service } from "@app/store/schedule.store";
	import type { TProcess } from "@app/types/method.interface";
	import indexColor from "@app/constant/color";
	import type { THistory } from "@app/helper/changeGanttData.helper";
	import changeGanttData from "@app/helper/changeGanttData.helper";

	interface TProcessResult {
		waitingTime: number;
		turnaroundTime: number;
	}

	let processData: Array<TProcess> = [
		{
			arrivalTime: 0,
			burstTime: 2,
		},
	];
	let processResultData: Array<TProcessResult & TProcess> = [];
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

	const changeProcessResultData = (
		processData: Array<TProcess>,
		taskHistory: Array<Array<THistory>>
	): Array<TProcessResult & TProcess> => {
		let processResultData = Array.from(
			{ length: processData.length },
			(_, index) => ({
				...processData[index],
				waitingTime: 0,
				turnaroundTime: 0,
			})
		);
		const sortedTaskHistory = taskHistory.flat(2).sort((a, b) => {
			if (a.id === b.id) {
				return a.startTime - b.startTime;
			}
			return a.id - b.id;
		});

		let beforeStoredTime: number;
		let beforeStoredId: number;

		sortedTaskHistory.forEach((sortedTask) => {
			if (beforeStoredId !== sortedTask.id) {
				beforeStoredId = sortedTask.id;
				beforeStoredTime = processResultData[sortedTask.id].arrivalTime;
			}
			processResultData[sortedTask.id].turnaroundTime =
				sortedTask.endTime;
			processResultData[sortedTask.id].waitingTime +=
				sortedTask.startTime - beforeStoredTime;
			beforeStoredTime = sortedTask.endTime;
		});

		return processResultData;
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
		if (
			state.matches("setup.idle") &&
			state.context.taskHistoryArray.length !== 0
		) {
			processResultData = changeProcessResultData(
				processData,
				changeGanttData(state.context.taskHistoryArray)
			);
		}
	});
</script>

<article class="processtable">
	<table class="centered">
		<colgroup>
			<col width="110px" />
			<col width="210px" />
			<col width="210px" />
			<col width="210px" />
			<col width="210px" />
			<col width="210px" />
			<col width="50px" />
			<col width="10px" />
		</colgroup>
		<thead>
			<tr>
				<th>Process Name</th>
				<th>Burst Time(BT)</th>
				<th>Arrival Time(AT)</th>
				<th>Waiting Time(WT)</th>
				<th>Turnaround Time(TT)</th>
				<th>Normalized Turnaround Time(NTT)</th>
				<th>
					<button
						class="waves-effect waves-light btn btn-small blue accent-4"
						on:click={addProcessData}>+</button
					>
				</th>
			</tr>
		</thead>
	</table>
	<div class="processtable__table">
		<table class="centered">
			<colgroup>
				<col width="110px" />
				<col width="210px" />
				<col width="210px" />
				<col width="210px" />
				<col width="210px" />
				<col width="210px" />
				<col width="50px" />
			</colgroup>
			<tbody>
				{#each processData as process, index}
					<tr>
						<td style="background-color: {indexColor[index]}">
							Process {index + 1}
						</td>
						<td>
							<input
								type="number"
								bind:value={process.burstTime}
							/>
						</td>
						<td>
							<input
								type="number"
								bind:value={process.arrivalTime}
							/>
						</td>
						<td>
							{processResultData[index]?.waitingTime.toFixed(2) ??
								"?"}
						</td>
						<td>
							{processResultData[index]?.turnaroundTime.toFixed(
								2
							) ?? "?"}
						</td>
						<td>
							{processResultData[index]?.waitingTime !== undefined
								? (
										processResultData[index]
											.turnaroundTime /
										processResultData[index].burstTime
								  ).toFixed(2)
								: "?"}
						</td>
						<td>
							<button
								on:click={createRemoveProcessData(index)}
								class="waves-effect waves-light btn btn-small red accent-4"
							>
								-
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</article>

<style lang="scss">
	@import "./ProcessTable.scss";
</style>
