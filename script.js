/**
 * Fluid UI Art Synthesizer + Interactive Audio (Tone.js)
 * Demonstrating the power of Min & Max across HTML, CSS, and JS
 */
/* Code Writed by: holasoymalva */

const root = document.documentElement;

// Elements
const artboardWrapper = document.querySelector(".artboard-wrapper");
const artboard = document.getElementById("artboard");
const cursorBlob = document.getElementById("cursor-blob");
const generateBtn = document.getElementById("generate-btn");
const orbCountInput = document.getElementById("orb-count");
const fpsDisplay = document.getElementById("fps-display");
const audioStatus = document.getElementById("audio-status");
const fullscreenBtn = document.getElementById("fullscreen-btn");
const fsIcon = document.getElementById("fs-icon");

// Controls
const ctrlHue = document.getElementById("hue-ctrl");
const ctrlSize = document.getElementById("size-ctrl");
const ctrlBlur = document.getElementById("blur-ctrl");
const ctrlSpeed = document.getElementById("speed-ctrl");

// Outputs
const outHue = document.getElementById("hue-out");
const outSize = document.getElementById("size-out");
const outBlur = document.getElementById("blur-out");
const outSpeed = document.getElementById("speed-out");
const svgBlur = document.getElementById("svg-blur");

let orbs = [];
const activeCollisions = new Set();
// Metrics
let cursorX = window.innerWidth / 2;
let cursorY = window.innerHeight / 2;
let targetX = cursorX;
let targetY = cursorY;

// Audio variables
let isAudioInitialized = false;
let isAudioPlaying = false;
let fmSynth, filter, pingPong, reverb, lfo, pluckSynth;
// A pleasant pentatonic scale for the interactive cursor
const scale = [
	"C3",
	"D3",
	"E3",
	"G3",
	"A3",
	"C4",
	"D4",
	"E4",
	"G4",
	"A4",
	"C5",
	"D5",
	"E5",
	"G5",
	"A5"
];
let currentNoteIndex = -1;

// FPS calculation
let lastTime = performance.now();
let frames = 0;

function calculateFPS(now) {
	frames++;
	if (now >= lastTime + 1000) {
		fpsDisplay.textContent = `${frames} FPS`;
		frames = 0;
		lastTime = now;
	}
}

/**
 * 0. Initialize Web Audio API and Tone.js
 */
async function initAudio() {
	await Tone.start();

	// Create an immersive ambient synthesizer
	fmSynth = new Tone.PolySynth(Tone.FMSynth, {
		harmonicity: 2,
		modulationIndex: 10,
		oscillator: { type: "sine" },
		envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 1.5 },
		modulation: { type: "square" },
		modulationEnvelope: { attack: 0.1, decay: 0.2, sustain: 1, release: 0.5 }
	});

	// Create interactive collision synth
	pluckSynth = new Tone.PolySynth(Tone.MembraneSynth, {
		pitchDecay: 0.05,
		octaves: 4,
		oscillator: { type: "sine" },
		envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
	});

	// Create effects
	filter = new Tone.Filter(1500, "lowpass");
	pingPong = new Tone.PingPongDelay("8n", 0.4);

	// Using Freeverb as it operates synchronously and removes async buffer fetching/generation issues
	reverb = new Tone.Freeverb({
		roomSize: 0.8,
		dampening: 2000
	});
	reverb.wet.value = 0.5;

	// An LFO to give the filter an organic panning/breathing feel
	lfo = new Tone.LFO("0.1hz", 400, 2000).connect(filter.frequency);
	lfo.start();

	// Chain it all to the master output
	fmSynth.chain(filter, pingPong, reverb, Tone.Destination);
	pluckSynth.chain(filter, reverb, Tone.Destination);

	Tone.Transport.start();

	isAudioInitialized = true;
}

// Auto-start audio on the very first physical interaction (Browser requirement policy)
let authInteractionDone = false;
async function handleFirstInteraction() {
	if (authInteractionDone) return;

	// In strict browsers like Safari/Chrome, start needs to be called inside the event loop
	if (Tone.context.state !== "running") {
		await Tone.start();
	}

	authInteractionDone = true;

	// Remove listeners so it doesn't trigger again
	document.removeEventListener("mousedown", handleFirstInteraction);
	document.removeEventListener("touchstart", handleFirstInteraction);
	document.removeEventListener("keydown", handleFirstInteraction);

	// Automatically turn on audio if not initialized yet
	if (!isAudioInitialized) {
		try {
			await initAudio();
			isAudioPlaying = true;

			// Visual feedback
			audioStatus.textContent = "🔊 Audio: ON";
			audioStatus.style.opacity = "1";

			// Play a background ambient chord immediately
			fmSynth.triggerAttack(["C3", "G3"], Tone.now(), 0.1);
		} catch (e) {
			console.error(e);
			authInteractionDone = false; // allow retry
			audioStatus.textContent = "❌ Audio Error";
		}
	}
}

