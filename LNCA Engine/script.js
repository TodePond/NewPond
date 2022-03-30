
const COLOUR_ON = Colour.Green
const COLOUR_OFF = Colour.Blue

const WORLD_WIDTH = 10
const WORLD_HEIGHT = 10

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

const NEIGHBOURHOODS = NEIGHBOURHOOD_EXPANDED_CODES.map(code => {
	const positions = []
	let index = 0
	for (let x = 0; x < NEIGHBOURHOOD_SIZE; x++) {
		for (let y = 0; y < NEIGHBOURHOOD_SIZE; y++) {
			const value = code[index]
			if (value === "1") positions.push([x, y])
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

const makeCell = () => {
	const value = 0 //Random.Uint8 % 2
	const scores = NEIGHBOURHOODS.map(() => 0)
	const score = 0
	const influencees = NEIGHBOURHOODS.map(() => [])
	const cell = {value, score, scores, influencees}
	return cell
}

const makeWorld = () => {
	const cells = []
	for (let x = 0; x < WORLD_WIDTH; x++) {
		for (let y = 0; y < WORLD_HEIGHT; y++) {
			const cell = makeCell()
			cells.push(cell)
		}
	}
	return cells
}

const linkInfluencers = (cell, x, y) => {
	for (let i = 0; i < NEIGHBOURHOODS.length; i++) {
		const neighbourhood = NEIGHBOURHOODS[i]
		for (const [nx, ny] of neighbourhood) {
			const [ix, iy] = [x + nx, y + ny]
			if (ix >= WORLD_WIDTH) continue
			if (iy >= WORLD_HEIGHT) continue
			const influencer = getCell(ix, iy)
			influencer.influencees[i].push(cell)
		}
	}
}

const linkWorld = () => {

	let index = 0
	for (let x = 0; x < WORLD_WIDTH; x++) {
		for (let y = 0; y < WORLD_HEIGHT; y++) {
			const cell = global.cells[index]
			linkInfluencers(cell, x, y)
			index++
		}
	}

}

const getCell = (x, y) => {
	const index = y * WORLD_WIDTH + x
	const cell = global.cells[index]
	if (cell === undefined) {
		console.error(`[LNCA] Can't find cell at`, y, x)
	}
	return cell
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
		
		cell.value = 1
		drawWorld(context)

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
	weights: NEIGHBOURHOODS.map(() => 0.0),
	show: Show.start({paused: false}),
}

linkWorld()

global.show.tick = (context) => {
	
	updateCursor(context)
	drawWorld(context)
	
}




