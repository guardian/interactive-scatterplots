import D3Node from 'd3-node'

const CIRCLE_SIZE = 6

const sum = (a, b) => a + b
const mean = xVals => xVals.reduce(sum)/xVals.length

const sd = xVals => {
	const mu = mean(xVals)
	return Math.sqrt(1/xVals.length*xVals.map(x => (x-mu)*(x-mu)).reduce(sum))
}

const pearson = (xVals, yVals) => {
	const p = 
		xVals.map((x, i) => (x-mean(xVals))*(yVals[i]-mean(yVals))).reduce(sum)
		/
		(Math.sqrt(xVals.map((x, i) => Math.pow(x-mean(xVals), 2)).reduce(sum))*Math.sqrt(yVals.map((y, i) => Math.pow(y-mean(yVals), 2)).reduce(sum)))
	return p

}

const leastSquares = (xVals, yVals) => {
	return x => {
		const b = pearson(xVals, yVals)*sd(yVals)/sd(xVals)
		const a = mean(yVals) - b*mean(xVals)
		return a + b*x
	}
}

const uniformColour = row => ''
const uniformSize = radius => Math.PI // or literally any other number

const round = (n, down = true) => {
	if(n === 0) return 0

	const a = Math.abs(n)
	const oom = Math.floor(Math.log(a)/Math.LN10 + 0.00000001) // floating point bs

	const r = (down && n > 0 || !down && n < 0) ? Math.floor(a/Math.pow(10, oom))*Math.pow(10, oom) :
		Math.ceil(a/Math.pow(10, oom))*Math.pow(10, oom)

	return n < 0 ? -1*r : r

}

const niceExtent = data => {
	const [min, max] = d3.extent(data)
	return [round(min), round(max, false)]
}

const quarterStops = extent => {
	return [0.25, 0.5, 0.75].map(i => extent[0] + i*(extent[1]-extent[0]))
}

const plot = (input, x, y,
	// default options (ES6 defaults patterm)
{

	r = uniformSize,
	maxR = CIRCLE_SIZE,
	xExtent = niceExtent,
	yExtent = niceExtent,
	xStops = quarterStops,
	yStops = quarterStops,
	xFormat = d => parseInt(d*100) + '%',
	yStopsInset = false,
	xLabel = 'x axis',
	yFormat = d => parseInt(d*100) + '%',
	yLabel = 'y axis',
	fitLine = false,
	classCircles = uniformColour,
	id = 'name',
	width = 400,
	height = 400,
	padding = 32,
	title = '',
	classTitle = '',
	labelSize = 13

} = {}) => {

	const d3n = new D3Node()
	const d3 = d3n.d3
	const svg = d3n.createSVG(width, height)

	const getX = (typeof x === 'function') ? x : row => parseFloat(row[x])
	const getY = (typeof y === 'function') ? y : row => parseFloat(row[y])
	const getR = (typeof r === 'function') ? r : row => parseFloat(row[r])
	const getId = (typeof id === 'function') ? id : row => row[id]

	const data = input.filter(row => !isNaN(getX(row)) && !isNaN(getY(row)))

	const xExtentArr = (typeof xExtent === 'function') ? xExtent(data.map(getX)) : xExtent
	const yExtentArr = (typeof yExtent === 'function') ? yExtent(data.map(getY)) : yExtent
	const xStopsArr = (typeof xStops === 'function') ? xStops(xExtentArr) : xStops
	const yStopsArr = (typeof yStops === 'function') ? yStops(yExtentArr) : yStops

	const paddingBottom = padding + labelSize + 4

	const xScale = d3.scaleLinear()
		.domain(xExtentArr)
		.range([padding, width-padding])

	const yScale = d3.scaleLinear()
		.domain(yExtentArr)
		.range([height-paddingBottom, padding])

	const rScale = d3.scaleSqrt()
		.domain([0, d3.max(data.map(getR))])
		.range([0, maxR])

	const bestFit = leastSquares(data.map(getX), data.map(getY))
	const p1 = [d3.min(data.map(getX)), bestFit(d3.min(data.map(getX)))]
	const p2 = [d3.max(data.map(getX)), bestFit(d3.max(data.map(getX)))]

	const axisGroup = svg
		.append('g')
		.attr('class', 'ge-axes')

	const yLines = axisGroup
		.selectAll('ge-line--y')
		.data(yStopsArr)
		.enter()
		.append('g')
		.attr('transform', d => `translate(0, ${yScale(d)})`)

	yLines
		.append('line')
		.attr('x1', padding)
		.attr('x2', width-padding)
		.attr('y1', 0)
		.attr('y2', 0)
		.attr('class', 'ge-gridline')

	yLines
		.append('text')
		.attr('dx', yStopsInset ? padding : padding - 4)
		.attr('dy', yStopsInset ? -4 : Math.ceil(labelSize/3))
		.attr('class', 'ge-axis__label ge-axis__label--y' + (yStopsInset ? 'ge-axis__label--y--inset' : ''))
		.style('font-size', labelSize + 'px')
		.text(yFormat)

	const xLines = axisGroup
		.selectAll('ge-line--x')
		.data(xStopsArr)
		.enter()
		.append('g')
		.attr('transform', d => `translate(${xScale(d)}, 0)`)


	xLines
		.append('line')
		.attr('x1', 0)
		.attr('x2', 0)
		.attr('y1', padding)
		.attr('y2', height-paddingBottom)
		.attr('class', 'ge-gridline')

	xLines
		.append('text')
		.attr('dx', 0)
		.attr('dy', height - paddingBottom + labelSize)
		.attr('class', 'ge-axis__label ' + 'ge-axis__label--x')
		.style('font-size', labelSize + 'px')
		.text(xFormat)


	const circleGroup = svg
		.append('g')
		.attr('class', 'ge-circles')

	const circles = circleGroup
		.selectAll('.ge-circle')
		.data(data)
		.enter()
		.append('circle')
		.attr('cx', d => xScale(getX(d)))
		.attr('cy', d => yScale(getY(d)))
		.attr('r', d => rScale(getR(d)))
		.attr('class', d => {
			const base = 'ge-circle'
			return `${base} ${ classCircles(d) }`
		})
		.attr('id', getId)

	if(fitLine){

		const lineOf = svg
			.append('line')
			.attr('x1', xScale(p1[0]))
			.attr('y1', yScale(p1[1]))
			.attr('x2', xScale(p2[0]))
			.attr('y2', yScale(p2[1]))
			.attr('class', 'ge-best-fit')

	}

	if(title !== '') {

		const titleText = svg
			.append('text')
			.attr('x', width/2)
			.attr('y', padding - labelSize - 8)
			.attr('class', classTitle)

		const lines = title.split('\n')
		const spans = titleText
			.selectAll('tspan')
			.data(lines.map(l => l.trim()))
			.enter()
			.append('tspan')
			.attr('x', width/2)
			.attr('dy', (d, i) => i*labelSize)
			.text(line => line)
	}

	return d3n.svgString()

}

export default { plot }