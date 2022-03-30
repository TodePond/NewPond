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

const COLOUR_ON = COLOURS[Random.Uint8 % COLOURS.length]
COLOURS = COLOURS.filter(c => c !== COLOUR_ON)
const COLOUR_OFF = COLOURS[Random.Uint8 % COLOURS.length]

const WORLD_WIDTH = 100
const WORLD_HEIGHT = 100

const CELL_SIZE = 10
const VIEW_WIDTH = WORLD_WIDTH * CELL_SIZE
const VIEW_HEIGHT = WORLD_HEIGHT * CELL_SIZE

const BRUSH_SIZE = 3

const CODE_LENGTH = 6
const NEIGHBOURHOOD_SIZE = 5
const ORIGIN_OFFSET = 2
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
			if (value === "1") positions.push([x - ORIGIN_OFFSET, y - ORIGIN_OFFSET])
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
	const value = false
	const scores = [0, 0]
	const influencees = NEIGHBOURHOODS.map(() => [])
	const cell = {value, scores, influencees}
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
			let [ix, iy] = [x + nx, y + ny]
			if (ix >= WORLD_WIDTH) ix -= WORLD_WIDTH
			if (iy >= WORLD_HEIGHT) iy -= WORLD_HEIGHT
			if (ix < 0) ix += WORLD_WIDTH
			if (iy < 0) iy += WORLD_HEIGHT
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
	const index = x * WORLD_HEIGHT + y
	const cell = global.cells[index]
	if (cell === undefined) {
		console.error(`[LNCA] Can't find cell at`, x, y)
	}
	return cell
}

const setCell = (context, cell, x, y, value, doItNow = false) => {
	if (cell.value === value) return

	const dvalue = value? 1 : -1

	const scoreIndex = doItNow? global.currentScoreIndex : global.nextScoreIndex

	for (let i = 0; i < NEIGHBOURHOODS.length; i++) {
		const influencees = cell.influencees[i]
		const weight = global.weights[i]
		const dweightedValue = weight * dvalue
		for (const influencee of influencees) {
			influencee.scores[scoreIndex] += dweightedValue
		}
	}

	cell.value = value
	drawCell(context, cell, x, y)

}

const updateCursor = (context) => {
	if (Mouse.Left || Mouse.Right) {

		const [mx, my] = Mouse.position
		if (mx === undefined) return
		if (my === undefined) return
		
		const vx = mx / CELL_SIZE
		const vy = my / CELL_SIZE

		const [x, y] = [vx, vy].map(v => Math.floor(v))

		for (let bx = -BRUSH_SIZE; bx < BRUSH_SIZE; bx++) {
			for (let by = -BRUSH_SIZE; by < BRUSH_SIZE; by++) {
				
				const [cx, cy] = [x+bx, y+by]

				if (cx < 0) return
				if (cx >= WORLD_WIDTH) return
				if (cy < 0) return
				if (cy >= WORLD_HEIGHT) return

				const cell = getCell(cx, cy)
				const value = Mouse.Left
				setCell(context, cell, cx, cy, value, true)
			}
		}


	}
}

const updateCell = (context, cell, x, y) => {
	const nextValue = cell.scores[global.currentScoreIndex] > 0
	setCell(context, cell, x, y, nextValue, true)

	/*if (cell.updatedUntil !== global.currentScoreIndex) {
		cell.scores[global.nextScoreIndex] = cell.scores[global.currentScoreIndex]
		cell.updatedUntil
	}*/
	
}

const drawCell = (context, cell, x, y) => {
	context.fillStyle = cell.value? COLOUR_ON : COLOUR_OFF
	context.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
}

const drawWorld = (context) => {
	let index = 0
	for (let x = 0; x < WORLD_WIDTH; x++) {
		for (let y = 0; y < WORLD_HEIGHT; y++) {
			
			const cell = global.cells[index]
			drawCell(context, cell, x, y)
			index++
		}
	}
}

const global = {
	currentScoreIndex: 0,
	nextScoreIndex: 1,
	cells: makeWorld(),
	weights: NEIGHBOURHOODS.map(() => Math.random() * 4 - 2),
	show: Show.start({paused: true}),
}

linkWorld()

for (let i = 0; i < global.weights.length; i++) {
	//print(i, global.weights[i].toFixed(3))
}

global.show.resize = (context) => {
	
	drawWorld(context)
	
	for (let x = 0; x < WORLD_WIDTH; x++) {
		for (let y = 0; y < WORLD_HEIGHT; y++) {
			const cell = getCell(x, y)
			setCell(context, cell, x, y, oneIn(2))
		}
	}
}

global.show.supertick = (context) => {

	updateCursor(context)

	if (global.show.paused) return

	for (let x = 0; x < WORLD_WIDTH; x++) {
		for (let y = 0; y < WORLD_HEIGHT; y++) {
			const cell = getCell(x, y)
			updateCell(context, cell, x, y)
		}
	}
	
	
	const a = global.currentScoreIndex
	const b = global.nextScoreIndex
	global.currentScoreIndex = b
	global.nextScoreIndex = a

	

}

on.contextmenu(e => e.preventDefault(), {passive: false})




