"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _underscore = require("underscore");

var _underscore2 = _interopRequireDefault(_underscore);

var _merge = require("merge");

var _merge2 = _interopRequireDefault(_merge);

var _moment = require("moment");

var _moment2 = _interopRequireDefault(_moment);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _reactDom = require("react-dom");

var _reactDom2 = _interopRequireDefault(_reactDom);

var _propTypes = require("prop-types");

var _propTypes2 = _interopRequireDefault(_propTypes);

var _d3Axis = require("d3-axis");

var _d3Selection = require("d3-selection");

require("d3-selection-multi");

var _d3Time = require("d3-time");

var _d3TimeFormat = require("d3-time-format");

var _pondjs = require("pondjs");

require("moment-duration-format");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *  Copyright (c) 2015-present, The Regents of the University of California,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *  through Lawrence Berkeley National Laboratory (subject to receipt
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *  of any required approvals from the U.S. Dept. of Energy).
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *  All rights reserved.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *  This source code is licensed under the BSD-style license found in the
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *  LICENSE file in the root directory of this source tree.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

// eslint-disable-line


function scaleAsString(scale) {
    return scale.domain().toString() + "-" + scale.range().toString();
}

var defaultStyle = {
    values: {
        stroke: "none",
        fill: "#8B7E7E", // Default value color
        fontWeight: 100,
        fontSize: 11,
        font: '"Goudy Bookletter 1911", sans-serif"'
    },
    ticks: {
        fill: "none",
        stroke: "#C0C0C0"
    },
    axis: {
        fill: "none",
        stroke: "#C0C0C0"
    }
};

var millisecondSecond = 1000;
var millisecondMinute = 60000;
var millisecondHour = 3600000;
var milliSecondDay = 86400000;
var millisecondMonth = 2592000000; // Rough; based on 30 days‬
var millisecondYear = 31104000000; // Rough; based on 12, 30-day months

var formatMillisecond = (0, _d3TimeFormat.timeFormat)(".%L");
var formatSecond = (0, _d3TimeFormat.timeFormat)(":%S");
var formatMinute = (0, _d3TimeFormat.timeFormat)("%I:%M");
var formatHour = (0, _d3TimeFormat.timeFormat)("%I %p");
var formatDay = (0, _d3TimeFormat.timeFormat)("%a %d");
var formatWeek = (0, _d3TimeFormat.timeFormat)("%b %d");
var formatMonth = (0, _d3TimeFormat.timeFormat)("%B");
var formatYear = (0, _d3TimeFormat.timeFormat)("%Y");

/**
 * Return a time format based on the smallest time difference between the timestamp and its value as milliseconds,
 * seconds, minutes, etc.  This is fed the results from the smoothing function.
 * @param date
 */
function multiTimeFormat(date) {
    var value = ((0, _d3Time.timeSecond)(date) < date ? formatMillisecond : (0, _d3Time.timeMinute)(date) < date ? formatSecond : (0, _d3Time.timeHour)(date) < date ? formatMinute : (0, _d3Time.timeDay)(date) < date ? formatHour : (0, _d3Time.timeMonth)(date) < date ? (0, _d3Time.timeWeek)(date) < date ? formatDay : formatWeek : (0, _d3Time.timeYear)(date) < date ? formatMonth : formatYear)(date);

    // console.log('milli', timeSecond(date), date, date.valueOf(), timeSecond(date) < date);
    // console.log('minute', timeMinute(date), date, date.valueOf(), timeMinute(date) < date);
    // console.log('hour', timeHour(date), date, date.valueOf(), timeHour(date) < date);
    // console.log('day', timeDay(date), date, date.valueOf(), timeDay(date) < date);
    // console.log('month', timeMonth(date), date, date.valueOf(), timeMonth(date) < date);
    // console.log('year', timeYear(date), date, date.valueOf(), timeYear(date) < date);
    //
    // console.log('VALUE', value);

    return value;
}

/**
 * Round down the last piece of the timestamp (milliseconds, seconds, minutes, etc) based on the overall TimeRange
 * in place and return a new array.
 * @param dateArray
 * @param timeRange
 */
