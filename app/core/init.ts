/**
 * Svelte Init
 * =====================
 * Create svelte app
 *
 * @contributors: Patryk Rzucidło [@ptkdev] <support@ptkdev.io> (https://ptk.dev)
 *
 * @license: MIT License
 *
 */
import App from "@app/pages/index/index.svelte";
import "../../node_modules/materialize-css/dist/css/materialize.css";

// import js stuff too
import "../../node_modules/materialize-css/dist/js/materialize";

const app = new App({
	target: document.body,
});

export default app;
