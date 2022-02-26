const Show = {}

{

	const start = (show) => {
		
		document.body.style["margin"] = "0px"
		document.body.style["overflow"] = "hidden"
		document.body.style["background-color"] = Colour.Void

		const canvas = document.createElement("canvas")
		const context = canvas.getContext("2d")
		canvas.style["background-color"] = Colour.Void
		canvas.style["image-rendering"] = "pixelated"
		document.body.appendChild(canvas)
		
		show.canvas = canvas
		show.context = context

		on.resize(() => {

			canvas.width = innerWidth * show.scale
			canvas.height = innerHeight * show.scale
			canvas.style["width"] = canvas.width
			canvas.style["height"] = canvas.height
			
			const margin = (100 - show.scale*100)/2
			canvas.style["margin-top"] = `${margin}vh`
			canvas.style["margin-bottom"] = `${margin}vh`
			canvas.style["margin-left"] = `${margin}vw`
			canvas.style["margin-right"] = `${margin}vw`
			
			show.resize()

		})
		
		trigger("resize")

		on.keydown(e => {
			if (e.key === " ") show.paused = !show.paused
		})

		show.construct()

		let t = 0
		const tick = () => {
			
			if (!show.paused) {
				t += show.speed
				while (t > 0) {
					show.update()
					t--
				}
			}

			show.draw()
			requestAnimationFrame(tick)
		}
		
		tick()
		
	}

	Show.start = ({paused = false, scale = 1.0, speed = 1.0, resize = () => {}, update = () => {}, draw = () => {}, construct = () => {}} = {}) => {
		
		const show = {paused, scale, speed, resize, update, draw, construct}

		if (document.body === null) {
			addEventListener("load", () => {
				start(show)
			})
			return show
		}

		start(show)
		return show
	}

}