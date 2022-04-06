<script lang="ts">
	import { SCHEDULE_METHOD } from "@app/types/method.interface";
	import type { TMethod } from "@app/types/method.interface";
	import { state, send, service } from "@app/store/schedule.store";

	let selectedMethod: TMethod = SCHEDULE_METHOD[0].name;
	let quantum: string;
	service.onTransition((state) => {
		if (state.matches("setup.pending.type.idle")) {
			send({
				type: "send.type",
				payload: {
					type: selectedMethod,
					quantum,
				},
			});
		}
	});
</script>

<header class="header">
	<div class="header__content">
		<select bind:value={selectedMethod}>
			{#each SCHEDULE_METHOD as { name }}
				<option value={name}>{name}</option>
			{/each}
		</select>
		<input
			type="number"
			disabled={selectedMethod !== "RR"}
			bind:value={quantum}
		/>
		<button
			disabled={!$state.matches("setup.idle")}
			class="header__button"
			on:click={() => send({ type: "submit" })}
		>
			{$state.matches("setup.idle") ? "start" : "waiting"}
		</button>
	</div>
</header>

<style lang="scss">
	@import "./header.scss";
</style>
