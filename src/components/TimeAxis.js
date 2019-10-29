/**
 *  Copyright (c) 2015-present, The Regents of the University of California,
 *  through Lawrence Berkeley National Laboratory (subject to receipt
 *  of any required approvals from the U.S. Dept. of Energy).
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import _ from "underscore";
import merge from "merge";
import moment from "moment";
import React from "react";
import ReactDOM from "react-dom"; // eslint-disable-line
import PropTypes from "prop-types";
import { axisBottom } from "d3-axis";
import { select } from "d3-selection";
import "d3-selection-multi";
import {
    timeSecond,
    timeMinute,
    timeHour,
    timeDay,
    timeWeek,
    timeMonth,
    timeYear,
    utcDay,
    utcMonth,
    utcYear
} from "d3-time";
import { timeFormat } from "d3-time-format";
import { TimeRange } from "pondjs";

import "moment-duration-format";

function scaleAsString(scale) {
    return `${scale.domain().toString()}-${scale.range().toString()}`;
}

const defaultStyle = {
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

const millisecondSecond = 1000;
const millisecondMinute = 60000;
const millisecondHour = 3600000;
const milliSecondDay = 86400000;
const millisecondMonth = 2592000000; // Rough; based on 30 days‬
const millisecondYear = 31104000000; // Rough; based on 12, 30-day months

const formatMillisecond = timeFormat(".%L");
const formatSecond = timeFormat(":%S");
const formatMinute = timeFormat("%I:%M");
const formatHour = timeFormat("%I %p");
const formatDay = timeFormat("%a %d");
const formatWeek = timeFormat("%b %d");
const formatMonth = timeFormat("%B");
const formatYear = timeFormat("%Y");

/**
 * Return a time format based on the smallest time difference between the timestamp and its value as milliseconds,
 * seconds, minutes, etc.  This is fed the results from the smoothing function.
 * @param date
 */
