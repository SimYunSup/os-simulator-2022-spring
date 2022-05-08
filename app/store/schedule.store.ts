import { createMachine, send as sendGlobal } from "xstate";
import type { TMethod, TProcess } from "@app/types/method.interface";
import { useMachine } from "@xstate/svelte";
import { inspect } from "@xstate/inspect";

export type TNamedProcess = TProcess & { id: number };

export type TCurrentTask = {
	remainedTime: number;
	process: TNamedProcess;
};
const initialContext = {
	type: "FCFS" as TMethod,
	quantum: 1,
	executionTime: 1000,
	processData: [] as Array<TNamedProcess>,
	cpuData: [] as Array<string>,
	queue: [] as Array<Array<TNamedProcess>>,
	currentTime: 0,
	currentTask: [] as Array<TCurrentTask | null>,
	taskHistoryArray: [] as Array<Array<number>>,
};

const scheduleMachine = createMachine(
	{
		schema: {
			context: {} as typeof initialContext,
		},
		context: initialContext,
		initial: "setup",
		states: {
			setup: {
				type: "compound",
				initial: "idle",
				states: {
					idle: {
						on: {
							submit: {
								target: "pending",
							},
						},
					},
					pending: {
						type: "parallel",
						states: {
							process: {
								initial: "idle",
								states: {
									idle: {
										on: {
											"send.process": {
												target: "complete",
												actions: ["sendProcess"],
											},
										},
									},
									complete: { type: "final" },
								},
							},
							type: {
								initial: "idle",
								states: {
									idle: {
										on: {
											"send.type": {
												target: "complete",
												actions: ["sendType"],
											},
										},
									},
									complete: { type: "final" },
								},
							},
							cpu: {
								initial: "idle",
								states: {
									idle: {
										on: {
											"send.cpu": {
												target: "complete",
												actions: ["sendCPU"],
											},
										},
									},
									complete: { type: "final" },
								},
							},
						},
						onDone: {
							target: "complete",
							actions: ["scheduleProcess"],
						},
					},
					complete: {
						type: "final",
					},
				},
				onDone: "working",
			},
			working: {
				type: "compound",
				initial: "scheduling",
				states: {
					scheduling: {
						after: {
							EXECUTION_TIME: [
								{
									target: "complete",
									cond: "isWorkEnd",
								},
								{
									target: "working",
									actions: ["workProcess"],
								},
							],
						},
					},
					working: {
						on: {
							schedule: {
								target: "scheduling",
								actions: ["scheduleProcess"],
							},
						},
					},
					complete: {
						type: "final",
					},
				},
				onDone: {
					target: "setup",
				},
			},
		},
		id: "schedule",
	},
	{
		actions: {
			sendType: (context, event) => {
				context.type = event.payload.type;
				context.quantum = !Number.isNaN(event.payload.quantum)
					? Number(event.payload.quantum)
					: 2;
				context.executionTime = !Number.isNaN(
					event.payload.executionTime
				)
					? Number(event.payload.executionTime)
					: 1000;
			},
			sendProcess: (context, event) => {
				context.processData = (
					JSON.parse(
						JSON.stringify(event.payload.processData)
					) as Array<TNamedProcess>
				).sort(
					(first, second) => first.arrivalTime - second.arrivalTime
				);
			},
			sendCPU: (context, event) => {
				context.cpuData = Array.from(event.payload.cpuData);
				context.queue = Array.from(
					{ length: event.payload.cpuData.length },
					() => []
				);
				context.taskHistoryArray = Array.from(
					{ length: event.payload.cpuData.length },
					() => []
				);
				context.currentTime = 0;
				context.currentTask = Array.from(
					{ length: event.payload.cpuData.length },
					() => null
				);
			},
			scheduleProcess: (context) => {
				context.currentTask.forEach((task, index) => {
					if (
						task &&
						task.remainedTime === 0 &&
						task.process.burstTime > 0
					) {
						context.queue[index].push(task.process);
					}
				});
				const nextTasks = context.currentTask.map((task) => {
					if (!task || task.remainedTime === 0) {
						return null;
					}
					return task;
				});

				// work stealing
				if (context.queue.flat(2).length !== 0) {
					const queueRunTime = context.queue.map(
						(queueData, index) => ({
							runtime: queueData.reduce((prevVal, cur) => {
								prevVal +=
									cur.burstTime /
									(context.cpuData[index] === "P" ? 2 : 1);
								prevVal = Math.ceil(prevVal);
								return prevVal;
							}, 0),
							id: index,
						})
					);
					queueRunTime.sort((a, b) => a.runtime - b.runtime);
					const maxRuntimeQueueData =
						queueRunTime[queueRunTime.length - 1];
					const minRuntimeQueueData = queueRunTime[0];
					const maxRuntimeQueue =
						context.queue[maxRuntimeQueueData.id];
					const minRuntimeQueue =
						context.queue[minRuntimeQueueData.id];
					if (
						Math.ceil(
							maxRuntimeQueue[maxRuntimeQueue.length - 1]
								.burstTime /
								(context.cpuData[maxRuntimeQueueData.id] === "P"
									? 2
									: 1)
						) <=
						maxRuntimeQueueData.runtime -
							minRuntimeQueueData.runtime
					) {
						const stolenData = maxRuntimeQueue.pop();
						if (stolenData) {
							minRuntimeQueue.push(stolenData);
						}
					}
				}

				// process scheduling
				if (context.type === "FCFS") {
					context.processData
						.filter(
							(process) =>
								process.arrivalTime === context.currentTime
						)
						.forEach((process, index) => {
							context.queue[index % context.queue.length].push(
								process
							);
						});
					context.currentTask = nextTasks.map((task, index) => {
						if (task === null) {
							const nextTask = context.queue[index].shift() as
								| TNamedProcess
								| undefined;
							if (!nextTask) {
								return null;
							}

							return {
								remainedTime: nextTask.burstTime,
								process: nextTask,
							};
						}
						return task;
					});
				} else if (context.type === "RR") {
					context.processData
						.filter(
							(process) =>
								process.arrivalTime === context.currentTime
						)
						.forEach((process, index) => {
							context.queue[index % context.queue.length].push(
								process
							);
						});
					context.currentTask = nextTasks.map((task, index) => {
						if (task === null) {
							const nextTask = context.queue[index].shift() as
								| TNamedProcess
								| undefined;
							if (!nextTask) {
								return null;
							}

							return {
								remainedTime:
									nextTask.burstTime > context.quantum
										? context.quantum
										: nextTask.burstTime,
								process: nextTask,
							};
						}
						return task;
					});
				} else if (context.type === "SPN") {
					context.processData
						.filter(
							(process) =>
								process.arrivalTime === context.currentTime
						)
						.forEach((process, index) => {
							context.queue[index % context.queue.length].push(
								process
							);
						});
					context.queue.forEach((queueData) => {
						queueData.sort((a, b) => a.burstTime - b.burstTime);
					});
					context.currentTask = nextTasks.map((task, index) => {
						if (task === null) {
							const nextTask = context.queue[index].shift() as
								| TNamedProcess
								| undefined;
							if (!nextTask) {
								return null;
							}

							return {
								remainedTime: nextTask.burstTime,
								process: nextTask,
							};
						}
						return task;
					});
				} else if (context.type === "SRTN") {
					context.processData
						.filter(
							(process) =>
								process.arrivalTime === context.currentTime
						)
						.forEach((process, index) => {
							context.queue[index % context.queue.length].push(
								process
							);
						});
					context.queue.forEach((queueData) => {
						queueData.sort((a, b) => a.burstTime - b.burstTime);
					});
					context.currentTask = nextTasks.map((task, index) => {
						const nextTask = context.queue[index][0] as
							| TNamedProcess
							| undefined;
						if (
							!nextTask ||
							(task?.remainedTime ?? 0 > nextTask.burstTime)
						) {
							return task;
						}

						const shiftedTask = context.queue[index].shift();
						if (!shiftedTask) {
							return task;
						}
						if (task) {
							context.queue[index].push(task.process);
							context.queue[index].sort(
								(a, b) => a.burstTime - b.burstTime
							);
						}

						return {
							remainedTime: shiftedTask.burstTime,
							process: shiftedTask,
						};
					});
				} else if (context.type === "HRRN") {
					context.processData
						.filter(
							(process) =>
								process.arrivalTime === context.currentTime
						)
						.forEach((process, index) => {
							context.queue[index % context.queue.length].push(
								process
							);
						});
					context.queue.forEach((value) => {
						value.sort((a, b) => {
							return (
								(b.burstTime +
									(context.currentTime - b.arrivalTime)) /
									b.burstTime -
								(a.burstTime +
									(context.currentTime - a.arrivalTime)) /
									a.burstTime
							);
						});
					});
					context.currentTask = nextTasks.map((task, index) => {
						if (task === null) {
							const nextTask = context.queue[index].shift() as
								| TNamedProcess
								| undefined;
							if (!nextTask) {
								return null;
							}

							return {
								remainedTime: nextTask.burstTime,
								process: nextTask,
							};
						}
						return task;
					});
				} else if (context.type === "Custom") {
					const findMinRuntimeQueue = () => {
						let minRuntimeQueue = context.queue[0],
							minRuntime = context.queue[0].reduce(
								(prevVal, cur) => {
									prevVal +=
										cur.burstTime /
										(context.cpuData[0] === "P" ? 2 : 1);
									prevVal = Math.ceil(prevVal);
									return prevVal;
								},
								0
							);
						context.queue.forEach((queueData, index) => {
							const currentRuntime = queueData.reduce(
								(prevVal, cur) => {
									prevVal +=
										cur.burstTime /
										(context.cpuData[index] === "P"
											? 2
											: 1);
									prevVal = Math.ceil(prevVal);
									return prevVal;
								},
								0
							);
							if (currentRuntime < minRuntime) {
								minRuntime = currentRuntime;
								minRuntimeQueue = queueData;
							}
						});
						return minRuntimeQueue;
					};
					context.processData
						.filter(
							(process) =>
								process.arrivalTime === context.currentTime
						)
						.forEach((process) => {
							const minRuntimeQueue = findMinRuntimeQueue();
							minRuntimeQueue.push(process);
						});
					context.currentTask = nextTasks.map((task, index) => {
						if (task === null) {
							const nextTask = context.queue[index].shift() as
								| TNamedProcess
								| undefined;
							if (!nextTask) {
								return null;
							}

							return {
								remainedTime: nextTask.burstTime,
								process: nextTask,
							};
						}
						return task;
					});
				}
			},
			workProcess: (context) => {
				context.currentTask = context.currentTask.map((task, index) => {
					const workTime = context.cpuData[index] === "P" ? 2 : 1;
					if (!task) {
						return null;
					}
					return {
						remainedTime:
							task.remainedTime - workTime >= 0
								? task.remainedTime - workTime
								: 0,
						process: {
							...task.process,
							burstTime:
								task.process.burstTime - workTime >= 0
									? task.process.burstTime - workTime
									: 0,
						},
					};
				});
				context.taskHistoryArray = context.taskHistoryArray.map(
					(taskHistory, index) => {
						const nextTaskHistory = Array.from(taskHistory);
						nextTaskHistory.push(
							context.currentTask[index]?.process.id ?? -1
						);
						return nextTaskHistory;
					}
				);
				context.currentTime += 1;
			},
		},
		guards: {
			isWorkEnd: (context) => {
				return !(
					context.queue.findIndex(
						(queuedTask) => queuedTask.length === 0
					) === -1 ||
					context.processData.findIndex(
						(process) => process.arrivalTime > context.currentTime
					) !== -1 ||
					context.currentTask.findIndex((task) => task !== null) !==
						-1
				);
			},
		},
		delays: {
			EXECUTION_TIME: (context) => {
				return context.executionTime;
			},
		},
	}
);
// inspect({
// 	// options
// 	// url: 'https://statecharts.io/inspect', // (default)
// 	iframe: false, // open in new window
// });
export const { state, send, service } = useMachine(scheduleMachine, {
	devTools: true,
});
