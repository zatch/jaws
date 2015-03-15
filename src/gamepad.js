var jaws = (function(jaws) {

var inputMap = {
	"default": {
		"joysticks": {
			"left" : { x: 0, y: 1 },
			"right": { x: 2, y: 3 }
		}
	},
	"Xbox 360": {
		"joysticks": {
			"left" : { x: 0, y: 1 },
			"right": { x: 2, y: 3 }
		}
	}
};

// Account for inputs that are mapped incorrectly by the browser.
if (navigator.userAgent.indexOf('Firefox') !== -1) {
	inputMap["Xbox 360"].joysticks = {
		"left" : { x: 1, y: 0 },
		"right": { x: 3, y: 2 }
	};
}

var browserGamepads;
var gamepads = {};
var gamepadTypes = ["Xbox 360"];
var connectMethod;

function addGamepad(gamepad) {
	for (var lcv = 0; lcv < gamepadTypes.length; lcv++) {
		if (gamepad.id.toLowerCase().indexOf(gamepadTypes[lcv].toLowerCase()) !== -1) {
			// Modify Gamepad object
			gamepad.type = gamepadTypes[lcv];
		}
	}
	if (!gamepad.type) { gamepad.type = "default"; }
	
	gamepads[gamepad.index] = gamepad;
	console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
	gamepad.index, gamepad.id,
	gamepad.buttons.length, gamepad.axes.length);
	
	console.log(gamepads);
}

function removeGamepad(gamepad) {
	delete gamepads[gamepad.index];
}

function connectHandler(e) {
	addGamepad(e.gamepad);
}

function disconnectHandler(e) {
	removeGamepad(e.gamepad);
}

function scanGamepads() {
	browserGamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
	for (var i = 0; i < browserGamepads.length; i++) {
		if (browserGamepads[i]) {
			if (!(browserGamepads[i].index in gamepads)) {
				addGamepad(browserGamepads[i]);
			} else {
				gamepads[browserGamepads[i].index] = browserGamepads[i];
			}
		}
	}
}
	
/** @private
 * Start listening for gamepads.
 */
jaws.setupGamepadSupport = function(fps) {
	// Chrome doesn't implement Gamepad events (yet?).
	connectMethod = (navigator.webkitGetGamepads || navigator.getGamepads) ? "poll" : "event";
	
	if (connectMethod === "event") {
		window.addEventListener("gamepadconnected", connectHandler);
		window.addEventListener("gamepaddisconnected", disconnectHandler);
	}
};

jaws.updateGamepads = function() {
	if (connectMethod === "poll") {
		scanGamepads();
	}
};

jaws.gamepadButtonPressed = function(button) {
	if (typeof(button) == "object") {
		return button.pressed;
	}
	return button == 1.0;
};

jaws.gamepadReadJoystick = function(gamepad, joystick) {
	// Accept either a Gamepad object or index.
	if (typeof(gamepad) !== "object") { gamepad = gamepads[gamepad]; }
	if (typeof(options) !== "object") { options = []; }
	
	var mappings = inputMap[gamepad.type].joysticks[joystick];
	var analogX = gamepad.axes[mappings.x];
	var analogY = gamepad.axes[mappings.y];
	
	var angle = Math.atan2(analogX, analogY);
	var magnitude = Math.sqrt(analogX*analogX+analogY*analogY);
	
	return {
		analogX: analogX,
		analogY: analogY,
		angle: angle,
		magnitude: magnitude
	};
};

jaws.gamepads = gamepads;

return jaws;
})(jaws || {});
