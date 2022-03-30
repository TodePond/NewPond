
const COLOUR_ON = Colour.Green
const COLOUR_OFF = Colour.Blue

const WORLD_WIDTH = 40
const WORLD_HEIGHT = 40

const CELL_SIZE = 20
const VIEW_WIDTH = WORLD_WIDTH * CELL_SIZE
const VIEW_HEIGHT = WORLD_HEIGHT * CELL_SIZE

const CODE_LENGTH = 6
const NEIGHBOURHOOD_SIZE = 5
const NEIGHBOURHOOD_COUNT = 64
const NEIGHBOURHOOD_MAP = [
	0, 1, 3, 1, 0,
	1, 2, 4, 2, 1,
	3, 4, 5, 4, 3,
	1, 2, 4, 2, 1,
	0, 1, 3, 1, 0,
]

const NEIGHBOURHOOD_CODES = [...(0).to(NEIGHBOURHOOD_COUNT-1)].map(i => {
	return i.toString(2).padStart(CODE_LENGTH, "0")
})

const NEIGHBOURHOOD_EXPANDED_CODES = NEIGHBOURHOOD_CODES.map(code => {
	return NEIGHBOURHOOD_MAP.map(digit => {
		return code[digit]
	}).join("")
})

const makeCell = () => {
	const value = Random.Uint8 % 2
	const scores = NEIGHBOURHOOD_CODES.map(() => 0)
	const influences = NEIGHBOURHOOD_CODES.map(() => [])
	const cell = {value, scores, influences}
	return cell
}

const linkInfluences = (cells) => {
	let index = 0
	for (let x = 0; x < WORLD_WIDTH; x++) {
		for (let y = 0; y < WORLD_HEIGHT; y++) {

			index++
		}
	}
}

const linkInfluencers = (cell, x, y, cells) => {
	for (let i = 0; i < NEIGHBOURHOOD_EXPANDED_CODES.length; i++) {
		
	}
}

const makeWorld = () => {
	const cells = []
	for (let x = 0; x < WORLD_WIDTH; x++) {
		for (let y = 0; y < WORLD_HEIGHT; y++) {
			const cell = makeCell()
			cells.push(cell)
		}
	}
	
	let index = 0
	for (let x = 0; x < WORLD_WIDTH; x++) {
		for (let y = 0; y < WORLD_HEIGHT; y++) {
			const cell = cells[index]
			linkInfluencers(cell, x, y, cells)
			index++
		}
	}

	return cells
}

const getCell = (x, y) => {
	const index = x * WORLD_WIDTH + y
	return global.cells[index]
}

const updateCursor = (context) => {
	if (Mouse.Left) {
		const [mx, my] = Mouse.position
		if (mx === undefined) return
		if (my === undefined) return
		
		const vx = mx / CELL_SIZE
		if (vx < 0) return
		if (vx > WORLD_WIDTH) return
		const vy = my / CELL_SIZE
		if (vy < 0) return
		if (vy > WORLD_HEIGHT) return

		const [x, y] = [vy, vx].map(v => Math.floor(v))
		const cell = getCell(x, y)
		print("Cell", cell)

	}
}

const drawWorld = (context) => {
	let index = 0
	for (let x = 0; x < WORLD_WIDTH; x++) {
		for (let y = 0; y < WORLD_HEIGHT; y++) {
			const cell = global.cells[index]
			context.fillStyle = cell.value === 1? COLOUR_ON : COLOUR_OFF
			context.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
			index++
		}
	}
}

const global = {
	cells: makeWorld(),
	show: Show.start({paused: false}),
}

global.show.tick = (context) => {
	
	updateCursor(context)
	drawWorld(context)
	
}




