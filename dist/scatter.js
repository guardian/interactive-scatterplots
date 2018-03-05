'use strict';

var jsdom = require('jsdom');
var d3Array = require('d3-array');
var d3Scale = require('d3-scale');
var d3Selection = require('d3-selection');
var d3Voronoi = require('d3-voronoi');

const d3 = Object.assign({}, d3Array, d3Scale, d3Selection, d3Voronoi);

const DEFAULT_CIRCLE_SIZE = 6;

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
	
	const b = pearson(xVals, yVals)*sd(yVals)/sd(xVals);
	const a = mean(yVals) - b*mean(xVals);

	return {
		forward : x => a + b*x,  
		invert : y => (y - a)/b
	}
	
};

const uniformColour = row => '';
const uniformSize = radius => 1; // or literally any other number

const round = (value, exp) => {
	if (typeof exp === 'undefined' || +exp === 0)
		return Math.round(value)

	value = +value;
	exp = +exp;

	if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0))
		return NaN

	// Shift
	value = value.toString().split('e');
	value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp)));

	// Shift back
	value = value.toString().split('e');
	return +(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp))
};

const niceify = (n, down = true) => {
	if(n === 0) return 0

	const a = Math.abs(n);
	const oom = Math.floor(Math.log(a)/Math.LN10 + 0.00000001); // floating point bs

	const r = (down && n > 0 || !down && n < 0) ? Math.floor(a/Math.pow(10, oom))*Math.pow(10, oom) :
		Math.ceil(a/Math.pow(10, oom))*Math.pow(10, oom);

	return n < 0 ? -1*r : r

};

const niceExtent = data => {
	const [min, max] = d3.extent(data);
	return [niceify(min), niceify(max, false)]
};

const quarterStops = extent => {
	return [0.25, 0.5, 0.75].map(i => round(extent[0] + i*(extent[1]-extent[0]), 5))
};

