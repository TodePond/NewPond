
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
state.currentRule = 0
setRules(state.currentRule)

on.load(() => {

	const show = Show.start({paused: false, scale: 1.0})
	const {context, canvas} = show

	const CELL_SIZE = 1
	const CENTER = canvas.width/2 - CELL_SIZE/2
	
	const resetHistory = () => {
		context.clearRect(0, 0, canvas.width, canvas.height)
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

	on.touchstart(e => {
		state.currentRule++
		if (state.currentRule >= 16) {
			state.currentRule = 0
		}
		setRules(state.currentRule)
		resetHistory()
	})
	
	const drawSnapshot = (snapshot, y) => {
		for (let i = 0; i < snapshot.cells.length; i++) {
			const cell = snapshot.cells[i]
			const x = CENTER + (snapshot.x + i)*CELL_SIZE
			context.fillStyle = cell? Colour.Blue : Colour.Black
			context.fillRect(Math.round(x), Math.round(y * CELL_SIZE), Math.round(CELL_SIZE), Math.round(CELL_SIZE))
		}
	}
	
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
		
		drawSnapshot(state.history.last, state.history.length)
		
		
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
		state.history.push(present)
		
	}

	
})
