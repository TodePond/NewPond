
const state = {}

const makeSnapshot = ({x = 0, cells = [], leftVoid = false, rightVoid = false} = {}) => {
	const snapshot = {x, cells, leftVoid, rightVoid}
	return snapshot
}

const getCell = (snapshot, x) => {
	
	if (x < snapshot.x) return snapshot.leftVoid
	if (x >= snapshot.x + snapshot.cells.length) return snapshot.rightVoid
	
	const id = x - snapshot.x
	const cell = snapshot.cells[id]
	return cell
}

const setRules = (number) => {
	const codes = number.toString(2, 4)
	const rules = codes.split("").map(c => c === "1"? true : false)
	state.rules.set(00, rules[0])
	state.rules.set(01, rules[1])
	state.rules.set(10, rules[2])
	state.rules.set(11, rules[3])
	/*
	state.rules.set(00, 0)
	state.rules.set(01, 1)
	state.rules.set(10, 1)
	state.rules.set(11, 1)
	*/
}

state.rules = new Map()
state.currentRule = 6
setRules(state.currentRule)

on.load(() => {

	const show = Show.start({paused: true, scale: 1.0, speed: 1.0})
	const {context, canvas} = show

	const round = n => Math.round(n)
	const CELL_SIZE = 1
	const CENTER = round((canvas.width/2 - CELL_SIZE/2) / 1)
	
	const resetHistory = () => {
		//context.clearRect(0, 0, canvas.width, canvas.height)
		state.history = [makeSnapshot({x: 0, cells: [true]})]
	}
	
	resetHistory()
	
	on.keydown(e => {
		if (e.key === "ArrowRight") {
			state.currentRule++
			if (state.currentRule >= 16) {
				state.currentRule = 0
			}
			setRules(state.currentRule)
			resetHistory()
		}
		else if (e.key === "ArrowLeft") {
			state.currentRule--
			if (state.currentRule < 0) {
				state.currentRule = 15
			}
			setRules(state.currentRule)
			resetHistory()
		}


	})

	/*on.touchstart(e => {
		state.currentRule++
		if (state.currentRule >= 16) {
			state.currentRule = 0
		}
		setRules(state.currentRule)
		resetHistory()
	})*/
	
	on.mousedown(e => {
		/*state.currentRule++
		if (state.currentRule >= 16) {
			state.currentRule = 0
		}
		setRules(state.currentRule)
		resetHistory()*/
	})
	
	const COLOUR_ON = Colour.Red
	const COLOUR_OFF = Colour.Grey

	const drawSnapshot = (snapshot, y) => {

		context.resetTransform()
		//const offsetX = (state.currentRule % 4) * canvas.width/4
		const offsetX = 0
		//const offsetY = Math.floor(state.currentRule / 4) * canvas.height/4
		//const offsetY = context.canvas.height/2 - CELL_SIZE/2
		const offsetY = 0
		context.translate(offsetX, offsetY)
		
		const leftEdge = CENTER + snapshot.x*CELL_SIZE
		const rightEdge = leftEdge + snapshot.cells.length*CELL_SIZE
		
		//if ((y) * CELL_SIZE > canvas.height / 4) return true

		context.fillStyle = snapshot.leftVoid? COLOUR_ON : COLOUR_OFF
		//context.fillRect(...[0, (y*CELL_SIZE), (leftEdge), (CELL_SIZE)].map(n => round(n)))
		
		context.fillStyle = snapshot.rightVoid? COLOUR_ON : COLOUR_OFF
		//context.fillRect(...[(rightEdge), (y*CELL_SIZE), canvas.width / 1 - rightEdge, (CELL_SIZE)].map(n => round(n)))
		
		for (let i = 0; i < snapshot.cells.length; i++) {
			const cell = snapshot.cells[i]
			const x = CENTER + (snapshot.x + i)*CELL_SIZE


			context.fillStyle = cell? COLOUR_ON : COLOUR_OFF
			context.fillRect(...[x, (y*CELL_SIZE), CELL_SIZE, CELL_SIZE].map(n => round(n)))
		}
	}
	
	drawSnapshot(state.history.last, 0)
	
	let t = 0
	show.tick = () => {
		
		if (t > 0) {
			t--
			return
		}
		
		t = 0
		
		
		/*context.clearRect(0, 0, canvas.width, canvas.height)
		for (let i = 0; i < state.history.length; i++) {
			const snapshot = state.history[i]
			drawSnapshot(snapshot, i + 1)
		}*/
		
		//const isFinished = drawSnapshot(state.history.last, 0)
		const isFinished = drawSnapshot(state.history.last, state.history.length-1)
		if (isFinished) {
			/*state.currentRule++
			if (state.currentRule >= 16) {
				show.paused = true
			}
			setRules(state.currentRule)
			resetHistory()
			return*/
		}
		
		
		const previous = state.history.last
		const cells = []
		
		for (let i = previous.x - 1; i < previous.x + previous.cells.length; i++) {
			const left = getCell(previous, i)
			const right = getCell(previous, i+1)
			const code = parseInt(`${Number(left)}${Number(right)}`)
			const rule = state.rules.get(code)
			cells.push(rule)
		}
		
		const x = previous.x - 0.5
		const present = makeSnapshot({x, cells})
		
		if (previous.rightVoid) present.rightVoid = state.rules.get(11)
		else present.rightVoid = state.rules.get(00)
		
		if (previous.leftVoid) present.leftVoid = state.rules.get(11)
		else present.leftVoid = state.rules.get(00)
		
		state.history.push(present)
		
	}

	
})
