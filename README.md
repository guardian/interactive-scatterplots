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

* `width`
* `height`
* `fitLine` whether to draw the line of best fit (default: `false`)
* more tbc ...
