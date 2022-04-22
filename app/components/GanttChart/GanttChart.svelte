<script lang="ts">
	import * as d3 from "d3";
	import { send, service } from "@app/store/schedule.store";
	import indexColor from "@app/constant/color";
	import type { THistory } from "@app/helper/changeGanttData.helper";
	import changeGanttData from "@app/helper/changeGanttData.helper";

	let currentTime: number;
	let chart: HTMLDivElement;

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
			.rangeRound([0, taskHistory.length * 100]);
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
			.attr("height", taskHistory.length * 100 + 100)
			.append("g")
			.attr("class", "gantt-chart")
			.attr("width", 1000)
			.attr("height", taskHistory.length * 100 + 100)
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
			.attr("transform", `translate(0, ${taskHistory.length * 100})`)
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
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				send({ type: "schedule" });
			});
		});
	});
</script>

<div
	id="gantt-chart"
	bind:this={chart}
	style="margin: 0 auto; width: 1000px; height: 500px;"
/>
