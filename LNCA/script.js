
const NEIGHBOURHOOD_COUNT = 64
const ROW_COUNT = 8
const COLUMN_COUNT = 8
const CELL_SIZE = 18

const NEIGHBOURHOOD_MAP = [
	0, 1, 3, 1, 0,
	1, 2, 4, 2, 1,
	3, 4, 5, 4, 3,
	1, 2, 4, 2, 1,
	0, 1, 3, 1, 0,
]

const global = {
	currentNeighbourhood: 0,
	currentX: 0,
	currentY: 0,
	show: Show.start(),
}

const drawNeighbourhood = (context, neighbourhood, offsetX, offsetY) => {

	const cells = neighbourhood.toString(2, 6).split("").map(c => parseInt(c))
	let i = 0
	for (let x = 0; x < 5; x++) {
		for (let y = 0; y < 5; y++) {
			const id = NEIGHBOURHOOD_MAP[i]
			const cell = cells[id]
			context.fillStyle = cell === 1? Colour.Blue : Colour.White

			const X = x * CELL_SIZE + offsetX
			const Y = y * CELL_SIZE + offsetY

			context.fillRect(X, Y, CELL_SIZE, CELL_SIZE)
			i++
		}
	}
}

global.show.tick = (context) => {

	if (global.currentNeighbourhood >= NEIGHBOURHOOD_COUNT) return 
	drawNeighbourhood(context, global.currentNeighbourhood, global.currentX, global.currentY)
	global.currentNeighbourhood++
	global.currentX += CELL_SIZE * 5
	if (global.currentX >= context.canvas.width - CELL_SIZE*5) {
		global.currentX = 0
		global.currentY += CELL_SIZE * 5
	}
}
