/**
 *  Copyright (c) 2016, The Regents of the University of California,
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
 * Renders a simple label surrounded by a box within in svg
 *
 *      +----------------+
 *      | My label       |
 *      |                |
 *      +----------------+
 */

const Label = ({ label, style, align, width, height, baseStyleClassRoot }) => {
    const { boxStyle, labelStyle } = retrieveStyles(style);
    const posx = align === "center" ? parseInt(width / 2, 10) : 10;
    const labelClassName = labelStyle.classes || "";
    const boxClassName = boxStyle.classes || "";
    delete labelStyle.classes;
    delete boxStyle.classes;
    const textClasses =
        align === "center"
            ? `${baseStyleClassRoot}labelText--centered ${labelClassName}`
            : `${baseStyleClassRoot}labelText ${labelClassName}`;

    const text = (
        <text x={posx} y={5} dy="1.2em" style={labelStyle} className={textClasses}>
            {label}
        </text>
    );
    const box = (
        <rect x={0} y={0} style={boxStyle} width={width} height={height} className={boxClassName} />
    );

    return (
        <g>
            {box}
            {text}
        </g>
    );
};

Label.defaultProps = {
    align: "center",
    width: 100,
    height: 100,
    pointerEvents: "none",
    baseStyleClassRoot: ""
};

Label.propTypes = {
    /**
     * Where to position the label, either "left" or "center" within the box
     */
    align: PropTypes.oneOf(["center", "left"]),

    /**
     * The label to render
     */
    label: PropTypes.string.isRequired,

    /**
     * The style of the label. This is the inline CSS applied directly
     * to the label box
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

export default Label;