const plot = (input, x, y,
	// default options (ES6 defaults patterm)
{

	r = DEFAULT_CIRCLE_SIZE,
	rScale = uniformSize,
	xExtent = niceExtent,
	yExtent = niceExtent,
	xStops = quarterStops,
	yStops = quarterStops,
	xFormat = d => round(d, 3),
	yStopsInset = false,
	xLabel = 'x axis',
	yFormat = d => round(d, 3),
	yLabel = 'y axis',
	yLabelRight = false,
	fitLine = false,
	classCircles = uniformColour,
	styleCircles = () => {},
	id = 'name',
	width = 400,
	height = 400,
	padding = { top : 40, right : 40, bottom : 40, left : 40 },
	title = '',
	classTitle = '',
	labelSize = 13,
	label = () => null,
	voronoi = false

} = {}) => {

	const dom = new jsdom.JSDOM(`<svg class='scpl-plot' width='${width}' height='${height}'></svg>`);
	const svg = d3.select(dom.window.document.querySelector('svg'));

	const getX = (typeof x === 'function') ? x : row => parseFloat(row[x]);
	const getY = (typeof y === 'function') ? y : row => parseFloat(row[y]);
	const getR = (typeof rScale === 'function') ? rScale : row => parseFloat(row[rScale]);
	const getId = (typeof id === 'function') ? id : row => row[id];
	const getLabel = label;

	const getCircleClass = (typeof classCircles === 'function') ? classCircles : row => classCircles;

	const data = input.filter(row => !isNaN(getX(row)) && !isNaN(getY(row)) && !isNaN(getR(row)));

	const xExtentArr = (typeof xExtent === 'function') ? xExtent(data.map(getX)) : xExtent;
	const yExtentArr = (typeof yExtent === 'function') ? yExtent(data.map(getY)) : yExtent;
	const xStopsArr = (typeof xStops === 'function') ? xStops(xExtentArr) : xStops;
	const yStopsArr = (typeof yStops === 'function') ? yStops(yExtentArr) : yStops;

	const styles = styleCircles;

	const xScale = d3.scaleLinear()
		.domain(xExtentArr)
		.range([padding.left, width-padding.right]);

	const yScale = d3.scaleLinear()
		.domain(yExtentArr)
		.range([height-padding.bottom, padding.top]);

	const radiusScale = d3.scaleSqrt()
		.domain([0, d3.max(data.map(getR))])
		.range([0, r]);

	const axisGroup = svg
		.append('g')
		.attr('class', `scpl-axes`);

	const circleLayer = svg
		.append('g')
		.attr('class', `scpl-circles`);

	// Put axis labels on top of circles (for inset y labels)

	const axisLabelGroup = svg
		.append('g')
		.attr('class', `scpl-axis__labels`);

	const yLines = axisGroup
		.selectAll(`scpl-line--y`)
		.data(yStopsArr)
		.enter()
		.append('line')
		.attr('x1', padding.left)
		.attr('x2', width-padding.right)
		.attr('y1', yScale)
		.attr('y2', yScale)
		.attr('class', `scpl-gridline scpl-line--y`);

	const yLineLabels = axisLabelGroup
		.selectAll('scpl-axis__label scpl-axis__label--y')
		.data(yStopsArr)
		.enter()
		.append('text')
		.attr('x', yStopsInset ? padding.left : padding.left - 4)
		.attr('y', d => yStopsInset ? yScale(d) - 4 : yScale(d) + Math.ceil(labelSize/3))
		.attr('class', `scpl-axis__label scpl-axis__label--y` + (yStopsInset ? `scpl-axis__label--y--inset` : ''))
		.style('font-size', labelSize + 'px')
		.text(yFormat);

	const yAxisTitle = axisLabelGroup
		.append('text')
		.text(yLabel)
		.attr('x', yLabelRight ? width - 20 : 20 )
		.attr('y', padding.top + (height - padding.top - padding.bottom)/2)
		.attr('class', 'scpl-axis__title scpl-axis__title--y')
		.attr('transform', `rotate(270, ${ yLabelRight ? width - 20 : 20 }, ${ padding.top + (height - padding.top - padding.bottom)/2 })`);

	const xLines = axisGroup
		.selectAll(`scpl-line--x`)
		.data(xStopsArr)
		.enter()
		.append('line')
		.attr('x1', xScale)
		.attr('x2', xScale)
		.attr('y1', padding.top)
		.attr('y2', height-padding.bottom)
		.attr('class', `scpl-gridline scpl-line--x`);

	const xLineLabels = axisLabelGroup
		.selectAll('scpl-axis__label scpl-axis__label--x')
		.data(xStopsArr)
		.enter()
		.append('text')
		.attr('x', xScale)
		.attr('y', height - padding.bottom + labelSize)
		.attr('class', `scpl-axis__label ` + `scpl-axis__label--x`)
		.style('font-size', labelSize + 'px')
		.text(xFormat);

	const xAxisTitle = axisLabelGroup
		.append('text')
		.text(xLabel)
		.attr('x', width/2)
		.attr('y', height - 4)
		.attr('class', 'scpl-axis__title scpl-axis__title--x');

	const circles = circleLayer
		.selectAll(`.scpl-circle`)
		.data(data)
		.enter()
		.append('circle')
		.attr('cx', d => xScale(getX(d)))
		.attr('cy', d => yScale(getY(d)))
		.attr('r', d => radiusScale(getR(d)))
		.attr('class', d => {
			const base = `scpl-circle`;
			return `${base} ${ getCircleClass(d) }`
		})
		.attr('data-id', getId)
		.each(function(d) {
			const circle = d3.select(this);
			const stylesObject = styles(d);

			if(typeof stylesObject === 'object') {
				Object.keys(stylesObject).forEach(k => {
					circle.style(k, stylesObject[k]);
				});
			}
		});

	const labelLayer = svg
		.append('g')
		.attr('class', 'scpl-labels');

	const labels = labelLayer
		.selectAll('.scpl-label')
		.data(data.filter(d => label(d) !== null))
		.enter()
		.append('text')
		.attr('x', d => xScale(getX(d)))
		.attr('y', d => yScale(getY(d)) -radiusScale(getR(d)) - 4)
		.attr('class', 'scpl-label')
		.attr('data-id', getId)
		.text(getLabel);

	if(fitLine) {

		const bestFit = leastSquares(data.map(getX), data.map(getY));

		const yMax = d3.max(yExtentArr);
		const yMin = d3.min(yExtentArr);

		let p1 = [d3.min(data.map(getX)), bestFit.forward(d3.min(data.map(getX)))];
		let p2 = [d3.max(data.map(getX)), bestFit.forward(d3.max(data.map(getX)))];

		if(p1[1] > yMax) {
			p1 = [ bestFit.invert( yMax ), yMax ];
		} else if(p1[1] < yMin) {
			p1 = [ bestFit.invert( yMin ), yMin ];
		}

		if(p2[1] > yMax) {
			p2 = [ bestFit.invert( yMax ), yMax ];
		} else if(p1[1] < yMin) {
			p2 = [ bestFit.invert( yMin ), yMin ];
		}

		const lineOf = svg
			.append('line')
			.attr('x1', xScale(p1[0]))
			.attr('y1', yScale(p1[1]))
			.attr('x2', xScale(p2[0]))
			.attr('y2', yScale(p2[1]))
			.attr('class', `scpl-best-fit`);

		const rSquared = svg
			.append('text')
			.attr('x', xScale(p2[0]))
			.attr('y', yScale(p2[1]) - 4)
			.text(`r²: ${round(pearson(data.map(getX), data.map(getY))**2, 2)}`)
			.attr('class', 'scpl-r-squared');

	}

	if(voronoi) {

		const voronoiGen = d3.voronoi()
			.x(d => xScale(getX(d)))
			.y(d => yScale(getY(d)))
			.extent([[ padding.left, padding.top ], [ width - padding.right, height - padding.bottom ]]);

		const voronoiCells = voronoiGen(data).polygons();

		const voronoiLayer = svg
			.append('g')
			.attr('class', 'scpl-voronois');

		const voronoiPolygons = voronoiLayer
			.selectAll('.scpl-voronoi')
			.data(voronoiCells.filter(d => d))
			.enter()
			.append('path')
			.attr('d', cell => "M" + cell.join("L") + "Z")
			.attr('class', 'scpl-voronoi')
			.attr('data-id', d => getId(d.data));

	}

	if(title !== '') {

		const titleText = svg
			.append('text')
			.attr('x', padding.left + (width - padding.left - padding.right)/2)
			.attr('y', padding.top - labelSize - 8)
			.attr('class', `scpl-title ${classTitle}`);

		const lines = title.split('\n');
		const spans = titleText
			.selectAll('tspan')
			.data(lines.map(l => l.trim()))
			.enter()
			.append('tspan')
			.attr('x', padding.left + (width - padding.left - padding.right)/2)
			.attr('dy', (d, i) => i*labelSize)
			.text(line => line);
	}

	return dom.window.document.querySelector('svg').outerHTML

};

var index = { plot };

module.exports = index;
