export const SCHEDULE_METHOD = [
	{
		id: 1,
		name: "FCFS",
	},
	{
		id: 2,
		name: "RR",
	},
	{
		id: 3,
		name: "SPN",
	},
	{
		id: 4,
		name: "SRTN",
	},
	{
		id: 5,
		name: "HRRN",
	},
	{
		id: 6,
		name: "Custom",
	},
] as const;

export type TMethod = typeof SCHEDULE_METHOD[number]["name"];

export type TCPUType = "P" | "E";

export interface TProcess {
	burstTime: number;
	arrivalTime: number;
}