function smoothOutTimeEntries(dateArray, timeRange) {
    var timeRangeDiff = timeRange.end().valueOf() - timeRange.begin().valueOf();

    console.log('TIME DIFF', timeRangeDiff);

    return dateArray.map(function (date) {
        switch (true) {
            case timeRangeDiff < millisecondSecond:
                // Less that a second, return timestamp as is (precise to the millisecond)
                console.log('LESS THAN A SECOND');
                return date;
                break;
            case timeRangeDiff < millisecondMinute:
                // Less that a minute (dealing with seconds), return timestamp with milliseconds removed (precise to
                // the second)
                console.log('LESS THAN A MINUTE');
                return new Date(date.setMilliseconds(0));
                break;
            case timeRangeDiff <= millisecondHour:
                // Less than an hour (dealing with minutes), return timestamp with seconds removed (precise to the minute)
                console.log('LESS THAN AN HOUR');
                return new Date(date.setSeconds(0, 0));
                break;
            case timeRangeDiff <= milliSecondDay:
                console.log('LESS THAN A DAY');
                // Less than an day (dealing with hours), return timestamp with minutes removed (precise to the hour)
                return new Date(date.setMinutes(0, 0, 0));
                break;
            case timeRangeDiff <= millisecondMonth:
                console.log('LESS THAN A MONTH');
                // Less than a month (dealing with days), return timestamp with hours removed (precise to the day)
                return new Date(date.setHours(0, 0, 0, 0));
                break;
            case timeRangeDiff <= millisecondYear:
                console.log('LESS THAN A YEAR');
                // Less than a year (dealing with months), return timestamp with days removed (precise to the month)
                var monthHoursRemoved = new Date(date.setHours(0, 0, 0, 0));
                return new Date(monthHoursRemoved.setDate(1));
                break;
            default:
                console.log('GRATER THAN A YEAR');
                // More than a year (dealing with years), return timestamp with months removed (precise to the year)
                var yearHoursRemoved = new Date(date.setHours(0, 0, 0, 0));
                return new Date(yearHoursRemoved.setMonth(0, 1));
                break;
        }
    });
}

/**
 * Renders a horizontal time axis. This is used internally by the ChartContainer
 * as a result of you specifying the timerange for the chart. Please see the API
 * docs for ChartContainer for more information.
 */

