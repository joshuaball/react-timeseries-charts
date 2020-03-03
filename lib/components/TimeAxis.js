"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _underscore = require("underscore");

var _underscore2 = _interopRequireDefault(_underscore);

var _momentTimezone = require("moment-timezone");

var _momentTimezone2 = _interopRequireDefault(_momentTimezone);

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

// Millisecond value constants
var MILLISECOND_SECOND = 1000;
var MILLISECOND_MINUTE = 60000;
var MILLISECOND_HOUR = 3600000;
var MILLISECOND_DAY = 86400000;
var MILLISECOND_MONTH = 2592000000; // Rough; based on 30 days‬
var MILLISECOND_YEAR = 31536000000; // Rough; based on 365 days (leap year not accounted for)

// Time formats
var formatMillisecond = ".SSS";
var formatSecond = ":ss";
var formatMinute = "h:mm";
var formatHour = "h A";
var formatDayHour = "ddd Do, h A";
var formatDay = "ddd Do";
var formatWeek = "MMM Do";
var formatMonth = "MMMM";
var formatYearMonth = "MMM YYYY";
var formatYear = "YYYY";

/**
 * Return a time format based on the difference of the start/end values of the passed in TimeRange. Time formats have
 * a bit of overlap and take over when they look roughly correct when graphed without too much duplication of time
 * identifiers (i.e. Trying to limit "January, January, January..." as much as possible in favor of "Jan 05, Jan 15,
 * Jan 22, Jan 31...").
 * @param timeRange
 */
function adjustableTimeFormat(timeRange) {
    var diff = timeRangeDiff(timeRange);
    var buffer = 10;
    switch (true) {
        case diff < MILLISECOND_SECOND:
            // Format as millisecond
            return formatMillisecond;
            break;
        case diff < MILLISECOND_MINUTE * (buffer / 7):
            // Format as second
            return formatSecond;
            break;
        case diff <= MILLISECOND_HOUR * buffer:
            // Format as minute
            return formatMinute;
            break;
        case diff <= MILLISECOND_DAY * (buffer / 7):
            // Format as hour
            return formatHour;
            break;
        case diff <= MILLISECOND_DAY * buffer:
            // Format as day/hour
            return formatDayHour;
            break;
        case diff <= MILLISECOND_MONTH * (buffer / 3):
            // Format as day
            return formatDay;
            break;
        case diff <= MILLISECOND_MONTH * buffer:
            // Format as week
            return formatWeek;
            break;
        case diff <= MILLISECOND_YEAR * 1.5:
            // Format as month
            return formatMonth;
            break;
        case diff <= MILLISECOND_YEAR * 5:
            // Format as year/month
            return formatYearMonth;
            break;
        default:
            // Format as year
            return formatYear;
            break;
    }
}

/**
 * Return a millisecond difference between the start and end values of a timeRange.
 * @param timeRange
 */
