# interactive-scatterplots

## Installation

```
npm install guardian/interactive-scatterplots
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

The `options` object can be used to set the following:

* `width`
* `height`
* `fitLine` whether to draw the line of best fit (default: `false`)
* `r` a constant radius for each circle
* `xExtent`/`yExtent` the extent of the chart in either dimension
* `xStops`/`yStops` the values at which to draw grid lines in the background
* `classCircles` a function specifying which classes to append to each circle
* `styleCircles` an object mapping CSS properties to strings or functions to dynamically style circles based on data
* `title` the chart's title
* `labelSize` the font size to use for axis labels
* `padding` padding around the chart's grid to fit axis labels and chart title
* ... full docs to follow
