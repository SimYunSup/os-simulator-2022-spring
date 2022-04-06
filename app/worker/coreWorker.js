class Core {
	waitingWattValue = 0.1;

	constructor(WsValue, performance) {
		this.WsValue = WsValue;
		this.performance = performance;
	}

	process(burstTime) {
		return {
			value:
				burstTime - this.performance > 0
					? burstTime - this.performance
					: 0,
			wattValue:
				(burstTime > 0 ? this.WsValue : 0) + this.waitingWattValue,
		};
	}
}

class PCore extends Core {
	constructor() {
		super(3, 2);
	}
}
class ECore extends Core {
	constructor() {
		super(1, 1);
	}
}

let core;

self.addEventListener("message", (e) => {
	if (e.type !== "setup") {
		return;
	}
	if (e.value === "P") {
		core = new PCore();
	} else if (e.value === "E") {
		core = new ECore();
	}
});
self.addEventListener("message", (e) => {
	if (e.type !== "processing") {
		return;
	}

	setTimeout(() => {
		const data = core.process(e.value);
		self.postMessage(data);
	}, 1000);
});