document.addEventListener("mousedown", handleFirstInteraction);
document.addEventListener("touchstart", handleFirstInteraction);
document.addEventListener("keydown", handleFirstInteraction);

// Map HTML inputs to Audio params
function updateAudioParams() {
	if (!isAudioInitialized) return;

	const hue = parseInt(ctrlHue.value);
	const size = parseInt(ctrlSize.value);
	const blur = parseInt(ctrlBlur.value);
	const speed = parseFloat(ctrlSpeed.value);

	// Hue changes the harmonicity (timbre) of the FM Synth
	// We boundary this with Min and Max
	const harmonicity = Math.max(0.5, Math.min(5, hue / 60));
	fmSynth.set({ harmonicity: harmonicity });

	// Blob size controls the reverb "wetness" (space size)
	// Map 50-250 to 0.1 - 0.9 (Using Math.max/min for absolute bounds)
	const reverbWet = Math.max(0.1, Math.min(0.9, (size - 50) / 200));
	reverb.wet.value = reverbWet;

	// Viscosity (Blur) changes the delay feedback
	// Map 5-30 to 0.1 - 0.8
	const delayFeedback = Math.max(0.1, Math.min(0.8, (blur - 5) / 25));
	pingPong.feedback.value = delayFeedback;

	// Speed modifies the LFO rate breathing the filter
	const lfoRate = Math.max(0.05, Math.min(5, speed * 0.5));
	lfo.frequency.value = lfoRate;
}

/**
 * 1. Initialize Event Listeners for HTML Range Inputs
 */
function initControls() {
	// Modular function to handle UI + Audio updates simultaneously
	const handleSliderChange = (e, cssVar, outEl, formatter = (v) => v) => {
		const val = e.target.value;
		root.style.setProperty(cssVar, formatter(val));
		outEl.textContent = formatter(val);
		updateAudioParams();
	};

	ctrlHue.addEventListener("input", (e) =>
		handleSliderChange(e, "--hue", outHue)
	);
	ctrlSize.addEventListener("input", (e) =>
		handleSliderChange(e, "--blob-size", outSize, (v) => `${v}px`)
	);

	// Blur uses SVG attribute
	ctrlBlur.addEventListener("input", (e) => {
		const val = e.target.value;
		svgBlur.setAttribute("stdDeviation", val);
		outBlur.textContent = val;
		updateAudioParams();
	});

	// Speed uses custom calculation
	ctrlSpeed.addEventListener("input", (e) => {
		const speedMultiplier = parseFloat(e.target.value);
		const safeMultiplier = Math.max(0.01, speedMultiplier);

		root.style.setProperty(
			"--anim-speed",
			`${(20 / safeMultiplier).toFixed(1)}s`
		);
		outSpeed.textContent = `${speedMultiplier.toFixed(1)}x`;

		orbs.forEach((orb) => {
			const currentDuration = parseFloat(orb.dataset.baseDuration);
			if (currentDuration) {
				orb.style.animationDuration = `${currentDuration / safeMultiplier}s`;
				orb.getAnimations().forEach((anim) => {
					anim.playbackRate = safeMultiplier;
				});
			}
		});
		updateAudioParams();
	});

	// Generate Orbs
	generateBtn.addEventListener("click", () => {
		const requested = parseInt(orbCountInput.value, 10);
		const minAllowed = parseInt(orbCountInput.getAttribute("min"), 10);
		const maxAllowed = parseInt(orbCountInput.getAttribute("max"), 10);

		// Use Math.min and Math.max to CLAMP the value
		const safeCount = Math.max(minAllowed, Math.min(requested, maxAllowed));

		orbCountInput.value = safeCount;
		spawnOrbs(safeCount);

		if (isAudioPlaying) {
			// Little "chime" effect when spawning new orbs
			fmSynth.triggerAttackRelease("C5", "8n");
		}
	});

	// Fullscreen Toggle
	fullscreenBtn.addEventListener("click", (e) => {
		e.stopPropagation(); // Avoid triggering Tone.js interaction on button
		const isFS = artboardWrapper.classList.toggle("is-fullscreen");
		const path = fsIcon.querySelector("path");

		if (isFS) {
			// Shrink icon
			path.setAttribute("d", "M8 3v3h-3m14-3v3h3m-14 14v-3h-3m14 3v-3h3");
		} else {
			// Expand icon
			path.setAttribute(
				"d",
				"M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
			);
		}

		// After jelly animation completes, recenter the visual coordinates via min/max calculation
		setTimeout(() => {
			const rect = artboardWrapper.getBoundingClientRect();
			targetX = rect.width / 2;
			targetY = rect.height / 2;
		}, 850);
	});
}