var TimeAxis = function (_React$Component) {
    _inherits(TimeAxis, _React$Component);

    function TimeAxis() {
        _classCallCheck(this, TimeAxis);

        return _possibleConstructorReturn(this, (TimeAxis.__proto__ || Object.getPrototypeOf(TimeAxis)).apply(this, arguments));
    }

    _createClass(TimeAxis, [{
        key: "componentDidMount",
        value: function componentDidMount() {
            var _props = this.props,
                scale = _props.scale,
                format = _props.format,
                showGrid = _props.showGrid,
                gridHeight = _props.gridHeight;

            this.renderTimeAxis(scale, format, showGrid, gridHeight);
        }
    }, {
        key: "componentWillReceiveProps",
        value: function componentWillReceiveProps(nextProps) {
            var scale = nextProps.scale,
                utc = nextProps.utc,
                format = nextProps.format,
                showGrid = nextProps.showGrid,
                gridHeight = nextProps.gridHeight;

            if (scaleAsString(this.props.scale) !== scaleAsString(scale) || this.props.utc !== utc || this.props.showGrid !== showGrid || this.props.gridHeight !== gridHeight) {
                this.renderTimeAxis(scale, format, showGrid, gridHeight);
            }
        }

        // Force the component not to update because d3 will control the
        // DOM from this point down.

    }, {
        key: "shouldComponentUpdate",
        value: function shouldComponentUpdate() {
            // eslint-disable-line
            return false;
        }
    }, {
        key: "mergeStyles",
        value: function mergeStyles(style) {
            return {
                valueStyle: (0, _merge2.default)(true, defaultStyle.values, this.props.style.values ? this.props.style.values : {}),
                tickStyle: (0, _merge2.default)(true, defaultStyle.ticks, this.props.style.ticks ? this.props.style.ticks : {})
            };
        }
    }, {
        key: "renderTimeAxis",
        value: function renderTimeAxis(scale, format, showGrid, gridHeight) {
            var axis = void 0;

            var tickSize = showGrid ? -gridHeight : 10;
            var utc = this.props.utc;
            var tickCount = this.props.tickCount;
            var timeRange = this.props.timeRange;
            var style = this.mergeStyles(this.props.style);
            var tickStyle = style.tickStyle,
                valueStyle = style.valueStyle;


            if (tickCount > 0) {
                var beginningTimestamp = timeRange.begin().valueOf();
                var endTimestamp = timeRange.end().valueOf();
                var timeIteration = (endTimestamp - beginningTimestamp) / tickCount;
                var tickValues = [];
                for (var i = 1; i <= tickCount; i++) {
                    tickValues.push(new Date(beginningTimestamp + timeIteration * i));
                }
                tickValues = smoothOutTimeEntries(tickValues, timeRange);

                // format = "day";

                // console.log('TICK COUNT', tickCount);
                // console.log('FORMAT', format);
                // console.log('TICK VALUES', tickValues);

                if (format === "day") {
                    axis = (0, _d3Axis.axisBottom)(scale)
                    // .tickArguments([utc ? utcDay : timeDay, 1, tickCount])
                    .tickValues(tickValues).tickFormat((0, _d3TimeFormat.timeFormat)("%d")).tickSizeOuter(0);
                } else if (format === "month") {
                    axis = (0, _d3Axis.axisBottom)(scale)
                    // .tickArguments([utc ? utcMonth : timeMonth, 1, tickCount])
                    .tickValues(tickValues).tickFormat((0, _d3TimeFormat.timeFormat)("%B")).tickSizeOuter(0);
                } else if (format === "year") {
                    axis = (0, _d3Axis.axisBottom)(scale)
                    // .tickArguments([utc ? utcYear : timeYear, 1, tickCount])
                    .tickValues(tickValues).tickFormat((0, _d3TimeFormat.timeFormat)("%Y")).tickSizeOuter(0);
                } else if (format === "relative") {
                    axis = (0, _d3Axis.axisBottom)(scale)
                    // .ticks(tickCount)
                    .tickValues(tickValues).tickFormat(function (d) {
                        return _moment2.default.duration(+d).format();
                    }).tickSizeOuter(0);
                } else if (_underscore2.default.isString(format)) {
                    axis = (0, _d3Axis.axisBottom)(scale)
                    // .ticks(tickCount)
                    .tickValues(tickValues).tickFormat((0, _d3TimeFormat.timeFormat)(format)).tickSizeOuter(0);
                } else if (_underscore2.default.isFunction(format)) {
                    axis = (0, _d3Axis.axisBottom)(scale)
                    // .ticks(tickCount)
                    .tickValues(tickValues).tickFormat(format).tickSizeOuter(0);
                } else {

                    console.log('AXIS');

                    axis = (0, _d3Axis.axisBottom)(scale)
                    // .ticks(tickCount)
                    // .ticks(timeHour.every(5))
                    .tickValues(tickValues)
                    // .tickArguments([tickCount])
                    .tickFormat(multiTimeFormat);
                    // .tickSize(0);
                }
            } else {
                if (format === "day") {
                    axis = (0, _d3Axis.axisBottom)(scale).tickArguments([utc ? _d3Time.utcDay : _d3Time.timeDay, 1]).tickFormat((0, _d3TimeFormat.timeFormat)("%d")).tickSizeOuter(0);
                } else if (format === "month") {
                    axis = (0, _d3Axis.axisBottom)(scale).tickArguments([utc ? _d3Time.utcMonth : _d3Time.timeMonth, 1]).tickFormat((0, _d3TimeFormat.timeFormat)("%B")).tickSizeOuter(0);
                } else if (format === "year") {
                    axis = (0, _d3Axis.axisBottom)(scale).tickArguments([utc ? _d3Time.utcYear : _d3Time.timeYear, 1]).tickFormat((0, _d3TimeFormat.timeFormat)("%Y")).tickSizeOuter(0);
                } else if (format === "relative") {
                    axis = (0, _d3Axis.axisBottom)(scale).tickFormat(function (d) {
                        return _moment2.default.duration(+d).format();
                    }).tickSizeOuter(0);
                } else if (_underscore2.default.isString(format)) {
                    axis = (0, _d3Axis.axisBottom)(scale).tickFormat((0, _d3TimeFormat.timeFormat)(format)).tickSizeOuter(0);
                } else if (_underscore2.default.isFunction(format)) {
                    axis = (0, _d3Axis.axisBottom)(scale).tickFormat(format).tickSizeOuter(0);
                } else {
                    axis = (0, _d3Axis.axisBottom)(scale).tickSize(0);
                }
            }

            // Remove the old axis from under this DOM node
            (0, _d3Selection.select)(_reactDom2.default.findDOMNode(this)).selectAll("*").remove(); // eslint-disable-line
            //
            // Draw the new axis
            //
            (0, _d3Selection.select)(_reactDom2.default.findDOMNode(this)) // eslint-disable-line
            .append("g").attr("class", "x axis").style("stroke", "none").styles(valueStyle).call(axis.tickSize(tickSize));

            if (this.props.angled) {
                (0, _d3Selection.select)(_reactDom2.default.findDOMNode(this)) // eslint-disable-line
                .select("g").selectAll(".tick").select("text").styles(valueStyle).style("text-anchor", "end").attr("dx", "-1.2em").attr("dy", "0em").attr("transform", function (d) {
                    return "rotate(-65)";
                });
            } else {
                (0, _d3Selection.select)(_reactDom2.default.findDOMNode(this)) // eslint-disable-line
                .select("g").selectAll(".tick").select("text").styles(valueStyle);
            }
            (0, _d3Selection.select)(_reactDom2.default.findDOMNode(this)) // eslint-disable-line
            .select("g").selectAll(".tick").select("line").styles(tickStyle);

            (0, _d3Selection.select)(_reactDom2.default.findDOMNode(this)).select("g").select("path").remove();
        }
    }, {
        key: "render",
        value: function render() {
            return _react2.default.createElement("g", null);
        }
    }]);

    return TimeAxis;
}(_react2.default.Component);

exports.default = TimeAxis;


TimeAxis.defaultProps = {
    showGrid: false,
    style: defaultStyle,
    angled: false
};

TimeAxis.propTypes = {
    scale: _propTypes2.default.func.isRequired,
    showGrid: _propTypes2.default.bool,
    angled: _propTypes2.default.bool,
    gridHeight: _propTypes2.default.number,
    format: _propTypes2.default.oneOfType([_propTypes2.default.string, _propTypes2.default.func]),
    utc: _propTypes2.default.bool,
    style: _propTypes2.default.shape({
        label: _propTypes2.default.object, // eslint-disable-line
        values: _propTypes2.default.object, // eslint-disable-line
        axis: _propTypes2.default.object // eslint-disable-line
    }),
    tickCount: _propTypes2.default.number,
    timeRange: _propTypes2.default.instanceOf(_pondjs.TimeRange)
};