import { createMachine, send as sendGlobal } from "xstate";
import type { TMethod, TProcess } from "@app/types/method.interface";
import { useMachine } from "@xstate/svelte";

export type TNamedProcess = TProcess & { id: number };

export type TCurrentTask = {
	remainedTime: number;
	process: TNamedProcess;
};
const scheduleMachine = createMachine(
	{
		context: {
			type: "SPN" as TMethod,
			quantum: 1,
			processData: [] as Array<TNamedProcess>,
			cpuData: [],
			queue: [] as Array<Array<TNamedProcess>>,
			currentTime: 0,
			currentTask: [] as Array<TCurrentTask | null>,
			taskHistoryArray: [] as Array<Array<number>>,
		},
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
							1000: [
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
				on: {
					stop: {
						target: "setup",
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
				context.currentTask = Array.from(
					{ length: event.payload.cpuData.length },
					() => null
				);
			},
			scheduleProcess: (context) => {
				if (context.type === "FCFS") {
					const nextTasks = context.currentTask.map((task) => {
						if (!task || task.remainedTime === 0) {
							return null;
						}
						return task;
					});
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
					const nextTasks = context.currentTask.map((task) => {
						if (!task || task.remainedTime === 0) {
							return null;
						}
						return task;
					});
					context.processData
						.filter(
							(process) =>
								process.arrivalTime === context.currentTime
						)
						.forEach((process, index) => {
							const currentQueue =
								context.queue[index % context.queue.length];
							const processIndex = currentQueue.findIndex(
								(queueProcess) => {
									return (
										queueProcess.burstTime >
										process.burstTime
									);
								}
							);
							currentQueue.splice(
								processIndex === -1
									? currentQueue.length
									: processIndex,
								0,
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
				} else if (context.type === "SRTN") {
					const insertQueue = (
						process: TNamedProcess,
						index: number
					) => {
						const currentQueue =
							context.queue[index % context.queue.length];
						const processIndex = currentQueue.findIndex(
							(queueProcess) => {
								return (
									queueProcess.burstTime > process.burstTime
								);
							}
						);
						currentQueue.splice(
							processIndex === -1
								? currentQueue.length
								: processIndex,
							0,
							process
						);
					};
					const nextTasks = context.currentTask.map((task) => {
						if (!task || task.remainedTime === 0) {
							return null;
						}
						return task;
					});
					context.processData
						.filter(
							(process) =>
								process.arrivalTime === context.currentTime
						)
						.forEach((process, index) =>
							insertQueue(process, index)
						);
					context.currentTask = nextTasks.map((task, index) => {
						const nextTask = context.queue[index][0] as
							| TNamedProcess
							| undefined;
						if (!nextTask) {
							return null;
						}
						if (task?.remainedTime ?? 0 > nextTask.burstTime) {
							return task;
						}

						const shiftedTask = context.queue[index].shift();
						if (task) {
							insertQueue(task.process, index);
						}
						if (!shiftedTask) {
							return null;
						}

						return {
							remainedTime: shiftedTask.burstTime,
							process: shiftedTask,
						};
					});
				} else if (context.type === "HRRN") {
					const nextTasks = context.currentTask.map((task) => {
						if (!task || task.remainedTime === 0) {
							return null;
						}
						return task;
					});
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
									: task.process.burstTime,
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
	}
);

export const { state, send, service } = useMachine(scheduleMachine);