/**
 * 2. Interactive Object following cursor
 */
function initInteractiveBlob() {
	const handleMove = (x, y) => {
		const rect = artboardWrapper.getBoundingClientRect();
		targetX = x - rect.left;
		targetY = y - rect.top;

		// Map cursor position to musical notes if audio is playing!
		if (isAudioPlaying) {
			// Find note index based on Y axis (inverted, higher = higher pitch)
			const normalizedY = 1 - Math.max(0, Math.min(1, targetY / rect.height));
			// Ensure index is within the scale bounds using Min and Max
			const noteIndex = Math.max(
				0,
				Math.min(scale.length - 1, Math.floor(normalizedY * scale.length))
			);

			// X axis controls a temporary filter boost
			const normalizedX = Math.max(0, Math.min(1, targetX / rect.width));
			filter.frequency.rampTo(500 + normalizedX * 4000, 0.1);

			// If mouse moved enough to change note, play it
			if (noteIndex !== currentNoteIndex) {
				if (currentNoteIndex !== -1) {
					fmSynth.triggerRelease(scale[currentNoteIndex]);
				}
				fmSynth.triggerAttack(scale[noteIndex], Tone.now(), 0.3); // 0.3 velocity (volume)
				currentNoteIndex = noteIndex;
			}
		}
	};

	artboardWrapper.addEventListener("mousemove", (e) =>
		handleMove(e.clientX, e.clientY)
	);

	artboardWrapper.addEventListener(
		"touchmove",
		(e) => {
			e.preventDefault();
			handleMove(e.touches[0].clientX, e.touches[0].clientY);
		},
		{ passive: false }
	);

	artboardWrapper.addEventListener("mouseleave", () => {
		const rect = artboardWrapper.getBoundingClientRect();
		targetX = rect.width / 2;
		targetY = rect.height / 2;

		if (isAudioPlaying && currentNoteIndex !== -1) {
			fmSynth.triggerRelease(scale[currentNoteIndex]);
			currentNoteIndex = -1;
			// Restore filter based on audio LFO
			filter.frequency.rampTo(1500, 0.5);
		}
	});

	// Run animation loop
	function animate(now) {
		calculateFPS(now);

		cursorX += (targetX - cursorX) * 0.15;
		cursorY += (targetY - cursorY) * 0.15;

		const artboardRect = artboardWrapper.getBoundingClientRect();

		// BOUNDING CHECK via JS Max and Min
		const padding = 20;
		const constrainedX = Math.max(
			padding,
			Math.min(cursorX, artboardRect.width - padding)
		);
		const constrainedY = Math.max(
			padding,
			Math.min(cursorY, artboardRect.height - padding)
		);

		cursorBlob.style.transform = `translate(${constrainedX}px, ${constrainedY}px)`;

		// Collision logic with orbs
		const cursorRect = cursorBlob.getBoundingClientRect();
		const cursorCenterX = cursorRect.left + cursorRect.width / 2;
		const cursorCenterY = cursorRect.top + cursorRect.height / 2;

		orbs.forEach((orb) => {
			const orbRect = orb.getBoundingClientRect();
			const orbCenterX = orbRect.left + orbRect.width / 2;
			const orbCenterY = orbRect.top + orbRect.height / 2;

			// Calculate distance using hypotenuse
			const distance = Math.hypot(
				cursorCenterX - orbCenterX,
				cursorCenterY - orbCenterY
			);
			// Dynamic collision threshold based on element radii
			const threshold = cursorRect.width / 2 + orbRect.width / 2;

			// If elements touch
			if (distance < threshold) {
				if (!orb.classList.contains("collided")) {
					orb.classList.add("collided"); // Prevent multiple triggers

					// Visual reaction
					orb.style.filter = "brightness(1.5)";
					setTimeout(() => (orb.style.filter = "none"), 300);

					// Audio reaction
					if (isAudioPlaying) {
						// Pick a random note from pentatonic scale to pluck
						const randomNote = scale[Math.floor(Math.random() * scale.length)];

						// Volume based on Min distance (deeper collision = louder pluck)
						const velocity = Math.max(0.2, Math.min(1, 1 - distance / threshold));
						pluckSynth.triggerAttackRelease(randomNote, "8n", "+0", velocity);
					}
				}
			} else {
				// Reset state when they separate
				orb.classList.remove("collided");
			}
		});

		// --- NEW: Orb-to-Orb Colisions (Harmonic interactions) --- //
		for (let i = 0; i < orbs.length; i++) {
			for (let j = i + 1; j < orbs.length; j++) {
				const orbA = orbs[i];
				const orbB = orbs[j];

				const rectA = orbA.getBoundingClientRect();
				const rectB = orbB.getBoundingClientRect();

				const centerAX = rectA.left + rectA.width / 2;
				const centerAY = rectA.top + rectA.height / 2;
				const centerBX = rectB.left + rectB.width / 2;
				const centerBY = rectB.top + rectB.height / 2;

				const distance = Math.hypot(centerAX - centerBX, centerAY - centerBY);
				const threshold = Math.max(20, rectA.width / 2 + rectB.width / 2);

				const pairKey = `${orbA.dataset.id}-${orbB.dataset.id}`;

				if (distance < threshold) {
					if (!activeCollisions.has(pairKey)) {
						activeCollisions.add(pairKey);

						// Visual reaction to orb collision
						orbA.style.filter = "brightness(1.5)";
						orbB.style.filter = "brightness(1.5)";
						setTimeout(() => {
							orbA.style.filter = "none";
							orbB.style.filter = "none";
						}, 300);

						// Audio reaction: Play a harmonious chord when they merge
						if (isAudioPlaying) {
							// Pick two notes apart to create harmony, bounded safely by Min/Max
							const noteAIndex = Math.floor(
								Math.max(0, Math.min(scale.length - 1, Math.random() * scale.length))
							);
							const offset = Math.max(1, Math.min(3, Math.floor(Math.random() * 4))); // 1 to 3 notes apart
							const noteBIndex = Math.min(scale.length - 1, noteAIndex + offset);

							// Volume lowered slightly for chords, based on collision depth
							const velocity = Math.max(0.05, Math.min(0.3, 1 - distance / threshold));
							pluckSynth.triggerAttackRelease(
								[scale[noteAIndex], scale[noteBIndex]],
								"8n",
								"+0",
								velocity
							);
						}
					}
				} else {
					activeCollisions.delete(pairKey);
				}
			}
		}

		requestAnimationFrame(animate);
	}
	requestAnimationFrame(animate);
}

