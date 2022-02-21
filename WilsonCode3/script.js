
const state = {}

state.yOffset = 0
state.xOffset = 0

const makeSnapshot = ({x = 0, cells = [], leftVoid = 0, rightVoid = 0} = {}) => {
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
	const codes = number.toString(3, 9)
	const rules = codes.split("").map(c => parseInt(c))
	state.rules.set(00, rules[0])
	state.rules.set(01, rules[1])
	state.rules.set(02, rules[2])
	state.rules.set(10, rules[3])
	state.rules.set(11, rules[4])
	state.rules.set(12, rules[5])
	state.rules.set(20, rules[6])
	state.rules.set(21, rules[7])
	state.rules.set(22, rules[8])
	/*
	state.rules.set(00, 0)
	state.rules.set(01, 1)
	state.rules.set(10, 1)
	state.rules.set(11, 1)
	*/
}

const SAMPLE_SIZE = 30

state.rules = new Map()
state.currentRule = 0
setRules(state.currentRule)

on.load(() => {

	const show = Show.start({paused: false, scale: 1.0, speed: 1000})
	const {context, canvas} = show

	const CELL_SIZE = 2
	//const CELL_HEIGHT = canvas.height
	const CELL_HEIGHT = 1
	const CENTER = canvas.width/2 - CELL_SIZE/2
	
	const resetHistory = () => {
		//context.clearRect(0, 0, canvas.width, canvas.height)
		state.history = [makeSnapshot({x: 0, cells: [2]})]
	}
	

	setCode = (number) => {
		state.currentRule = number
		setRules(number)
		resetHistory()
	}
	
	resetHistory()
	
	on.keydown(e => {
		if (e.key === "ArrowRight") {
			state.currentRule++
			if (state.currentRule >= 19682) {
				state.currentRule = 0
			}
			setRules(state.currentRule)
			resetHistory()
		}
		else if (e.key === "ArrowLeft") {
			state.currentRule--
			if (state.currentRule < 0) {
				state.currentRule = 19681
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
		state.currentRule++
		if (state.currentRule >= 19682) {
			state.currentRule = 0
		}
		setRules(state.currentRule)
		resetHistory()
	})
	
	const drawSnapshot = (snapshot, y) => {
		
		y = state.yOffset
		
		const leftEdge = 0 + snapshot.x*CELL_SIZE
		const rightEdge = leftEdge + snapshot.cells.length*CELL_SIZE
		
		context.fillStyle = snapshot.leftVoid === 1? Colour.Blue : Colour.Black
		if (snapshot.leftVoid === 2) context.fillStyle = Colour.Green
		//context.fillRect(Math.round(state.xOffset), Math.round(y*CELL_HEIGHT), Math.round(leftEdge-state.xOffset), Math.round(CELL_HEIGHT))
		
		context.fillStyle = snapshot.rightVoid === 1? Colour.Blue : Colour.Black
		if (snapshot.rightVoid === 2) context.fillStyle = Colour.Green
		//context.fillRect(Math.round(rightEdge), Math.round(y*CELL_HEIGHT), canvas.width, Math.round(CELL_HEIGHT))
		
		for (let i = 0; i < snapshot.cells.length; i++) {
			const cell = snapshot.cells[i]
			const x = 0 + (snapshot.x + i)*CELL_SIZE
			context.fillStyle = cell? Colour.Blue : Colour.Black
			if (cell === 2) context.fillStyle = Colour.Green
			context.fillRect(Math.round(x+state.xOffset), Math.round(y*CELL_HEIGHT), Math.round(CELL_SIZE), Math.round(CELL_HEIGHT))
		}
	}
	
	let t = 0
	let tock = 0
	show.tick = () => {
		
		if (t > 0) {
			t--
			return
		}
		
		t = 0
		
		tock++
		
		
		/*context.clearRect(0, 0, canvas.width, canvas.height)
		for (let i = 0; i < state.history.length; i++) {
			const snapshot = state.history[i]
			drawSnapshot(snapshot, i + 1)
		}*/
		
		if (tock % 1 === 0) {
			context.globalAlpha = 0.9
			drawSnapshot(state.history.last, state.history.length)
		}
		
		if (tock > SAMPLE_SIZE) {
			tock = 0
			setCode(state.currentRule + 1)
			state.yOffset++
			if (state.yOffset > canvas.height/CELL_HEIGHT) {
				state.yOffset = 0
				state.xOffset += SAMPLE_SIZE*2.5
				if (state.xOffset + SAMPLE_SIZE*2.5 > canvas.width) {
					//state.xOffset = 0
				}
			}
		}
		
		const previous = state.history.last
		const cells = []
		
		for (let i = previous.x - 1; i < previous.x + previous.cells.length; i++) {
			const left = getCell(previous, i)
			const right = getCell(previous, i+1)
			const code = parseInt(`${left}${right}`)
			const rule = state.rules.get(code)
			cells.push(rule)
		}
		
		const x = previous.x - 0.5
		const present = makeSnapshot({x, cells})
		
		if (previous.rightVoid === 1) present.rightVoid = state.rules.get(11)
		else if (previous.rightVoid === 2) present.rightVoid = state.rules.get(22)
		else present.rightVoid = state.rules.get(00)
		
		if (previous.leftVoid === 1) present.leftVoid = state.rules.get(11)
		else if (previous.leftVoid === 2) present.leftVoid = state.rules.get(22)
		else present.leftVoid = state.rules.get(00)
		
		state.history.push(present)
		
	}

	
})