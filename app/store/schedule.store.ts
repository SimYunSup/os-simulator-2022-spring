import { createMachine, send } from "xstate";
import type { TMethod } from "@app/types/method.interface";
import { useMachine } from "@xstate/svelte";

const scheduleMachine = createMachine(
	{
		context: {
			type: "FCFS" as TMethod,
			quantum: 1,
			processData: [],
			cpuData: [],
			cpuWorker: [] as Worker[],
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
							actions: ["setupCPU"],
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
						on: {
							work: {
								target: "working",
							},
							done: {
								target: "complete",
							},
						},
					},
					working: {
						on: {
							draw: {
								target: "drawing",
							},
						},
					},
					drawing: {
						on: {
							schedule: {
								target: "scheduling",
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
				context.processData = JSON.parse(
					JSON.stringify(event.payload.processData)
				);
			},
			sendCPU: (context, event) => {
				console.log(event.payload);
				context.cpuData = Array.from(event.payload.cpuData);
			},
			setupCPU: (context) => {
				console.log("setup complete");
				context.cpuWorker = Array.from(
					{ length: context.cpuData.length },
					(_, index) => {
						const newWorker = new Worker(
							"../worker/coreWorker.js",
							{ type: "module" }
						);
						newWorker.postMessage({
							type: "setup",
							value: context.cpuData[index],
						});
						return newWorker;
					}
				);
			},
		},
	}
);

export const { state, send, service } = useMachine(scheduleMachine);
