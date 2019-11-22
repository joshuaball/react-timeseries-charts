/**
 *  Copyright (c) 2015-present, The Regents of the University of California,
 *  through Lawrence Berkeley National Laboratory (subject to receipt
 *  of any required approvals from the U.S. Dept. of Energy).
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import merge from "merge";
import React from "react";
import PropTypes from "prop-types";
import _ from "underscore";

/**
 *
 * The BaseLine component displays a simple horizontal line at a value.
 *
 * For example the following code overlays Baselines for the mean and stdev
 * of a series on top of another chart.
 *
 * ```
 * <ChartContainer timeRange={series.timerange()} >
 *     <ChartRow height="150">
 *         <YAxis
 *           id="price"
 *           label="Price ($)"
 *           min={series.min()} max={series.max()}
 *           width="60" format="$,.2f"
 *         />
 *         <Charts>
 *             <LineChart axis="price" series={series} style={style} />
 *             <Baseline axis="price" value={series.avg()} label="Avg" position="right" />
 *             <Baseline axis="price" value={series.avg()-series.stdev()} />
 *             <Baseline axis="price" value={series.avg()+series.stdev()} />
 *         </Charts>
 *     </ChartRow>
 * </ChartContainer>
 * ```
 */
export default class Baseline extends React.Component {
    render() {
        const { vposition, yScale, value, position, style, width, baseStyleClassRoot } = this.props;

        if (!yScale || _.isUndefined(value)) {
            return null;
        }

        const y = yScale(value);
        const transform = `translate(0 ${y})`;
        let textAnchor;
        let textPositionX;
        const pts = [];

        const labelBelow = (vposition === "auto" && y < 15) || vposition === "below";
        const textPositionY = labelBelow ? 2 : -2;
        const alignmentBaseline = labelBelow ? "hanging" : "auto";

        if (position === "left") {
            textAnchor = "start";
            textPositionX = 5;
        }
        if (position === "right") {
            textAnchor = "end";
            textPositionX = width - 5;
        }

        pts.push("0 0");
        pts.push(`${width} 0`);
        const points = pts.join(" ");

        //
        // Style
        //
        const baseLabelStyle = { alignmentBaseline };
        const labelStyle = merge(true, baseLabelStyle, style.label ? style.label : {});
        const lineStyle = { ...style.line };
        const labelClasses = `${baseStyleClassRoot}baseline__label ` + (labelStyle.classes || "");
        const lineClasses = `${baseStyleClassRoot}baseline__line ` + (lineStyle.classes || "");
        delete labelStyle.classes;
        delete lineStyle.classes;

        return (
            <g className="baseline" transform={transform}>
                <polyline points={points} style={lineStyle} className={lineClasses} />
                <text
                    style={labelStyle}
                    className={labelClasses}
                    x={textPositionX}
                    y={textPositionY}
                    textAnchor={textAnchor}
                >
                    {this.props.label}
                </text>
            </g>
        );
    }
}

Baseline.defaultProps = {
    visible: true,
    value: 0,
    label: "",
    position: "left",
    vposition: "auto",
    style: {},
    baseStyleClassRoot: ""
};

Baseline.propTypes = {
    /**
     * Show or hide this chart
     */
    visible: PropTypes.bool,

    /**
     * Reference to the axis which provides the vertical scale for drawing. e.g.
     * specifying axis="trafficRate" would refer the y-scale to the YAxis of id="trafficRate".
     */
    axis: PropTypes.string.isRequired, // eslint-disable-line

    /**
     * An object describing the style of the baseline of the form
     * { label, line }. "label" and "line" are both objects containing
     * the inline CSS for that part of the baseline.
     */
    style: PropTypes.shape({
        label: PropTypes.object, // eslint-disable-line
        line: PropTypes.object // eslint-disable-line
    }),

    /**
     * The y-value to display the line at.
     */
    value: PropTypes.number,

    /**
     * The label to display with the axis.
     */
    label: PropTypes.string,

    /**
     * Whether to display the label on the "left" or "right".
     */
    position: PropTypes.oneOf(["left", "right"]),

    /**
     * Whether to display the label above or below the line. The default is "auto",
     * which will show it above the line unless the position is near to the top
     * of the chart.
     */
    vposition: PropTypes.oneOf(["above", "below", "auto"]),

    /**
     * [Internal] The yScale supplied by the associated YAxis
     */
    yScale: PropTypes.func,

    /**
     * [Internal] The width supplied by the surrounding ChartContainer
     */
    width: PropTypes.number,

    /**
     * If specified, the base CSS class root used to build class names throughout the inner time series charting
     * components.
     */
    baseStyleClassRoot: PropTypes.string
};
