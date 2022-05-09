//========//
// COLOUR //
//========//
let COLOURS = [
	Colour.Black,
	Colour.Blue,
	Colour.Cyan,
	Colour.Green,
	Colour.Grey,
	Colour.Orange,
	Colour.Pink,
	Colour.Purple,
	Colour.Red,
	Colour.Rose,
	Colour.Silver,
	Colour.White,
	Colour.Yellow
]

const COLOUR_ON_OBJ = COLOURS[Random.Uint8 % COLOURS.length]
COLOURS = COLOURS.filter(c => c !== COLOUR_ON_OBJ)
const COLOUR_OFF_OBJ = COLOURS[Random.Uint8 % COLOURS.length]
COLOURS = COLOURS.filter(c => c !== COLOUR_OFF_OBJ)
const COLOUR_ANT_OBJ = COLOURS[Random.Uint8 % COLOURS.length]

const COLOUR_ON = [COLOUR_ON_OBJ.r, COLOUR_ON_OBJ.g, COLOUR_ON_OBJ.b, 255]
const COLOUR_OFF = [COLOUR_OFF_OBJ.r, COLOUR_OFF_OBJ.g, COLOUR_OFF_OBJ.b, 255]
const COLOUR_ANT = [COLOUR_ANT_OBJ.r, COLOUR_ANT_OBJ.g, COLOUR_ANT_OBJ.b, 255]

//===============//
// NEIGHBOURHOOD //
//===============//
const NEIGHBOURHOOD = [
	[ 0, 0],

	/*[ 1, 0],
	[-1, 0],
	[ 0, 1],
	[ 0,-1],*/
	
	/*[ 1, 1],
	[-1,-1],
	[-1, 1],
	[ 1,-1],*/
]

const MOVEMENT_NEIGHBOURHOOD = [
	//[ 1, 0],
	//[ 0, 1],
	[-1, 0],
	//[ 0,-1],
]

//========//
// CONFIG //
//========//
const WORLD_WIDTH = Math.round(1080 / 8)
const WORLD_HEIGHT = WORLD_WIDTH

//=========//
// GLOBALS //
//=========//
const world = new Map()
const show = Show.start({speed: 1.0})
let skip = 1
let skipOffset = 0
let clock = 0
let isDrawFrame = true
let t = true
let brushSize = 0

//======//
// CELL //
//======//
const makeCell = (x, y) => {

	const cell = {
		x,
		y,
		elementTick: ELEMENT_OFF,
		elementTock: ELEMENT_OFF,
		neighbourhood: [],
		movementNeighbourhood: [],
		scoreTick: 0,
		scoreTock: 0,
		drawnElement: ELEMENT_OFF,
		age: 0,
	}

	return cell
}

const getCellKey = (x, y) => `${x},${y}`
const getCellPosition = (key) => key.split(",").map(n => parseInt(n))
const getElementKey = () => t? "elementTick" : "elementTick"
const getNextElementKey = () => t? "elementTick" : "elementTick"
const getScoreKey = () => t? "scoreTick" : "scoreTick"
const getNextScoreKey = () => t? "scoreTick" : "scoreTick"

const linkCell = (cell) => {

	for (const [nx, ny] of NEIGHBOURHOOD) {
		let [x, y] = [cell.x + nx, cell.y + ny]
		if (x < 0) x += WORLD_WIDTH
		if (y < 0) y += WORLD_HEIGHT
		if (x >= WORLD_WIDTH) x -= WORLD_WIDTH
		if (y >= WORLD_HEIGHT) y -= WORLD_HEIGHT
		const key = getCellKey(x, y)
		const neighbour = world.get(key)
		const neighbourhood = neighbour.neighbourhood
		neighbourhood.push(cell)
	}

	for (const [nx, ny] of MOVEMENT_NEIGHBOURHOOD) {
		let [x, y] = [cell.x + nx, cell.y + ny]
		if (x < 0) x += WORLD_WIDTH
		if (y < 0) y += WORLD_HEIGHT
		if (x >= WORLD_WIDTH) x -= WORLD_WIDTH
		if (y >= WORLD_HEIGHT) y -= WORLD_HEIGHT
		const key = getCellKey(x, y)
		const neighbour = world.get(key)
		const neighbourhood = cell.movementNeighbourhood
		neighbourhood.push(neighbour)
	}

}