function timeRangeDiff(timeRange) {
    return timeRange.end().valueOf() - timeRange.begin().valueOf();
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
            this.renderTimeAxis();
        }

        /**
         * Need a custom comparison of prev/next props so that the scale and timeRange values can be compared
         * appropriately.
         * @param nextProps
         * @returns {boolean}
         */

    }, {
        key: "shouldComponentUpdate",
        value: function shouldComponentUpdate(nextProps) {
            var incoming = Object.assign({}, nextProps);
            var current = Object.assign({}, this.props);

            delete incoming.scale;
            delete incoming.timeRange;
            delete current.scale;
            delete current.timeRange;

            return !_underscore2.default.isEqual(current, incoming) || !this.props.timeRange.equals(nextProps.timeRange) || scaleAsString(this.props.scale) !== scaleAsString(nextProps.scale);
        }
    }, {
        key: "componentDidUpdate",
        value: function componentDidUpdate(prevProps) {
            this.renderTimeAxis();
        }

        /**
         * Build out the axis based on the provided tickValues.  If the the format of the axis is "Auto", create a time
         * display for the tick labels that takes the overall TimeRange into account and provides a label that best
         * matches the tick value based on the amount of time being displayed.  If not "Auto", use what is provided.
         * @param tickValues
         */

    }, {
        key: "buildAutoAxis",
        value: function buildAutoAxis(tickValues) {
            var _props = this.props,
                timeRange = _props.timeRange,
                scale = _props.scale,
                timeZone = _props.timeZone,
                format = _props.format;

            var timeFormat = format !== "Auto" ? format : adjustableTimeFormat(timeRange);

            return (0, _d3Axis.axisBottom)(scale).tickValues(tickValues).tickFormat(function (date) {
                var timezoneExists = timeZone ? _momentTimezone2.default.tz.zone(timeZone) !== null : false;
                if (timezoneExists) {
                    return (0, _momentTimezone2.default)(date).tz(timeZone).format(timeFormat);
                } else {
                    return (0, _momentTimezone2.default)(date).format(timeFormat);
                }
            }).tickSizeOuter(0);
        }
    }, {
        key: "renderTimeAxis",
        value: function renderTimeAxis() {
            var _props2 = this.props,
                scale = _props2.scale,
                format = _props2.format,
                showGrid = _props2.showGrid,
                gridHeight = _props2.gridHeight;

            var axis = void 0;

            var tickSize = showGrid ? -gridHeight : 10;
            var _props3 = this.props,
                utc = _props3.utc,
                style = _props3.style,
                tickCount = _props3.tickCount,
                timeRange = _props3.timeRange;
            var ticks = style.ticks,
                values = style.values;

            var tickStyle = _extends({}, ticks);
            var valueStyle = _extends({}, values);
            var tickClasses = this.props.baseStyleClassRoot + "timeAxis__ticks " + (tickStyle.classes || "");
            var valueClasses = this.props.baseStyleClassRoot + "timeAxis__values " + (valueStyle.classes || "");
            delete tickStyle.classes;
            delete valueStyle.classes;

            if (tickCount > 0) {
                var beginningTimestamp = timeRange.begin().valueOf();
                var endTimestamp = timeRange.end().valueOf();
                var timeIteration = (endTimestamp - beginningTimestamp) / tickCount;
                var tickValues = [];
                var startingPosition = timeIteration / 2;
                for (var i = 0; i < tickCount; i++) {
                    tickValues.push(new Date(beginningTimestamp + startingPosition + timeIteration * i));
                }

                if (format === "day") {
                    axis = (0, _d3Axis.axisBottom)(scale).tickValues(tickValues).tickFormat((0, _d3TimeFormat.timeFormat)("%d")).tickSizeOuter(0);
                } else if (format === "month") {
                    axis = (0, _d3Axis.axisBottom)(scale).tickValues(tickValues).tickFormat((0, _d3TimeFormat.timeFormat)("%B")).tickSizeOuter(0);
                } else if (format === "year") {
                    axis = (0, _d3Axis.axisBottom)(scale).tickValues(tickValues).tickFormat((0, _d3TimeFormat.timeFormat)("%Y")).tickSizeOuter(0);
                } else if (format === "relative") {
                    axis = (0, _d3Axis.axisBottom)(scale).tickValues(tickValues).tickFormat(function (d) {
                        return _momentTimezone2.default.duration(+d).format();
                    }).tickSizeOuter(0);
                } else if (_underscore2.default.isString(format)) {
                    axis = this.buildAutoAxis(tickValues);
                } else if (_underscore2.default.isFunction(format)) {
                    axis = (0, _d3Axis.axisBottom)(scale).tickValues(tickValues).tickFormat(format).tickSizeOuter(0);
                } else {
                    axis = this.buildAutoAxis(tickValues);
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
                        return _momentTimezone2.default.duration(+d).format();
                    }).tickSizeOuter(0);
                } else if (_underscore2.default.isString(format)) {
                    axis = (0, _d3Axis.axisBottom)(scale).tickFormat((0, _d3TimeFormat.timeFormat)(format)).tickSizeOuter(0);
                } else if (_underscore2.default.isFunction(format)) {
                    axis = (0, _d3Axis.axisBottom)(scale).tickFormat(format).tickSizeOuter(0);
                } else {
                    axis = (0, _d3Axis.axisBottom)(scale).tickSizeOuter(0);
                }
            }

            // Remove the old axis from under this DOM node
            (0, _d3Selection.select)(_reactDom2.default.findDOMNode(this)).selectAll("*").remove(); // eslint-disable-line
            //
            // Draw the new axis
            //
            (0, _d3Selection.select)(_reactDom2.default.findDOMNode(this)) // eslint-disable-line
            .append("g").styles(valueStyle).classed(valueClasses, true).call(axis.tickSize(tickSize));

            // Apply style to axis tick labels
            if (this.props.angled) {
                (0, _d3Selection.select)(_reactDom2.default.findDOMNode(this)) // eslint-disable-line
                .select("g").selectAll(".tick").select("text").styles(valueStyle).classed(valueClasses, true).style("text-anchor", "end").attr("dx", "-1.2em").attr("dy", "0em").attr("transform", function (d) {
                    return "rotate(-65)";
                });
            } else {
                (0, _d3Selection.select)(_reactDom2.default.findDOMNode(this)) // eslint-disable-line
                .select("g").selectAll(".tick").select("text").styles(valueStyle).classed(valueClasses, true);
            }

            // Apply style to axis ticks
            (0, _d3Selection.select)(_reactDom2.default.findDOMNode(this)) // eslint-disable-line
            .select("g").selectAll(".tick").select("line").styles(tickStyle).classed(tickClasses, true);

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
    style: {},
    angled: false,
    baseStyleClassRoot: "",
    timeZone: "",
    format: "Auto"
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
    timeRange: _propTypes2.default.instanceOf(_pondjs.TimeRange),
    timeZone: _propTypes2.default.string,
    /**
     * If specified, the base CSS class root used to build class names throughout the inner time series charting
     * components.
     */
    baseStyleClassRoot: _propTypes2.default.string
};