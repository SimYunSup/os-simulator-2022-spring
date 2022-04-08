import { createMachine, send as sendGlobal } from "xstate";
import type { TMethod } from "@app/types/method.interface";
import { useMachine } from "@xstate/svelte";
import {
	scheduleFCFS,
	type TCurrentTask,
	type TNamedProcess,
} from "@app/helper/schedule.helper";

const scheduleMachine = createMachine(
	{
		context: {
			type: "FCFS" as TMethod,
			quantum: 1,
			processData: [] as Array<TNamedProcess>,
			cpuData: [],
			queue: [] as Array<Array<TNamedProcess>>,
			currentTime: 0,
			currentTask: [null, null, null, null] as Array<TCurrentTask | null>,
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
							0: {
								target: "complete",
								cond: "isWorkEnd",
							},
							1000: {
								target: "working",
								actions: ["workProcess"],
							},
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
			},
			scheduleProcess: (context) => {
				switch (context.type) {
					case "FCFS":
						scheduleFCFS(
							context.processData,
							context.queue,
							context.currentTask,
							context.currentTime
						);
						break;
					default:
						console.log("not yet");
				}
			},
			workProcess: (context) => {
				context.currentTask = context.currentTask.map((task) => {
					if (!task) {
						return null;
					}
					return {
						remainedTime: task?.remainedTime - 1,
						process: {
							...task.process,
							burstTime: task.process.burstTime - 1,
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
			},
		},
		guards: {
			isWorkEnd: (context) => {
				return !(
					context.queue.findIndex(
						(queuedTask) => queuedTask.length !== 0
					) === -1 &&
					context.processData.findIndex(
						(process) => process.arrivalTime > context.currentTime
					) === -1
				);
			},
		},
	}
);

export const { state, send, service } = useMachine(scheduleMachine);
