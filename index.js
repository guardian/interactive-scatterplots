import * as d3 from 'd3'
import { JSDOM } from 'jsdom'

const DEFAULT_CIRCLE_SIZE = 6

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
const uniformSize = radius => 1 // or literally any other number

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

	r = DEFAULT_CIRCLE_SIZE,
	rScale = uniformSize,
	xExtent = niceExtent,
	yExtent = niceExtent,
	xStops = quarterStops,
	yStops = quarterStops,
	xFormat = d => d,
	yStopsInset = false,
	xLabel = 'x axis',
	yFormat = d => d,
	yLabel = 'y axis',
	fitLine = false,
	classCircles = uniformColour,
	styleCircles = {},
	id = 'name',
	width = 400,
	height = 400,
	padding = 32,
	title = '',
	classTitle = '',
	labelSize = 13

} = {}) => {

	const dom = new JSDOM(`<svg class='scpl-plot' width='${width}' height='${height}'></svg>`)
	const svg = d3.select(dom.window.document.querySelector('svg'))

	const getX = (typeof x === 'function') ? x : row => parseFloat(row[x])
	const getY = (typeof y === 'function') ? y : row => parseFloat(row[y])
	const getR = (typeof rScale === 'function') ? rScale : row => parseFloat(row[rScale])
	const getId = (typeof id === 'function') ? id : row => row[id]
	const getLabel = label ? label : () => null

	const getCircleClass = (typeof classCircles === 'function') ? classCircles : row => classCircles

	const data = input.filter(row => !isNaN(getX(row)) && !isNaN(getY(row)))

	const xExtentArr = (typeof xExtent === 'function') ? xExtent(data.map(getX)) : xExtent
	const yExtentArr = (typeof yExtent === 'function') ? yExtent(data.map(getY)) : yExtent
	const xStopsArr = (typeof xStops === 'function') ? xStops(xExtentArr) : xStops
	const yStopsArr = (typeof yStops === 'function') ? yStops(yExtentArr) : yStops

	const styles = styleCircles

	const paddingBottom = padding + labelSize + 4

	const xScale = d3.scaleLinear()
		.domain(xExtentArr)
		.range([padding, width-padding])

	const yScale = d3.scaleLinear()
		.domain(yExtentArr)
		.range([height-paddingBottom, padding])

	const radiusScale = d3.scaleSqrt()
		.domain([0, d3.max(data.map(getR))])
		.range([0, r])

	const bestFit = leastSquares(data.map(getX), data.map(getY))
	const p1 = [d3.min(data.map(getX)), bestFit(d3.min(data.map(getX)))]
	const p2 = [d3.max(data.map(getX)), bestFit(d3.max(data.map(getX)))]

	const axisGroup = svg
		.append('g')
		.attr('class', `scpl-axes`)

	const yLines = axisGroup
		.selectAll(`scpl-line--y`)
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
		.attr('class', `scpl-gridline`)

	yLines
		.append('text')
		.attr('dx', yStopsInset ? padding : padding - 4)
		.attr('dy', yStopsInset ? -4 : Math.ceil(labelSize/3))
		.attr('class', `scpl-axis__label scpl-axis__label--y` + (yStopsInset ? `scpl-axis__label--y--inset` : ''))
		.style('font-size', labelSize + 'px')
		.text(yFormat)

	const xLines = axisGroup
		.selectAll(`scpl-line--x`)
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
		.attr('class', `scpl-gridline`)

	xLines
		.append('text')
		.attr('dx', 0)
		.attr('dy', height - paddingBottom + labelSize)
		.attr('class', `scpl-axis__label ` + `scpl-axis__label--x`)
		.style('font-size', labelSize + 'px')
		.text(xFormat)

	const circleLayer = svg
		.append('g')
		.attr('class', `scpl-circles`)

	const gs = circleLayer
		.selectAll(`.scpl-g`)
		.data(data)
		.enter()
		.append('g')
		.attr('transform', d => `translate(${xScale(getX(d))}, ${yScale(getY(d))})`)
		.attr('class', 'scpl-g')

	const circles = gs
		.append('circle')
		.attr('cx', 0)
		.attr('cy', 0)
		.attr('r', d => radiusScale(getR(d)))
		.attr('class', d => {
			const base = `scpl-circle`
			return `${base} ${ getCircleClass(d) }`
		})
		.attr('id', getId)

	const labels = gs
		.filter( d => getLabel(d) !== null)
		.append('text')
		.attr('x', 0)
		.attr('y', d => -radiusScale(getR(d)) - 4)
		.attr('class', 'scpl-label')
		.text(d => getLabel(d))

	Object.keys(styles).forEach(k => {
		circles.style(k, styles[k])
	})

	if(fitLine){

		const lineOf = svg
			.append('line')
			.attr('x1', xScale(p1[0]))
			.attr('y1', yScale(p1[1]))
			.attr('x2', xScale(p2[0]))
			.attr('y2', yScale(p2[1]))
			.attr('class', `scpl-best-fit`)

	}

	if(title !== '') {

		const titleText = svg
			.append('text')
			.attr('x', width/2)
			.attr('y', padding - labelSize - 8)
			.attr('class', `scpl-title ${classTitle}`)

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

	return dom.window.document.querySelector('svg').outerHTML

}

export default { plot }