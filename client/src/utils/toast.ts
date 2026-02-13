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
