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

let colouri = Random.Uint8 % COLOURS.length
let COLOUR_ON_OBJ = COLOURS[colouri]
const COLOUR_OFF_OBJ = Colour.Black

let COLOUR_ON = [COLOUR_ON_OBJ.r, COLOUR_ON_OBJ.g, COLOUR_ON_OBJ.b, 255]
const COLOUR_OFF = [COLOUR_OFF_OBJ.r, COLOUR_OFF_OBJ.g, COLOUR_OFF_OBJ.b, 255]

const nextColour = () => {
	/*colouri++
	if (colouri >= COLOURS.length) colouri = 0*/

	colouri = Random.Uint32 % COLOURS.length
	COLOUR_ON_OBJ = COLOURS[colouri]
	COLOUR_ON = [COLOUR_ON_OBJ.r, COLOUR_ON_OBJ.g, COLOUR_ON_OBJ.b, 255]
}

//========//
// NUMBER //
//========//
const wrap = (n, min, max) => {
	const difference = max - min + 1
	while (n < min) n += difference
	while (n > max) n -= difference
	return n
}

const clamp = (n, min, max) => {
	if (n < min) return min
	if (n > max) return max
	return n
}

//===============//
// NEIGHBOURHOOD //
//===============//
const NEIGHBOURHOOD = [
	[ 1, 0],
	[ 0, 1],
	[-1, 0],
	[ 0,-1],

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
	[ 1, 0],
	[ 0, 1],
	[-1, 0],
	[ 0,-1],

	/*[ 1, 1],
	[-1, 1],
	[-1,-1],
	[ 1,-1],*/
]

//========//
// CONFIG //
//========//
const WORLD_SHRINK = 1
const WORLD_SCALE = 1
const WORLD_WIDTH = Math.round(1920 / WORLD_SHRINK * WORLD_SCALE)
const WORLD_HEIGHT = Math.round(1080 / WORLD_SHRINK * WORLD_SCALE)

/*
const WORLD_WIDTH = Math.round(1080 / 0.5)
const WORLD_HEIGHT = WORLD_WIDTH
*/

//=========//
// GLOBALS //
//=========//
const world = new Map()
const ents = new Set()
const show = Show.start({speed: 1.0})
let skip = 1
let skipOffset = 0
let clock = 0
let isDrawFrame = true
let t = true
let brushSize = 50

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
		cell: undefined,
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

const isCellTrapped = (cell) => {
	const elementKey = getElementKey()
	for (const neighbour of cell.movementNeighbourhood) {
		if (neighbour[elementKey] === ELEMENT_OFF) return false
	}
	return true
}

const setCell = (context, cell, element, {next = true, update = true} = {}) => {
	
	if (element.data.isEnt) {
		if (isCellTrapped(cell)) {
			ents.delete(element)
		} else {
			ents.add(element)
		}
		element.cell = cell
	}

	cell.elementTick = element
	cell.age = clock

	const nextElementKey = next? getNextElementKey() : getElementKey()
	cell[nextElementKey] = element

	// Update neighbour scores
	if (update) {
		const neighbourhood = cell.neighbourhood
		for (const neighbour of neighbourhood) {
			const nelement = neighbour[nextElementKey]
			if (nelement.data.isEnt) {
				if (isCellTrapped(neighbour)) {
					ents.delete(nelement)
				} else {
					ents.add(nelement)
				}
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
const paint = (context, element, size = brushSize) => {
	const {canvas} = context
	const [mx, my] = Mouse.position
	const x = Math.floor((mx - canvas.offsetLeft) / canvas.width * WORLD_WIDTH)
	const y = Math.floor((my - canvas.offsetTop) / canvas.height * WORLD_HEIGHT)
	for (let px = -size; px < size; px++) {
		for (let py = -size; py < size; py++) {
			place(context, x+px, y+py, element)
		}
	}
	if (size === 0) {
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
	ents.clear()
	for (const cell of world.values()) {
		const element = oneIn(2)? ELEMENT_ON() : ELEMENT_OFF
		setCell(show.context, cell, element, {update: false})
		setCell(show.context, cell, element, {next: false, update: false})
	}
	updateCellScores()
	print("WORLD RANDOMISED")
}

// Clear world
KEYDOWN["c"] = () => {
	print("...")
	ents.clear()
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
KEYDOWN["5"] = () => show.speed = 8.0
KEYDOWN["6"] = () => show.speed = 16.0
KEYDOWN["7"] = () => show.speed = 32.0
KEYDOWN["8"] = () => show.speed = 64.0
KEYDOWN["9"] = () => show.speed = 128.0
KEYDOWN["9"] = () => show.speed = 256.0

//========//
// RANDOM //
//========//
const BIAS = -1
const MUTATION = 2
const getRandomDirection = () => Random.Uint8 % 4
const getRandomMutation = (size) => Random.Uint32 % ((size)*2 + 1 + BIAS) - size
const getMutatedChannel = (channel, size) => clamp(channel + getRandomMutation(Math.round(MUTATION * size)), 0, 255)

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
		//setCell(context, cell, ELEMENT_OFF)
	}
})

const ELEMENT_ON = () => makeElement({
	colour: [...COLOUR_ON],
	data: {
		isEnt: true,
	},
	behave: (context, cell, element) => {
		if (cell.age === clock) return

		const direction = getRandomDirection()
		const target = cell.movementNeighbourhood[direction]
		const oldElement = target[getElementKey()]
		if (oldElement !== ELEMENT_OFF) return

		const newElement = ELEMENT_ON()
		for (let i = 0; i < 3; i++) {
			const s = i === 2? 3 : 1
			newElement.colour[i] = getMutatedChannel(element.colour[i], s)
		}
		setCell(context, target, newElement)
	}
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
	const entos = [...ents.values()]
	for (let i = 0; i < entos.length; i++) {
		const id = Random.Uint32 % entos.length
		const ent = entos[id]
		const cell = ent.cell
		behave(context, cell)
	}
}

let pencilUp = true
show.supertick = (context) => {
	

	if (show.paused) t = !t

	if (Mouse.Left) {
		if (pencilUp) nextColour()
		paint(context, ELEMENT_ON(), 0)
		pencilUp = false
	}
	else if (Mouse.Right) {
		paint(context, ELEMENT_OFF)
	}

	if (!Mouse.Left) {
		pencilUp = true
	}

	context.putImageData(show.imageData, 0, 0)

	t = !t
	clock++
	if (clock > 255) clock = 0
	isDrawFrame = (clock+skipOffset) % skip === 0

}

on.contextmenu(e => e.preventDefault(), {passive: false})