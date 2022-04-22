<script lang="ts">
	import { SCHEDULE_METHOD } from "@app/types/method.interface";
	import type { TMethod } from "@app/types/method.interface";
	import { state, send, service } from "@app/store/schedule.store";

	let selectedMethod: TMethod = SCHEDULE_METHOD[0].name;
	let quantum = 2;
	let executionTime = 1000;
	service.onTransition((state) => {
		if (state.matches("setup.pending.type.idle")) {
			send({
				type: "send.type",
				payload: {
					type: selectedMethod,
					quantum,
					executionTime,
				},
			});
		}
	});
</script>

<header class="header">
	<div class="header__content row">
		<div class="input-field col s6">
			<select bind:value={selectedMethod}>
				{#each SCHEDULE_METHOD as { name }}
					<option value={name}>{name}</option>
				{/each}
			</select>
		</div>
		<div class="input-field col s3">
			<input
				type="number"
				disabled={selectedMethod !== "RR"}
				bind:value={quantum}
			/>
			<label>Time Quantum</label>
		</div>
		<div class="input-field col s3">
			<input type="number" bind:value={executionTime} />
			<label>Execution Time</label>
		</div>
		<div class="input-field col s2">
			<button
				disabled={!$state.matches("setup.idle")}
				class="waves-effect waves-light btn btn-large"
				on:click={() => send({ type: "submit" })}
			>
				{$state.matches("setup.idle") ? "start" : "waiting"}
			</button>
		</div>
	</div>
</header>

<style lang="scss">
	@import "./header.scss";
</style>