function multiTimeFormat(date) {
    const value = (timeSecond(date) < date
        ? formatMillisecond
        : timeMinute(date) < date
        ? formatSecond
        : timeHour(date) < date
        ? formatMinute
        : timeDay(date) < date
        ? formatHour
        : timeMonth(date) < date
        ? timeWeek(date) < date
            ? formatDay
            : formatWeek
        : timeYear(date) < date
        ? formatMonth
        : formatYear)(date);

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
    const timeRangeDiff = timeRange.end().valueOf() - timeRange.begin().valueOf();

    console.log("TIME DIFF", timeRangeDiff);

    return dateArray.map(date => {
        switch (true) {
            case timeRangeDiff < millisecondSecond:
                // Less that a second, return timestamp as is (precise to the millisecond)
                console.log("LESS THAN A SECOND");
                return date;
                break;
            case timeRangeDiff < millisecondMinute:
                // Less that a minute (dealing with seconds), return timestamp with milliseconds removed (precise to
                // the second)
                console.log("LESS THAN A MINUTE");
                return new Date(date.setMilliseconds(0));
                break;
            case timeRangeDiff <= millisecondHour:
                // Less than an hour (dealing with minutes), return timestamp with seconds removed (precise to the minute)
                console.log("LESS THAN AN HOUR");
                return new Date(date.setSeconds(0, 0));
                break;
            case timeRangeDiff <= milliSecondDay:
                console.log("LESS THAN A DAY");
                // Less than an day (dealing with hours), return timestamp with minutes removed (precise to the hour)
                return new Date(date.setMinutes(0, 0, 0));
                break;
            case timeRangeDiff <= millisecondMonth:
                console.log("LESS THAN A MONTH");
                // Less than a month (dealing with days), return timestamp with hours removed (precise to the day)
                return new Date(date.setHours(0, 0, 0, 0));
                break;
            case timeRangeDiff <= millisecondYear:
                console.log("LESS THAN A YEAR");
                // Less than a year (dealing with months), return timestamp with days removed (precise to the month)
                const monthHoursRemoved = new Date(date.setHours(0, 0, 0, 0));
                return new Date(monthHoursRemoved.setDate(1));
                break;
            default:
                console.log("GRATER THAN A YEAR");
                // More than a year (dealing with years), return timestamp with months removed (precise to the year)
                const yearHoursRemoved = new Date(date.setHours(0, 0, 0, 0));
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
export default class TimeAxis extends React.Component {
    componentDidMount() {
        const { scale, format, showGrid, gridHeight } = this.props;
        this.renderTimeAxis(scale, format, showGrid, gridHeight);
    }

    componentWillReceiveProps(nextProps) {
        const { scale, utc, format, showGrid, gridHeight } = nextProps;
        if (
            scaleAsString(this.props.scale) !== scaleAsString(scale) ||
            this.props.utc !== utc ||
            this.props.showGrid !== showGrid ||
            this.props.gridHeight !== gridHeight
        ) {
            this.renderTimeAxis(scale, format, showGrid, gridHeight);
        }
    }

    // Force the component not to update because d3 will control the
    // DOM from this point down.
    shouldComponentUpdate() {
        // eslint-disable-line
        return false;
    }

    mergeStyles(style) {
        return {
            valueStyle: merge(
                true,
                defaultStyle.values,
                this.props.style.values ? this.props.style.values : {}
            ),
            tickStyle: merge(
                true,
                defaultStyle.ticks,
                this.props.style.ticks ? this.props.style.ticks : {}
            )
        };
    }

    renderTimeAxis(scale, format, showGrid, gridHeight) {
        let axis;

        const tickSize = showGrid ? -gridHeight : 10;
        const utc = this.props.utc;
        const tickCount = this.props.tickCount;
        const timeRange = this.props.timeRange;
        const style = this.mergeStyles(this.props.style);
        const { tickStyle, valueStyle } = style;

        if (tickCount > 0) {
            const beginningTimestamp = timeRange.begin().valueOf();
            const endTimestamp = timeRange.end().valueOf();
            const timeIteration = (endTimestamp - beginningTimestamp) / tickCount;
            let tickValues = [];
            for (let i = 1; i <= tickCount; i++) {
                tickValues.push(new Date(beginningTimestamp + timeIteration * i));
            }
            tickValues = smoothOutTimeEntries(tickValues, timeRange);

            // format = "day";

            // console.log('TICK COUNT', tickCount);
            // console.log('FORMAT', format);
            // console.log('TICK VALUES', tickValues);

            if (format === "day") {
                axis = axisBottom(scale)
                    // .tickArguments([utc ? utcDay : timeDay, 1, tickCount])
                    .tickValues(tickValues)
                    .tickFormat(timeFormat("%d"))
                    .tickSizeOuter(0);
            } else if (format === "month") {
                axis = axisBottom(scale)
                    // .tickArguments([utc ? utcMonth : timeMonth, 1, tickCount])
                    .tickValues(tickValues)
                    .tickFormat(timeFormat("%B"))
                    .tickSizeOuter(0);
            } else if (format === "year") {
                axis = axisBottom(scale)
                    // .tickArguments([utc ? utcYear : timeYear, 1, tickCount])
                    .tickValues(tickValues)
                    .tickFormat(timeFormat("%Y"))
                    .tickSizeOuter(0);
            } else if (format === "relative") {
                axis = axisBottom(scale)
                    // .ticks(tickCount)
                    .tickValues(tickValues)
                    .tickFormat(d => moment.duration(+d).format())
                    .tickSizeOuter(0);
            } else if (_.isString(format)) {
                axis = axisBottom(scale)
                    // .ticks(tickCount)
                    .tickValues(tickValues)
                    .tickFormat(timeFormat(format))
                    .tickSizeOuter(0);
            } else if (_.isFunction(format)) {
                axis = axisBottom(scale)
                    // .ticks(tickCount)
                    .tickValues(tickValues)
                    .tickFormat(format)
                    .tickSizeOuter(0);
            } else {
                console.log("AXIS");

                axis = axisBottom(scale)
                    // .ticks(tickCount)
                    // .ticks(timeHour.every(5))
                    .tickValues(tickValues)
                    // .tickArguments([tickCount])
                    .tickFormat(multiTimeFormat);
                // .tickSize(0);
            }
        } else {
            if (format === "day") {
                axis = axisBottom(scale)
                    .tickArguments([utc ? utcDay : timeDay, 1])
                    .tickFormat(timeFormat("%d"))
                    .tickSizeOuter(0);
            } else if (format === "month") {
                axis = axisBottom(scale)
                    .tickArguments([utc ? utcMonth : timeMonth, 1])
                    .tickFormat(timeFormat("%B"))
                    .tickSizeOuter(0);
            } else if (format === "year") {
                axis = axisBottom(scale)
                    .tickArguments([utc ? utcYear : timeYear, 1])
                    .tickFormat(timeFormat("%Y"))
                    .tickSizeOuter(0);
            } else if (format === "relative") {
                axis = axisBottom(scale)
                    .tickFormat(d => moment.duration(+d).format())
                    .tickSizeOuter(0);
            } else if (_.isString(format)) {
                axis = axisBottom(scale)
                    .tickFormat(timeFormat(format))
                    .tickSizeOuter(0);
            } else if (_.isFunction(format)) {
                axis = axisBottom(scale)
                    .tickFormat(format)
                    .tickSizeOuter(0);
            } else {
                axis = axisBottom(scale).tickSize(0);
            }
        }

        // Remove the old axis from under this DOM node
        select(ReactDOM.findDOMNode(this))
            .selectAll("*")
            .remove(); // eslint-disable-line
        //
        // Draw the new axis
        //
        select(ReactDOM.findDOMNode(this)) // eslint-disable-line
            .append("g")
            .attr("class", "x axis")
            .style("stroke", "none")
            .styles(valueStyle)
            .call(axis.tickSize(tickSize));

        if (this.props.angled) {
            select(ReactDOM.findDOMNode(this)) // eslint-disable-line
                .select("g")
                .selectAll(".tick")
                .select("text")
                .styles(valueStyle)
                .style("text-anchor", "end")
                .attr("dx", "-1.2em")
                .attr("dy", "0em")
                .attr("transform", function(d) {
                    return "rotate(-65)";
                });
        } else {
            select(ReactDOM.findDOMNode(this)) // eslint-disable-line
                .select("g")
                .selectAll(".tick")
                .select("text")
                .styles(valueStyle);
        }
        select(ReactDOM.findDOMNode(this)) // eslint-disable-line
            .select("g")
            .selectAll(".tick")
            .select("line")
            .styles(tickStyle);

        select(ReactDOM.findDOMNode(this))
            .select("g")
            .select("path")
            .remove();
    }

    render() {
        return <g />;
    }
}

TimeAxis.defaultProps = {
    showGrid: false,
    style: defaultStyle,
    angled: false
};

TimeAxis.propTypes = {
    scale: PropTypes.func.isRequired,
    showGrid: PropTypes.bool,
    angled: PropTypes.bool,
    gridHeight: PropTypes.number,
    format: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    utc: PropTypes.bool,
    style: PropTypes.shape({
        label: PropTypes.object, // eslint-disable-line
        values: PropTypes.object, // eslint-disable-line
        axis: PropTypes.object // eslint-disable-line
    }),
    tickCount: PropTypes.number,
    timeRange: PropTypes.instanceOf(TimeRange)
};
