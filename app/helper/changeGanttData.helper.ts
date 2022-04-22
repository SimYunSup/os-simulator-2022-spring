export interface THistory {
	id: number;
	startTime: number;
	endTime: number;
}

export default function changeGanttData(historyArray: Array<Array<number>>) {
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
