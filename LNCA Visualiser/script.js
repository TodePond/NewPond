
const CODE_LENGTH = 6
const NEIGHBOURHOOD_SIZE = 5
const NEIGHBOURHOOD_COUNT = parseInt(["1"].repeat(CODE_LENGTH).join(""), 2) + 1
const CELL_SIZE = 20
const MARGIN = CELL_SIZE

const NEIGHBOURHOOD_MAP = [

	/*0, 1, 0,
	1, 2, 1,
	0, 1, 0,*/

	0, 1, 3, 1, 0,
	1, 2, 4, 2, 1,
	3, 4, 5, 4, 3,
	1, 2, 4, 2, 1,
	0, 1, 3, 1, 0,

	/*0, 1, 3, 6, 3, 1, 0,
	1, 2, 4, 7, 4, 2, 1, 
	3, 4, 5, 8, 5, 4, 3, 
	6, 7, 8, 9, 8, 7, 6,
	3, 4, 5, 8, 5, 4, 3,
	1, 2, 4, 7, 4, 2, 1,
	0, 1, 3, 6, 3, 1, 0,*/
]

const global = {
	currentNeighbourhood: 0,
	currentX: MARGIN,
	currentY: MARGIN,
	show: Show.start({paused: true, speed: 0.5}),
}

const drawNeighbourhood = (context, neighbourhood, offsetX, offsetY) => {

	const cells = neighbourhood.toString(2, CODE_LENGTH).split("").map(c => parseInt(c))
	let i = 0
	for (let x = 0; x < NEIGHBOURHOOD_SIZE; x++) {
		for (let y = 0; y < NEIGHBOURHOOD_SIZE; y++) {
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

	/*if (global.currentNeighbourhood >= NEIGHBOURHOOD_COUNT) {
		global.currentNeighbourhood = 0
	} 
	drawNeighbourhood(context, global.currentNeighbourhood, global.currentX, global.currentY)
	global.currentNeighbourhood++
	*/

	if (global.currentNeighbourhood >= NEIGHBOURHOOD_COUNT) return 
	drawNeighbourhood(context, global.currentNeighbourhood, global.currentX, global.currentY)
	global.currentNeighbourhood++
	global.currentX += CELL_SIZE * NEIGHBOURHOOD_SIZE + MARGIN
	if (global.currentX >= context.canvas.width - CELL_SIZE*NEIGHBOURHOOD_SIZE - MARGIN) {
		global.currentX = MARGIN
		global.currentY += CELL_SIZE * NEIGHBOURHOOD_SIZE + MARGIN
	}
}
