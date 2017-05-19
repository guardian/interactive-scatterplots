'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var d3 = require('d3');
var D3Node = _interopDefault(require('d3-node'));

const CIRCLE_SIZE = 6;

const sum = (a, b) => a + b;
const mean = xVals => xVals.reduce(sum)/xVals.length;

const sd = xVals => {
	const mu = mean(xVals);
	return Math.sqrt(1/xVals.length*xVals.map(x => (x-mu)*(x-mu)).reduce(sum))
};

const pearson = (xVals, yVals) => {
	const p = 
		xVals.map((x, i) => (x-mean(xVals))*(yVals[i]-mean(yVals))).reduce(sum)
		/
		(Math.sqrt(xVals.map((x, i) => Math.pow(x-mean(xVals), 2)).reduce(sum))*Math.sqrt(yVals.map((y, i) => Math.pow(y-mean(yVals), 2)).reduce(sum)));
	return p

};

const leastSquares = (xVals, yVals) => {
	return x => {
		const b = pearson(xVals, yVals)*sd(yVals)/sd(xVals);
		const a = mean(yVals) - b*mean(xVals);
		return a + b*x
	}
};

const uniformColour = row => '';
const uniformSize = radius => Math.PI; // or literally any other number

const round = (n, down = true) => {
	if(n === 0) return 0

	const oom = Math.floor(Math.log(n)/Math.LN10 + 0.00000001); // floating point bs

	return down ? Math.floor(n/Math.pow(10, oom))*Math.pow(10, oom) :
		Math.ceil(n/Math.pow(10, oom))*Math.pow(10, oom)

};

const niceExtent = data => {
	const [min$$1, max$$1] = d3.extent(data);
	return [round(min$$1), round(max$$1, false)]
};

const quarterStops = extent$$1 => {
	return [0.25, 0.5, 0.75].map(i => extent$$1[0] + i*(extent$$1[1]-extent$$1[0]))
};

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
	xLabel = 'x axis',
	yFormat = d => parseInt(d*100) + '%',
	yLabel = 'y axis',
	fitLine = false,
	classCircles = uniformColour,
	id = 'name',
	width = 400,
	height = 400,
	margin = 32,
	labelSize = 13

} = {}) => {

	const d3n = new D3Node();
	const svg = d3n.createSVG(width, height);

	const getX = (typeof x === 'function') ? x : row => parseFloat(row[x]);
	const getY = (typeof y === 'function') ? y : row => parseFloat(row[y]);
	const getR = (typeof r === 'function') ? r : row => parseFloat(row[r]);
	const getId = (typeof id === 'function') ? id : row => row[id];

	const data = input.filter(row => !isNaN(getX(row)) && !isNaN(getY(row)));

	const xExtentArr = (typeof xExtent === 'function') ? xExtent(data.map(getX)) : xExtent;
	const yExtentArr = (typeof yExtent === 'function') ? yExtent(data.map(getY)) : yExtent;
	const xStopsArr = (typeof xStops === 'function') ? xStops(xExtentArr) : xStops;
	const yStopsArr = (typeof yStops === 'function') ? yStops(yExtentArr) : yStops;

	const xScale = d3.scaleLinear()
		.domain(xExtentArr)
		.range([margin, width-margin]);

	const yScale = d3.scaleLinear()
		.domain(yExtentArr)
		.range([height-margin, margin]);

	const rScale = d3.scaleSqrt()
		.domain([0, d3.max(data.map(getR))])
		.range([0, maxR]);

	const bestFit = leastSquares(data.map(getX), data.map(getY));
	const p1 = [d3.min(data.map(getX)), bestFit(d3.min(data.map(getX)))];
	const p2 = [d3.max(data.map(getX)), bestFit(d3.max(data.map(getX)))];

	const axisGroup = svg
		.append('g')
		.attr('class', 'ge-axes');

	const yLines = axisGroup
		.selectAll('ge-line--y')
		.data(yStopsArr)
		.enter()
		.append('g')
		.attr('transform', d => `translate(0, ${yScale(d)})`);

	yLines
		.append('line')
		.attr('x1', margin)
		.attr('x2', width-margin)
		.attr('y1', 0)
		.attr('y2', 0)
		.attr('class', 'ge-gridline');

	yLines
		.append('text')
		.attr('dx', margin - 4)
		.attr('dy', 4)
		.attr('class', 'ge-axis-label--y')
		.style('font-size', labelSize + 'px')
		.text(yFormat);

	const xLines = axisGroup
		.selectAll('ge-line--x')
		.data(xStopsArr)
		.enter()
		.append('g')
		.attr('transform', d => `translate(${xScale(d)}, 0)`);


	xLines
		.append('line')
		.attr('x1', 0)
		.attr('x2', 0)
		.attr('y1', margin)
		.attr('y2', height-margin)
		.attr('class', 'ge-gridline');

	xLines
		.append('text')
		.attr('dx', 0)
		.attr('dy', height - margin + labelSize)
		.attr('class', 'ge-axis-label--x')
		.style('font-size', labelSize + 'px')
		.text(xFormat);


	const circleGroup = svg
		.append('g')
		.attr('class', 'ge-circles');

	const circles = circleGroup
		.selectAll('.ge-circle')
		.data(data)
		.enter()
		.append('circle')
		.attr('cx', d => xScale(getX(d)))
		.attr('cy', d => yScale(getY(d)))
		.attr('r', d => rScale(getR(d)))
		.attr('class', d => {
			const base = 'ge-circle';
			return `${base} ${ classCircles(d) }`
		})
		.attr('id', getId);

	if(fitLine){

		const lineOf = svg
			.append('line')
			.attr('x1', xScale(p1[0]))
			.attr('y1', yScale(p1[1]))
			.attr('x2', xScale(p2[0]))
			.attr('y2', yScale(p2[1]))
			.attr('class', 'ge-best-fit');

	}

	return d3n.svgString()

};

var index = { plot };

module.exports = index;
