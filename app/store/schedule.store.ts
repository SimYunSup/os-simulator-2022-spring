import { createMachine } from "xstate";
import type { TMethod } from "@app/types/method.interface";

const scheduleMachine = createMachine(
	{
		context: {
			type: "FCFS" as TMethod,
			quantum: 1,
			processData: [],
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
											},
										},
									},
									complete: { type: "final" },
								},
							},
						},
						onDone: {
							target: "complete",
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
		},
	}
);

export default scheduleMachine;