const drawCell = (context, cell) => {

	if (!isDrawFrame) return

	const nextElementKey = getNextElementKey()
	const element = cell[nextElementKey]
	cell.drawnElement = element

	const width = context.canvas.width / WORLD_WIDTH
	const height = context.canvas.height / WORLD_HEIGHT

	let offset = cell.offset
	let dx = 0

	const data = show.imageData.data

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			data[offset] = element.colour[0]
			data[offset+1] = element.colour[1]
			data[offset+2] = element.colour[2]
			data[offset+3] = element.colour[3]
			offset += 4
			dx += 4
		}
		offset -= dx
		dx = 0
		offset += context.canvas.width * 4
	}

}

const setCell = (context, cell, element, {next = true, update = true} = {}) => {
	
	cell.elementTick = element
	cell.age = clock

	const nextElementKey = next? getNextElementKey() : getElementKey()
	const oldElement = cell[nextElementKey]
	cell[nextElementKey] = element

	// Update neighbour scores
	if (update && element !== oldElement) {

		let dscore = 0
		if (oldElement !== ELEMENT_ON && element === ELEMENT_ON) {
			dscore = 1
		} else if (oldElement === ELEMENT_ON && element !== ELEMENT_ON) {
			dscore = -1
		}
		if (dscore !== 0) {
			const neighbourhood = cell.neighbourhood
			const change = dscore
			const nextScoreKey = next? getNextScoreKey() : getScoreKey()
			for (const neighbour of neighbourhood) {
				neighbour[nextScoreKey] += change
			}
		}
	}

	// Draw
	if (cell.drawnElement !== element) {
		drawCell(context, cell)
	}

}

//=======//
// BRUSH //
//=======//
const paint = (context, element, options) => {
	const {canvas} = context
	const [mx, my] = Mouse.position
	const x = Math.floor((mx - canvas.offsetLeft) / canvas.width * WORLD_WIDTH)
	const y = Math.floor((my - canvas.offsetTop) / canvas.height * WORLD_HEIGHT)
	for (let px = -brushSize; px < brushSize; px++) {
		for (let py = -brushSize; py < brushSize; py++) {
			place(context, x+px, y+py, element)
		}
	}
	if (brushSize === 0) {
		place(context, x, y, element)
	}
}

const place = (context, x, y, element) => {
	if (x < 0) return
	if (y < 0) return
	if (x >= WORLD_WIDTH) return
	if (y >= WORLD_HEIGHT) return
	const key = getCellKey(x, y)
	const cell = world.get(key)
	const target = element
	setCell(context, cell, target)
}

//==========//
// KEYBOARD //
//==========//
const KEYDOWN = {}
on.keydown(e => {
	const handler = KEYDOWN[e.key]
	if (handler === undefined) return
	handler(e)
})


// Randomise world
KEYDOWN["r"] = () => {
	print("...")
	for (const cell of world.values()) {
		const element = oneIn(2)? ELEMENT_ON : ELEMENT_OFF
		setCell(show.context, cell, element, {update: false})
		setCell(show.context, cell, element, {next: false, update: false})
	}
	updateCellScores()
	print("WORLD RANDOMISED")
}

// Clear world
KEYDOWN["c"] = () => {
	print("...")
	for (const cell of world.values()) {
		setCell(show.context, cell, ELEMENT_OFF, {update: false})
		setCell(show.context, cell, ELEMENT_OFF, {next: false, update: false})
	}
	updateCellScores()
	print("WORLD CLEARED")
}

KEYDOWN["1"] = () => show.speed = 0.5
KEYDOWN["2"] = () => show.speed = 1.0
KEYDOWN["3"] = () => show.speed = 2.0
KEYDOWN["4"] = () => show.speed = 4.0

//==========//
// ELEMENTS //
//==========//
const makeElement = ({colour, behave = () => {}, data = {}} = {}) => {
	const element = {colour, behave, data}
	return element
}

