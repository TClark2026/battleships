import Toastify from "toastify-js";

export function showErrorToast(message: string) {
	Toastify({
		text: message,
		duration: 2000,
		close: true,
		gravity: "top",
		position: "center",
		style: {
			background: "#d9534f",
		},
		stopOnFocus: true,
	}).showToast();
}

export function showInfoToast(message: string) {
	Toastify({
		text: message,
		duration: 4000,
		close: true,
		gravity: "top",
		position: "center",
		style: {
			background: "#0496C7",
		},
		stopOnFocus: true,
	}).showToast();
}

export function showWarnToast(message: string) {
	Toastify({
		text: message,
		duration: 4000,
		close: true,
		gravity: "top",
		position: "center",
		style: {
			background: "#ff5000",
		},
		stopOnFocus: true,
	}).showToast();
}

export function showGameToast(message: string) {
	Toastify({
		text: message,
		duration: 4000,
		close: true,
		gravity: "top",
		position: "center",
		style: {
			background: "#e0e3c8",
			color: "#000000",
		},
		stopOnFocus: true,
	}).showToast();
}

export function showVictoryToast(message: string) {
	Toastify({
		text: message,
		duration: -1,
		close: true,
		gravity: "top",
		position: "center",
		stopOnFocus: true,
		style: {
			background: "#FFD235",
			padding: "1.25rem 2rem",
			fontSize: "1.125rem",
			fontWeight: "600",
			borderRadius: "0.75rem",
			maxWidth: "37.5rem",
			color: "#000000",
		},
	}).showToast();
}

export function showDefeatToast(message: string) {
	Toastify({
		text: message,
		duration: -1,
		close: true,
		gravity: "top",
		position: "center",
		stopOnFocus: true,
		style: {
			background: "#B3261E",
			padding: "1.25rem 2rem",
			fontSize: "1.125rem",
			fontWeight: "600",
			borderRadius: "0.75rem",
			maxWidth: "37.5rem",
		},
	}).showToast();
}
