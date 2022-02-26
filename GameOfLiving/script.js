const show = Show.start({speed: 1.0})

show.tick = (context, canvas) => {
	context.fillStyle = Colour.splash(Random.Uint32 % 1000)
	context.fillRect(Random.Uint32 % canvas.width, Random.Uint32 % canvas.height, 100, 100)
}