const getCellScore = (cell) => {
	const scoreKey = getScoreKey()
	return cell[scoreKey]
}

const behave = (context, cell) => {
	const elementKey = getElementKey()
	const element = cell[elementKey]
	element.behave(context, cell, element)
}

const ELEMENT_OFF = makeElement({
	colour: COLOUR_OFF,
	behave: (context, cell) => {
		if (cell.age !== clock) setCell(context, cell, ELEMENT_OFF)
	}
})

const ELEMENT_ON = makeElement({
	colour: COLOUR_ON,
	behave: (context, cell) => {
		if (cell.age !== clock) setCell(context, cell, ELEMENT_ON)
	}
})

const ELEMENT_ANT = ({direction = 0, above = ELEMENT_OFF} = {}) => makeElement({
	colour: COLOUR_ANT,
	draw: () => {
		// TODO
	},
	data: {direction, above},
	behave: (context, cell, element) => {

		if (cell.age === clock) return

		const newElement = above === ELEMENT_OFF? ELEMENT_ON : ELEMENT_OFF
		setCell(context, cell, newElement)

		const target = cell.movementNeighbourhood[element.data.direction]
		element.data.direction++
		if (element.data.direction >= MOVEMENT_NEIGHBOURHOOD.length) {
			element.data.direction = 0
		}
		setCell(context, target, element)
	},
})

//=======//
// WORLD //
//=======//
const drawWorld = (context) => {
	context.fillStyle = COLOUR_OFF_OBJ
	context.fillRect(0, 0, context.canvas.width, context.canvas.height)
	for (const cell of world.values()) {
		drawCell(context, cell)
	}
}

const getOffset = (context, x, y) => {
	const cellHeight = context.canvas.height / WORLD_HEIGHT
	const cellWidth = context.canvas.width / WORLD_WIDTH

	const yPixel = Math.round(y * cellHeight)
	const xPixel = Math.round(x * cellWidth)

	const pixel = yPixel * context.canvas.width + xPixel

	return pixel * 4
}

const cacheCellOffsets = (context) => {
	for (const cell of world.values()) {
		cell.offset = getOffset(context, cell.x, cell.y)
	}
}

const updateCellScores = () => {

	const elementKey = getElementKey()
	const nextElementKey = getNextElementKey()
	
	const scoreKey = getScoreKey()
	const nextScoreKey = getNextScoreKey()

	for (const cell of world.values()) {
		cell[scoreKey] = 0
		cell[nextScoreKey] = 0
	}

	for (const cell of world.values()) {

		const score = cell[elementKey] === ELEMENT_ON? 1 : 0
		const nextScore = cell[nextElementKey] === ELEMENT_ON? 1 : 0

		const neighbourhood = cell.neighbourhood

		const change = score
		const nextChange = nextScore

		for (const neighbour of neighbourhood) {
			neighbour[scoreKey] += change
			neighbour[nextScoreKey] += nextChange
		}
	}
}

for (const x of (0).to(WORLD_WIDTH-1)) {
	for (const y of (0).to(WORLD_HEIGHT-1)) {
		const cell = makeCell(x, y)
		const key = getCellKey(x, y)
		world.set(key, cell)
	}
}

for (const cell of world.values()) {
	linkCell(cell)
}

//======//
// SHOW //
//======//
show.resize = (context) => {
	context.fillStyle = COLOUR_OFF_OBJ
	context.fillRect(0, 0, context.canvas.width, context.canvas.height)
	show.imageData = context.getImageData(0, 0, context.canvas.width, context.canvas.height)
	cacheCellOffsets(context)
	drawWorld(context)
}

show.tick = (context) => {
	for (const cell of world.values()) {
		behave(context, cell)
	}
}

show.supertick = (context) => {
	

	if (show.paused) t = !t

	if (Mouse.Left) {
		paint(context, ELEMENT_ANT())
	}
	else if (Mouse.Right) {
		paint(context, ELEMENT_ON)
	}

	context.putImageData(show.imageData, 0, 0)

	t = !t
	clock++
	if (clock > 255) clock = 0
	isDrawFrame = (clock+skipOffset) % skip === 0

}

on.contextmenu(e => e.preventDefault(), {passive: false})