/**
 * 3. Spawn floating orbs
 */
function spawnOrbs(count) {
	orbs.forEach((orb) => orb.remove());
	orbs = [];

	for (let i = 0; i < count; i++) {
		const orb = document.createElement("div");
		orb.dataset.id = `orb-${i}`;
		orb.classList.add("blob", "orb");

		const size = Math.max(20, Math.random() * 80);
		orb.style.width = `${size}px`;
		orb.style.height = `${size}px`;
		orb.style.left = `${Math.random() * 100}%`;
		orb.style.top = `${Math.random() * 100}%`;

		const hueOffset = i % 2 === 0 ? -30 : 45;
		orb.style.background = `hsl(calc(var(--hue) + ${hueOffset}), 80%, 60%)`;
		orb.style.boxShadow = `0 0 20px hsl(calc(var(--hue) + ${hueOffset}), 80%, 50%)`;

		artboard.appendChild(orb);
		orbs.push(orb);

		const baseDuration = Math.random() * 10 + 10;
		orb.dataset.baseDuration = baseDuration;

		const xDist =
			(Math.random() > 0.5 ? 1 : -1) * Math.max(50, Math.random() * 250);
		const yDist =
			(Math.random() > 0.5 ? 1 : -1) * Math.max(50, Math.random() * 250);

		const anim = orb.animate(
			[
				{ transform: "translate(0, 0) scale(1)" },
				{
					transform: `translate(${xDist}px, ${yDist}px) scale(${Math.max(
						0.6,
						Math.random() * 1.5
					)})`
				}
			],
			{
				duration: baseDuration * 1000,
				iterations: Infinity,
				direction: "alternate",
				easing: "ease-in-out"
			}
		);

		anim.playbackRate = Math.max(0.01, parseFloat(ctrlSpeed.value));
	}
}

// Initialization
document.addEventListener("DOMContentLoaded", () => {
	initControls();

	const rect = artboardWrapper.getBoundingClientRect();
	targetX = rect.width / 2;
	targetY = rect.height / 2;
	cursorX = targetX;
	cursorY = targetY;

	initInteractiveBlob();
	spawnOrbs(parseInt(orbCountInput.value, 10));
});