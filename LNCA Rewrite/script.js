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

const COLOUR_ALIVE_OBJ = COLOURS[Random.Uint8 % COLOURS.length]
COLOURS = COLOURS.filter(c => c !== COLOUR_ALIVE_OBJ)
const COLOUR_DEAD_OBJ = COLOURS[Random.Uint8 % COLOURS.length]

const COLOUR_ALIVE = [COLOUR_ALIVE_OBJ.r, COLOUR_ALIVE_OBJ.g, COLOUR_ALIVE_OBJ.b, 255]
const COLOUR_DEAD = [COLOUR_DEAD_OBJ.r, COLOUR_DEAD_OBJ.g, COLOUR_DEAD_OBJ.b, 255]

//===============//
// NEIGHBOURHOOD //
//===============//
const NEIGHBOURHOOD_CODE_LENGTH = 6
const NEIGHBOURHOOD_SIZE = 5
const NEIGHBOURHOOD_ORIGIN_OFFSET = 2
const NEIGHBOURHOOD_COUNT = 64
const NEIGHBOURHOOD_MAP = [
	0, 1, 3, 1, 0,
	1, 2, 4, 2, 1,
	3, 4, 5, 4, 3,
	1, 2, 4, 2, 1,
	0, 1, 3, 1, 0,
]

const NEIGHBOURHOOD_CODES = [...(0).to(NEIGHBOURHOOD_COUNT-1)].map(i => {
	return i.toString(2).padStart(NEIGHBOURHOOD_CODE_LENGTH, "0")
})

const NEIGHBOURHOOD_EXPANDED_CODES = NEIGHBOURHOOD_CODES.map(code => {
	return NEIGHBOURHOOD_MAP.map(digit => {
		return code[digit]
	}).join("")
})

const NEIGHBOURHOODS = NEIGHBOURHOOD_EXPANDED_CODES.map(code => {
	const positions = []
	let index = 0
	for (let x = 0; x < NEIGHBOURHOOD_SIZE; x++) {
		for (let y = 0; y < NEIGHBOURHOOD_SIZE; y++) {
			const value = code[index]
			if (value === "1") positions.push([x - NEIGHBOURHOOD_ORIGIN_OFFSET, y - NEIGHBOURHOOD_ORIGIN_OFFSET])
			index++
		}
	}
	return positions
})

const printNeighbourhoods = () => {
	print(
		NEIGHBOURHOODS.map(n => {
			return n.map(([x, y]) => {
				return `(${x}, ${y})`
			}).join(", ")
		}).join("\n")
	)
}

const printNeighbourhood = (neighbourhoodId) => {
	const neighbourhood = NEIGHBOURHOODS[neighbourhoodId]
	print(neighbourhood.map(([x, y]) => `(${x}, ${y})`).join(", "))
}

//========//
// CONFIG //
//========//
const WORLD_WIDTH = 1080 / 4
const WORLD_HEIGHT = WORLD_WIDTH
const DEFAULT_WEIGHTS = [0].repeat(NEIGHBOURHOOD_COUNT)
DEFAULT_WEIGHTS[3] = 1

//=========//
// GLOBALS //
//=========//
const world = new Map()
const show = Show.start({speed: 0.5})
let skip = 1
let skipOffset = 0
let clock = 0
let isDrawFrame = true
let t = true
let brushSize = 10

const weightStorage = localStorage.getItem("weights")
const weights = weightStorage !== null? weightStorage : DEFAULT_WEIGHTS

