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

const COLOUR_CABLE_OBJ = Colour.Grey
COLOURS = COLOURS.filter(c => c !== COLOUR_CABLE_OBJ)
const COLOUR_EMPTY_OBJ = Colour.Black
COLOURS = COLOURS.filter(c => c !== COLOUR_EMPTY_OBJ)
const COLOUR_HEAD_OBJ = Colour.Cyan
COLOURS = COLOURS.filter(c => c !== COLOUR_HEAD_OBJ)
const COLOUR_TAIL_OBJ = Colour.White
COLOURS = COLOURS.filter(c => c !== COLOUR_TAIL_OBJ)
const COLOUR_TAIL_TAIL_OBJ = COLOUR_TAIL_OBJ


const COLOUR_CABLE = [COLOUR_CABLE_OBJ.r, COLOUR_CABLE_OBJ.g, COLOUR_CABLE_OBJ.b, 255]
const COLOUR_EMPTY = [COLOUR_EMPTY_OBJ.r, COLOUR_EMPTY_OBJ.g, COLOUR_EMPTY_OBJ.b, 255]
const COLOUR_HEAD = [COLOUR_HEAD_OBJ.r, COLOUR_HEAD_OBJ.g, COLOUR_HEAD_OBJ.b, 255]
const COLOUR_TAIL_TAIL = [COLOUR_TAIL_TAIL_OBJ.r, COLOUR_TAIL_TAIL_OBJ.g, COLOUR_TAIL_TAIL_OBJ.b, 255]
//const COLOUR_TAIL = [COLOUR_TAIL_OBJ.r, COLOUR_TAIL_OBJ.g, COLOUR_TAIL_OBJ.b, 255]
const COLOUR_TAIL = [...[0, 1, 2].map(i => Math.round((COLOUR_HEAD[i] + COLOUR_TAIL_TAIL[i])/2)), 255]

//===============//
// NEIGHBOURHOOD //
//===============//
const NEIGHBOURHOOD = [
	[ 0, 0],

	[ 1, 0],
	[-1, 0],
	[ 0, 1],
	[ 0,-1],
	
	/*[ 1, 1],
	[-1,-1],
	[-1, 1],
	[ 1,-1],*/
]

//========//
// CONFIG //
//========//
const WORLD_WIDTH = Math.round(1080 / 4)
const WORLD_HEIGHT = Math.round(1080 / 4)

//=========//
// GLOBALS //
//=========//
const world = new Map()
const show = Show.start({speed: 2.0})
let skip = 1
let skipOffset = 0
let clock = 0
let isDrawFrame = true
let t = true
let brushSize = 5

//======//
// CELL //
//======//
const makeCell = (x, y) => {

	const cell = {
		x,
		y,
		elementTick: ELEMENT_EMPTY,
		elementTock: ELEMENT_EMPTY,
		neighbourhood: [],
		scoreTick: 0,
		scoreTock: 0,
		drawnElement: ELEMENT_EMPTY,
	}

	return cell
}

const getCellKey = (x, y) => `${x},${y}`
const getCellPosition = (key) => key.split(",").map(n => parseInt(n))
const getElementKey = () => t? "elementTick" : "elementTock"
const getNextElementKey = () => t? "elementTock" : "elementTick"
const getScoreKey = () => t? "scoreTick" : "scoreTock"
const getNextScoreKey = () => t? "scoreTock" : "scoreTick"

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
	
	const nextElementKey = next? getNextElementKey() : getElementKey()
	const oldElement = cell[nextElementKey]
	cell[nextElementKey] = element

	// Update neighbour scores
	if (update && element !== oldElement) {

		let dscore = 0
		if (oldElement !== ELEMENT_HEAD && element === ELEMENT_HEAD) {
			dscore = 1
		} else if (oldElement === ELEMENT_HEAD && element !== ELEMENT_HEAD) {
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
const paint = (context, element) => {
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
		const element = oneIn(2)? ELEMENT_HEAD : ELEMENT_EMPTY
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
		setCell(show.context, cell, ELEMENT_EMPTY, {update: false})
		setCell(show.context, cell, ELEMENT_EMPTY, {next: false, update: false})
	}
	updateCellScores()
	print("WORLD CLEARED")
}

KEYDOWN["1"] = () => selectedElement = ELEMENT_CABLE
KEYDOWN["2"] = () => selectedElement = ELEMENT_HEAD
KEYDOWN["3"] = () => selectedElement = ELEMENT_TAIL
KEYDOWN["4"] = () => selectedElement = ELEMENT_TAIL_TAIL

//==========//
// ELEMENTS //
//==========//
const makeElement = ({colour, behave = () => {}} = {}) => {
	const element = {colour, behave}
	return element
}

const getCellScore = (cell) => {
	const scoreKey = getScoreKey()
	return cell[scoreKey]
}

/*const aliveScores = [
	1, 3, 5
]*/

const behave = (context, cell) => {
	const score = getCellScore(cell)

	const elementKey = getElementKey()
	const element = cell[elementKey]
	element.behave(context, cell)

	/*if (aliveScores.includes(score)) setCell(context, cell, ELEMENT_ALIVE)
	else setCell(context, cell, ELEMENT_DEAD)
	return*/

	/*const element = score > 0? ELEMENT_ALIVE : ELEMENT_DEAD
	setCell(context, cell, element)*/
}

const ELEMENT_EMPTY = makeElement({
	colour: COLOUR_EMPTY,
	behave: (context, cell) => {
		setCell(context, cell, ELEMENT_EMPTY)
	}
})

const ELEMENT_CABLE = makeElement({
	colour: COLOUR_CABLE,
	behave: (context, cell) => {
		const score = getCellScore(cell)
		if (score > 0) {
			setCell(context, cell, ELEMENT_HEAD)
		} else {
			setCell(context, cell, ELEMENT_CABLE)
		}
	}
})

const ELEMENT_HEAD = makeElement({
	colour: COLOUR_HEAD,
	behave: (context, cell) => {
		setCell(context, cell, ELEMENT_TAIL)
	}
})

const ELEMENT_TAIL = makeElement({
	colour: COLOUR_TAIL,
	behave: (context, cell) => {
		const score = getCellScore(cell)
		if (score > 0) {
			setCell(context, cell, ELEMENT_TAIL)
		} else {
			setCell(context, cell, ELEMENT_TAIL_TAIL)
		}
	}
})

const ELEMENT_TAIL_TAIL = makeElement({
	colour: COLOUR_TAIL_TAIL,
	behave: (context, cell) => {
		const score = getCellScore(cell)
		if (score > 0) {
			setCell(context, cell, ELEMENT_TAIL_TAIL)
		} else {
			setCell(context, cell, ELEMENT_CABLE)
		}
	}
})

let selectedElement = ELEMENT_CABLE

//=======//
// WORLD //
//=======//
const drawWorld = (context) => {
	context.fillStyle = COLOUR_EMPTY
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

		const score = cell[elementKey] === ELEMENT_HEAD? 1 : 0
		const nextScore = cell[nextElementKey] === ELEMENT_HEAD? 1 : 0

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
	context.fillStyle = COLOUR_EMPTY_OBJ
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
		paint(context, selectedElement)
	}
	else if (Mouse.Right) {
		paint(context, ELEMENT_EMPTY)
	}

	context.putImageData(show.imageData, 0, 0)

	t = !t
	clock++
	if (clock > 255) clock = 0
	isDrawFrame = (clock+skipOffset) % skip === 0

}

on.contextmenu(e => e.preventDefault(), {passive: false})