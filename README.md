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
* `padding` padding around the chart's grid to fit axis labels and chart title
* `title` the chart's title
* `labelSize` the font size to use for axis labels
* `r` the (constant) radius for each circle
* `rScale` a column name string or function to dynamically scale circle radii between 0 and `r` instead
* `xExtent`/`yExtent` the extent of the chart in either dimension
* `xStops`/`yStops` the values at which to draw grid lines in the background
* `classCircles` a function specifying which classes to give each circle
* `styleCircles` an object mapping CSS properties to functions (to dynamically style circles based on data)
* ... full docs to follow