//======//
// CELL //
//======//
const makeCell = (x, y) => {
	const cell = {
		x,
		y,
		elementTick: ELEMENT_DEAD,
		elementTock: ELEMENT_DEAD,
		neighbourhoods: [],
		scoreTick: 0,
		scoreTock: 0,
		drawnElement: ELEMENT_DEAD,
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

	for (const NEIGHBOURHOOD of NEIGHBOURHOODS) {

		const neighbourhood = []
		cell.neighbourhoods.push(neighbourhood)

		for (const [nx, ny] of NEIGHBOURHOOD) {
			let [x, y] = [cell.x + nx, cell.y + ny]
			if (x < 0) x += WORLD_WIDTH
			if (y < 0) y += WORLD_HEIGHT
			if (x >= WORLD_WIDTH) x -= WORLD_WIDTH
			if (y >= WORLD_HEIGHT) y -= WORLD_HEIGHT
			const key = getCellKey(x, y)
			const neighbour = world.get(key)
			neighbourhood.push(neighbour)
		}

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

	//const x = cell.x * width
	//const y = cell.y * height
	//context.fillStyle = element.colour
	//context.fillRect(x, y, width, height)

}

const setCell = (context, cell, element, {next = true} = {}) => {
	
	const nextElementKey = next? getNextElementKey() : getElementKey()
	const oldElement = cell[nextElementKey]
	cell[nextElementKey] = element

	// Update neighbour scores
	if (element !== oldElement) {
		const nextScoreKey = next? getNextScoreKey() : getScoreKey()
		const dscore = element === ELEMENT_ALIVE? 1 : -1

		for (let i = 0; i < cell.neighbourhoods.length; i++) {
			const neighbourhood = cell.neighbourhoods[i]
			const weight = weights[i]
			if (weight === 0) continue
			const change = dscore * weight
			if (change === 0) continue
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
const paint = (context, alive = true) => {
	const {canvas} = context
	const [mx, my] = Mouse.position
	const x = Math.floor((mx - canvas.offsetLeft) / canvas.width * WORLD_WIDTH)
	const y = Math.floor((my - canvas.offsetTop) / canvas.height * WORLD_HEIGHT)
	for (let px = -brushSize; px < brushSize; px++) {
		for (let py = -brushSize; py < brushSize; py++) {
			place(context, x+px, y+py, alive)
		}
	}
	if (brushSize === 0) {
		place(context, x, y, alive)
	}
}

const place = (context, x, y, alive) => {
	if (x < 0) return
	if (y < 0) return
	if (x >= WORLD_WIDTH) return
	if (y >= WORLD_HEIGHT) return
	const key = getCellKey(x, y)
	const cell = world.get(key)
	const target = alive? ELEMENT_ALIVE : ELEMENT_DEAD
	setCell(context, cell, target)
}

on.keydown(e => {
	if (e.key === "r") for (const cell of world.values()) {
		const element = oneIn(2)? ELEMENT_ALIVE : ELEMENT_DEAD
		setCell(show.context, cell, element, {next: false})
	} else if (e.key === "c") for (const cell of world.values()) {
		setCell(show.context, cell, ELEMENT_DEAD, {next: false})
	}
})

//==========//
// ELEMENTS //
//==========//
const makeElement = ({colour} = {}) => {
	const element = {colour}
	return element
}

const getCellScore = (cell) => {
	const scoreKey = getScoreKey()
	return cell[scoreKey]
}

const aliveScores = [
	1, 3, 5
]

const behave = (context, cell) => {
	const score = getCellScore(cell)
	if (aliveScores.includes(score)) setCell(context, cell, ELEMENT_ALIVE)
	else setCell(context, cell, ELEMENT_DEAD)
}

const ELEMENT_DEAD = makeElement({
	colour: COLOUR_DEAD,
})

const ELEMENT_ALIVE = makeElement({
	colour: COLOUR_ALIVE,
})

//=======//
// WORLD //
//=======//
const drawWorld = (context) => {
	context.fillStyle = ELEMENT_DEAD.colour
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
	context.fillStyle = COLOUR_DEAD_OBJ
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
		paint(context, true)
	}
	else if (Mouse.Right) {
		paint(context, false)
	}

	context.putImageData(show.imageData, 0, 0)

	t = !t
	clock++
	if (clock > Infinity) clock = 0
	isDrawFrame = (clock+skipOffset) % skip === 0

}

on.contextmenu(e => e.preventDefault(), {passive: false})