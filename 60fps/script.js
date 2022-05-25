
const show = Show.start({paused: true, speed: 100.0})

let global = {
	lines: [1],
	colour: 0,
}

const COLOURS = [
	Colour.Green,
	Colour.Blue,
	Colour.Red,
	/*Colour.Yellow,
	Colour.Orange,
	Colour.Cyan,
	Colour.Rose,*/
]

const FONT_SIZE = 30
const LINE_HEIGHT = 40
const LETTER_SPACING = 30
const OFFSET_Y = 500
const FONT_GROWTH = 0

show.resize = (context) => {
	//global.colour = Random.Uint8 % COLOURS.length
	context.fillStyle = COLOURS[global.colour]
}

show.tick = (context) => {

	/*global.colour++
	if (global.colour >= COLOURS.length) global.colour = 0*/
	context.fillStyle = COLOURS[global.colour]
	context.globalAlpha = 0.01
	context.filter = "blur(100px)"
	context.font = `${FONT_SIZE + global.lines.last * FONT_GROWTH}px Rosario`

	
	let x = context.canvas.width/60 * (global.lines.last-1)
	let y = Math.sin(global.lines.last / 30 + (global.lines.length*Math.PI/3*2 * 1.0001 + (Math.random() - 0.5) * 1)) * -400
	
	//const x = Math.random() * context.canvas.width
	//const y = Math.random() * context.canvas.height

	const s = 200
	context.fillRect(x, y + context.canvas.height/2 - s/2, s, s)

	global.lines[global.lines.length-1]++

	if (global.lines.last > 60) {
		global.lines.push(1)
		global.colour++
		if (global.colour >= COLOURS.length) global.colour = 0
		context.fillStyle = COLOURS[global.colour]
	}

	if (Mouse.Left) {
		context.fillStyle = Colour.Black
		context.globalAlpha = 1.0
		const cs = s
		context.filter = "blur(20px)"
		context.fillRect(Mouse.position[0] - cs/2 + (Math.random()-0.5) * s, Mouse.position[1] - cs/2 + (Math.random()-0.5) * s, cs, cs)
	}

}