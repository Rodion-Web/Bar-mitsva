const form = document.querySelector("#rsvpForm");
const attendanceInputs = document.querySelectorAll('input[name="attendance"]');
const companyInputs = document.querySelectorAll('input[name="company"]');
const guestDetails = document.querySelector("#guestDetails");
const guestList = document.querySelector("#guestList");
const guestInputs = document.querySelector("#guestInputs");
const addGuestButton = document.querySelector("#addGuest");
const formMessage = document.querySelector("#formMessage");
const splashScreen = document.querySelector("#splashScreen");
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx1BZHFDjMuwfaNELCbGEoJg5Mb_lOLfgWQH8Ylr2KyAY5_9aC1Rng_vzBnlgdWd6lDfw/exec";

const revealItems = document.querySelectorAll(".section-pad, footer");
if ("IntersectionObserver" in window) {
	revealItems.forEach((item) => item.classList.add("reveal"));
	const revealObserver = new IntersectionObserver(
		(entries, observer) => {
			entries.forEach((entry) => {
				if (!entry.isIntersecting) return;
				entry.target.classList.add("is-visible");
				observer.unobserve(entry.target);
			});
		},
		{ threshold: 0.12 },
	);
	revealItems.forEach((item) => revealObserver.observe(item));
}

window.setTimeout(() => {
	if (!splashScreen) return;
	splashScreen.classList.add("is-closing");
	splashScreen.addEventListener("transitionend", () => splashScreen.remove(), { once: true });
	window.setTimeout(() => splashScreen.remove(), 1000);
}, 2800);

attendanceInputs.forEach((input) => {
	input.addEventListener("change", () => {
		const isAttending = input.value === "yes" && input.checked;
		guestDetails.hidden = !isAttending;
		if (!isAttending) {
			guestList.hidden = true;
			guestInputs.replaceChildren();
		}
	});
});

function addGuest() {
	const guestRow = document.createElement("div");
	guestRow.className = "guest-row";
	guestRow.innerHTML = `
		<label>ФИО гостя<input type="text" name="guest" placeholder="Имя и фамилия" required /></label>
		<button type="button" class="remove-guest" aria-label="Удалить гостя">×</button>`;
	guestRow.querySelector(".remove-guest").addEventListener("click", () => {
		guestRow.remove();
		if (!guestInputs.children.length) addGuest();
	});
	guestInputs.append(guestRow);
}

companyInputs.forEach((input) => {
	input.addEventListener("change", () => {
		const hasGuests = input.value === "with-guests" && input.checked;
		guestList.hidden = !hasGuests;
		if (hasGuests && !guestInputs.children.length) addGuest();
		if (!hasGuests) guestInputs.replaceChildren();
	});
});

addGuestButton.addEventListener("click", addGuest);

form.addEventListener("submit", async (event) => {
	event.preventDefault();
	const data = new FormData(form);
	const name = data.get("name");
	const attendance = data.get("attendance");
	const submitButton = form.querySelector("button[type='submit']");
	const payload = {
		name,
		phone: data.get("phone"),
		attendance,
		company: data.get("company") || "",
		guests: data
			.getAll("guest")
			.map((guest) => guest.trim())
			.filter(Boolean),
	};

	if (!GOOGLE_APPS_SCRIPT_URL) {
		formMessage.textContent = "Форма ещё не подключена к таблице Google Drive.";
		return;
	}

	submitButton.disabled = true;
	submitButton.textContent = "Отправляем…";
	try {
		await fetch(GOOGLE_APPS_SCRIPT_URL, {
			method: "POST",
			mode: "no-cors",
			headers: { "Content-Type": "text/plain;charset=utf-8" },
			body: JSON.stringify(payload),
		});
		formMessage.textContent = attendance === "yes" ? `Спасибо, ${name}! Будем ждать вас 8 октября.` : `Спасибо, ${name}! Жаль,что у вас не получается присутствовать.`;
		form.reset();
		guestDetails.hidden = true;
		guestList.hidden = true;
		guestInputs.replaceChildren();
	} catch {
		formMessage.textContent = "Не удалось отправить ответ. Попробуйте ещё раз.";
	} finally {
		submitButton.disabled = false;
		submitButton.innerHTML = "Отправить ответ <span>↗</span>";
	}
});
