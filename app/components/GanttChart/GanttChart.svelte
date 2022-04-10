<script lang="ts">
	import { onMount } from "svelte";
	import * as d3 from "d3";
	import { send, service } from "@app/store/schedule.store";
	import indexColor from "@app/constant/color";

	let currentTime: number;
	let chart: HTMLDivElement;

	interface THistory {
		id: number;
		startTime: number;
		endTime: number;
	}
	function changeGanttData(historyArray: Array<Array<number>>) {
		return historyArray.map((history) =>
			history.reduce((previousValue, cur, index) => {
				if (cur === -1) {
					return previousValue;
				}
				if (
					previousValue.length !== 0 &&
					previousValue[previousValue.length - 1].id === cur &&
					previousValue[previousValue.length - 1].endTime === index
				) {
					previousValue[previousValue.length - 1].endTime++;
					return previousValue;
				}
				return previousValue.concat({
					id: cur,
					startTime: index,
					endTime: index + 1,
				});
			}, [] as Array<THistory>)
		);
	}

	function drawGanttChart(
		taskHistory: Array<Array<THistory>>,
		currentTime: number
	) {
		const CPUName = Array.from(
			{ length: taskHistory.length },
			(__dirname, index) => `CPU ${index + 1}`
		);
		let x = d3
			.scaleLinear()
			.domain([0, currentTime])
			.range([0, 900])
			.clamp(true);
		let y = d3
			.scaleBand()
			// y axis 이름
			.domain(CPUName)
			.rangeRound([0, 400]);
		let xAxis = d3
			.axisBottom(x)
			.tickValues(
				Array.from({ length: currentTime + 1 }, (_, index) => index)
			);

		let yAxis = d3.axisLeft(y).tickSize(0);
		d3.select(chart).selectAll("svg").remove();
		let svg = d3
			.select(chart)
			.append("svg")
			.attr("class", "chart")
			.attr("width", 1000)
			.attr("height", 500)
			.append("g")
			.attr("class", "gantt-chart")
			.attr("width", 1000)
			.attr("height", 500)
			.attr("transform", `translate(${40}, ${0})`);

		taskHistory.forEach((history, index) => {
			svg.selectAll(".chart")
				.data(history)
				.enter()
				.append("rect")
				.attr("rx", 5)
				.attr("ry", 5)
				.attr("fill", (d) => indexColor[d.id])
				.attr("x", (d) => x(d.startTime) ?? 0)
				.attr("y", y(CPUName[index]) ?? 0)
				.attr("height", function (d) {
					return y.bandwidth();
				})
				.attr("width", function (d) {
					return Math.max(1, x(d.endTime) - x(d.startTime));
				});
		});

		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", `translate(0, ${400})`)
			.transition()
			.call(xAxis);
		svg.append("g").attr("class", "y axis").transition().call(yAxis);
	}

	service.subscribe((state) => {
		if (
			state.context.taskHistoryArray.length === 0 ||
			currentTime === state.context.currentTime
		) {
			return;
		}
		currentTime = state.context.currentTime;
		drawGanttChart(
			changeGanttData(state.context.taskHistoryArray),
			state.context.taskHistoryArray[0].length
		);
		// requestAnimationFrame(() => {
		// 	requestAnimationFrame(() => {
		// 		send({ type: "schedule" });
		// 	});
		// });
	});
</script>

<div
	id="gantt-chart"
	bind:this={chart}
	style="margin: 0 auto; width: 1000px; height: 500px;"
/>
<button on:click={() => send({ type: "schedule" })}>schedule</button>
