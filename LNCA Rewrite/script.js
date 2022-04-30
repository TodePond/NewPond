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

const COLOUR_ALIVE = COLOURS[Random.Uint8 % COLOURS.length]
COLOURS = COLOURS.filter(c => c !== COLOUR_ALIVE)
const COLOUR_DEAD = COLOURS[Random.Uint8 % COLOURS.length]

//=========//
// GLOBALS //
//=========//
const world = new Map()
const show = Show.start({speed: 0.5})
let skip = 1
let clock = 0
let isDrawFrame = true
let t = true
let brushSize = 10

//========//
// CONFIG //
//========//
const WORLD_WIDTH = 1080 / 4
const WORLD_HEIGHT = WORLD_WIDTH
const NEIGHBOURHOOD = [

	[ 0, 0],

	[ 0, 1],
	[ 0,-1],
	[ 1, 0],
	[-1, 0],

	[ 1,-1],
	[-1,-1],
	[-1, 1],
	[ 1, 1],

	/*[ 2, 0],
	[ 0,-2],
	[-2, 0],
	[ 0, 2],*/

]

//======//
// CELL //
//======//
const makeCell = (x, y) => {
	const cell = {
		x,
		y,
		elementTick: ELEMENT_DEAD,
		elementTock: ELEMENT_DEAD,
		neighbours: [],
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
	for (const [nx, ny] of NEIGHBOURHOOD) {
		let [x, y] = [cell.x + nx, cell.y + ny]
		if (x < 0) x += WORLD_WIDTH
		if (y < 0) y += WORLD_HEIGHT
		if (x >= WORLD_WIDTH) x -= WORLD_WIDTH
		if (y >= WORLD_HEIGHT) y -= WORLD_HEIGHT
		const key = getCellKey(x, y)
		const neighbour = world.get(key)
		cell.neighbours.push(neighbour)
	}
}

const drawCell = (context, cell) => {

	if (!isDrawFrame) return

	const nextElementKey = getNextElementKey()
	const element = cell[nextElementKey]
	cell.drawnElement = element

	const width = context.canvas.width / WORLD_WIDTH
	const height = context.canvas.height / WORLD_HEIGHT
	const x = cell.x * width
	const y = cell.y * height
	context.fillStyle = element.colour
	context.fillRect(x, y, width, height)

}

const setCell = (context, cell, element, {next = true} = {}) => {
	
	const nextElementKey = next? getNextElementKey() : getElementKey()
	const oldElement = cell[nextElementKey]
	cell[nextElementKey] = element

	// Update neighbour scores
	if (element !== oldElement) {
		const nextScoreKey = next? getNextScoreKey() : getScoreKey()
		const dscore = element === ELEMENT_ALIVE? 1 : -1
		for (const neighbour of cell.neighbours) {
			neighbour[nextScoreKey] += dscore
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
	3, 6, 8, 9
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
	drawWorld(context)
}

show.tick = (context) => {

	const elementKey = getElementKey()
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

	t = !t
	clock++
	if (clock > 255) clock = 0
	isDrawFrame = clock % skip === 0

}

on.contextmenu(e => e.preventDefault(), {passive: false})