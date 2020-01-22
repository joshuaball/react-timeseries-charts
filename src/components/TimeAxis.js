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
import moment from "moment-timezone";
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

// Millisecond value constants
const MILLISECOND_SECOND = 1000;
const MILLISECOND_MINUTE = 60000;
const MILLISECOND_HOUR = 3600000;
const MILLISECOND_DAY = 86400000;
const MILLISECOND_MONTH = 2592000000; // Rough; based on 30 days‬
const MILLISECOND_YEAR = 31536000000; // Rough; based on 365 days (leap year not accounted for)

// Time formats
const formatMillisecond = ".SSS";
const formatSecond = ":ss";
const formatMinute = "h:mm";
const formatHour = "h A";
const formatDayHour = "ddd Do, h A";
const formatDay = "ddd Do";
const formatWeek = "MMM Do";
const formatMonth = "MMMM";
const formatYearMonth = "MMM YYYY";
const formatYear = "YYYY";

/**
 * Return a time format based on the difference of the start/end values of the passed in TimeRange. Time formats have
 * a bit of overlap and take over when they look roughly correct when graphed without too much duplication of time
 * identifiers (i.e. Trying to limit "January, January, January..." as much as possible in favor of "Jan 05, Jan 15,
 * Jan 22, Jan 31...").
 * @param timeRange
 */
function adjustableTimeFormat(timeRange) {
    const diff = timeRangeDiff(timeRange);
    const buffer = 10;
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
export default class TimeAxis extends React.Component {
    componentDidMount() {
        const { scale, format, showGrid, gridHeight, timeZone } = this.props;
        this.renderTimeAxis(scale, format, showGrid, gridHeight, timeZone);
    }

    componentWillReceiveProps(nextProps) {
        const { scale, utc, format, showGrid, gridHeight, timeZone } = nextProps;
        if (
            scaleAsString(this.props.scale) !== scaleAsString(scale) ||
            this.props.utc !== utc ||
            this.props.showGrid !== showGrid ||
            this.props.gridHeight !== gridHeight ||
            this.props.timeZone !== timeZone
        ) {
            this.renderTimeAxis(scale, format, showGrid, gridHeight, timeZone);
        }
    }

    // Force the component not to update because d3 will control the
    // DOM from this point down.
    shouldComponentUpdate() {
        // eslint-disable-line
        return false;
    }

    renderTimeAxis(scale, format, showGrid, gridHeight, timeZone) {
        let axis;

        const tickSize = showGrid ? -gridHeight : 10;
        const { utc, style, tickCount, timeRange } = this.props;
        const { ticks, values } = style;
        const tickStyle = { ...ticks };
        const valueStyle = { ...values };
        const tickClasses =
            `${this.props.baseStyleClassRoot}timeAxis__ticks ` + (tickStyle.classes || "");
        const valueClasses =
            `${this.props.baseStyleClassRoot}timeAxis__values ` + (valueStyle.classes || "");
        delete tickStyle.classes;
        delete valueStyle.classes;

        if (tickCount > 0) {
            const beginningTimestamp = timeRange.begin().valueOf();
            const endTimestamp = timeRange.end().valueOf();
            const timeIteration = (endTimestamp - beginningTimestamp) / tickCount;
            let tickValues = [];
            const startingPosition = timeIteration / 2;
            for (let i = 0; i < tickCount; i++) {
                tickValues.push(
                    new Date(beginningTimestamp + startingPosition + timeIteration * i)
                );
            }

            if (format === "day") {
                axis = axisBottom(scale)
                    .tickValues(tickValues)
                    .tickFormat(timeFormat("%d"))
                    .tickSizeOuter(0);
            } else if (format === "month") {
                axis = axisBottom(scale)
                    .tickValues(tickValues)
                    .tickFormat(timeFormat("%B"))
                    .tickSizeOuter(0);
            } else if (format === "year") {
                axis = axisBottom(scale)
                    .tickValues(tickValues)
                    .tickFormat(timeFormat("%Y"))
                    .tickSizeOuter(0);
            } else if (format === "relative") {
                axis = axisBottom(scale)
                    .tickValues(tickValues)
                    .tickFormat(d => moment.duration(+d).format())
                    .tickSizeOuter(0);
            } else if (_.isString(format)) {
                axis = axisBottom(scale)
                    .tickValues(tickValues)
                    .tickFormat(timeFormat(format))
                    .tickSizeOuter(0);
            } else if (_.isFunction(format)) {
                axis = axisBottom(scale)
                    .tickValues(tickValues)
                    .tickFormat(format)
                    .tickSizeOuter(0);
            } else {
                const timeFormat = adjustableTimeFormat(timeRange);
                axis = axisBottom(scale)
                    .tickValues(tickValues)
                    .tickFormat(date => {
                        const timezoneExists = timeZone ? moment.tz.zone(timeZone) !== null : false;
                        if (timezoneExists) {
                            return moment(date)
                                .tz(timeZone)
                                .format(timeFormat);
                        } else {
                            return moment(date).format(timeFormat);
                        }
                    })
                    .tickSizeOuter(0);
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
                axis = axisBottom(scale).tickSizeOuter(0);
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
            .styles(valueStyle)
            .classed(valueClasses, true)
            .call(axis.tickSize(tickSize));

        // Apply style to axis tick labels
        if (this.props.angled) {
            select(ReactDOM.findDOMNode(this)) // eslint-disable-line
                .select("g")
                .selectAll(".tick")
                .select("text")
                .styles(valueStyle)
                .classed(valueClasses, true)
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
                .styles(valueStyle)
                .classed(valueClasses, true);
        }

        // Apply style to axis ticks
        select(ReactDOM.findDOMNode(this)) // eslint-disable-line
            .select("g")
            .selectAll(".tick")
            .select("line")
            .styles(tickStyle)
            .classed(tickClasses, true);

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
    style: {},
    angled: false,
    baseStyleClassRoot: "",
    timeZone: ""
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
    timeRange: PropTypes.instanceOf(TimeRange),
    timeZone: PropTypes.string,
    /**
     * If specified, the base CSS class root used to build class names throughout the inner time series charting
     * components.
     */
    baseStyleClassRoot: PropTypes.string
};
