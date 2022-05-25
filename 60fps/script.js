
const show = Show.start({paused: true})

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

	context.font = `${FONT_SIZE + global.lines.last * FONT_GROWTH}px Rosario`

	
	let x = context.canvas.width/60 * (global.lines.last-1)
	let y = Math.sin(global.lines.last / 20 + global.lines.length) * -400
	
	//const x = Math.random() * context.canvas.width
	//const y = Math.random() * context.canvas.height

	context.fillText(global.lines.last, x, y + context.canvas.height/2)

	global.lines[global.lines.length-1]++

	if (global.lines.last > 60) {
		global.lines.push(1)
		global.colour++
		if (global.colour >= COLOURS.length) global.colour = 0
		context.fillStyle = COLOURS[global.colour]
	}

}