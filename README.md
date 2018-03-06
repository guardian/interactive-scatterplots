# interactive-scatterplots

## Installation

```
npm install interactive-scatterplots
```

## API

```
import scatter from 'interactive-scatterplots'

const svg = scatter.plot(data, x, y[, options])
```

## Parameters

* `data` an array of rows
* `x` a column name string or function specifying which data to use on the x axis
* `y` a column name string or function specifying which data to use on the y axis

## Options

The `options` object can be used to set a number of options. Wherever functions are passed in, they take as their parameter the current data row.

* `width` (number)
* `height`
* `padding` padding around the chart's grid to fit axis labels and chart title. Object with `top`, `right`, `bottom` and `left` properties
* `title` the chart's title
* `r` the (constant) radius for each circle
* `rScale` a column name string or function to dynamically scale circle radii between 0 and `r` instead
* `id` a column name string or function to use as `data-id` property on each circle, associated label and voronoi polygon
* `xExtent`/`yExtent` the extent of the chart in either dimension
* `xStops`/`yStops` the values at which to draw grid lines in the background
* `xLabel`/`yLabel` the labels describing the two axes
* `classCircles` a function returning a class string for each circle
* `styleCircles` a function returning a CSS properties object for each circle
* `label` a function returning a circle's label string, or `null` if it shouldn't be labelled
* `fitLine` whether to draw a line of best fit
* `voronoi` whether to compute and draw a voronoi grid overlay
* ... full docs to follow

## Default styles

These can be found in `dist/scatter.css`. To import them in Sass:

```
@import 'node_modules/interactive-scatterplots/dist/scatter';
```