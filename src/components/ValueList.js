/**
 *  Copyright (c) 2015-present, The Regents of the University of California,
 *  through Lawrence Berkeley National Laboratory (subject to receipt
 *  of any required approvals from the U.S. Dept. of Energy).
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from "react";
import PropTypes from "prop-types";
import merge from "merge";

function retrieveStyles(style) {
    return {
        boxStyle: { ...style.box },
        labelStyle: { ...style.label }
    };
}

/**
 * Renders a list of values in svg
 *
 *      +----------------+
 *      | Max 100 Gbps   |
 *      | Avg 26 Gbps    |
 *      +----------------+
 */
const ValueList = props => {
    const { align, style, width, height, baseStyleClassRoot } = props;
    const { boxStyle, labelStyle } = retrieveStyles(style);
    const labelClassName = labelStyle.classes || "";
    const boxClassName = boxStyle.classes || "";
    delete labelStyle.classes;
    delete boxStyle.classes;
    const textClasses =
        align === "center"
            ? `${baseStyleClassRoot}labelText--centered ${labelClassName}`
            : `${baseStyleClassRoot}labelText ${labelClassName}`;

    if (!props.values.length) {
        return <g />;
    }

    const values = props.values.map((item, i) => {
        if (align === "left") {
            return (
                <g key={i}>
                    <text
                        x={10}
                        y={5}
                        dy={`${(i + 1) * 1.2}em`}
                        style={labelStyle}
                        className={textClasses}
                    >
                        <tspan style={{ fontWeight: 700 }}>{`${item.label}: `}</tspan>
                        <tspan>{`${item.value}`}</tspan>
                    </text>
                </g>
            );
        }

        const posx = parseInt(props.width / 2, 10);
        return (
            <g key={i}>
                <text
                    x={posx}
                    y={5}
                    dy={`${(i + 1) * 1.2}em`}
                    style={labelStyle}
                    className={textClasses}
                >
                    <tspan style={{ fontWeight: 700 }}>{`${item.label}: `}</tspan>
                    <tspan>{`${item.value}`}</tspan>
                </text>
            </g>
        );
    });

    const box = (
        <rect style={boxStyle} x={0} y={0} width={width} height={height} className={boxClassName} />
    );

    return (
        <g>
            {box}
            {values}
        </g>
    );
};

ValueList.defaultProps = {
    align: "center",
    width: 100,
    height: 100,
    pointerEvents: "none",
    style: {},
    baseStyleClassRoot: ""
};

ValueList.propTypes = {
    /**
     * Where to position the label, either "left" or "center" within the box
     */
    align: PropTypes.oneOf(["center", "left"]),

    /**
     * An array of label value pairs to render
     */
    values: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string, // eslint-disable-line
            value: PropTypes.oneOfType([
                // eslint-disable-line
                PropTypes.number,
                PropTypes.string
            ])
        })
    ).isRequired,

    /**
     * CSS object to be applied to the ValueList surrounding box and the label (text).
     */
    style: PropTypes.object, // eslint-disable-line

    /**
     * The width of the rectangle to render into
     */
    width: PropTypes.number,

    /**
     * The height of the rectangle to render into
     */
    height: PropTypes.number,

    /**
     * If specified, the base CSS class root used to build class names throughout the inner time series charting
     * components.
     */
    baseStyleClassRoot: PropTypes.string
};

export default ValueList;
