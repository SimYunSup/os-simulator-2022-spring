import type { TProcess } from "@app/types/method.interface";

export type TNamedProcess = TProcess & { id: number };

export type TCurrentTask = {
	remainedTime: number;
	process: TNamedProcess;
};

const scheduleFCFS = (
	processData: Array<TNamedProcess>,
	queue: Array<Array<TNamedProcess>>,
	currentTask: Array<TCurrentTask | null>,
	currentTime: number
) => {
	// currentTask.forEach((task) => {
	// 	if()
	// });
	const nextTasks = currentTask.map((task) => {
		if (!task || task.remainedTime === 0) {
			return null;
		}
		return task;
	});
	processData
		.filter((process) => process.arrivalTime === currentTime)
		.forEach((process, index) => {
			queue[index % queue.length].push(process);
		});
	currentTask = nextTasks.map((task, index) => {
		if (task === null) {
			const nextTask = queue[index].shift() as TNamedProcess | undefined;
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
};

const scheduleRR = (
	queue: Array<Array<TNamedProcess>>,
	currentTask: Array<TCurrentTask | null>,
	currentTime: number
) => {};

export { scheduleFCFS, scheduleRR };
