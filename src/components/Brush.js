/**
 *  Copyright (c) 2016, The Regents of the University of California,
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
import { TimeRange } from "pondjs";

import { getElementOffset } from "../js/util";

/**
 * Renders a brush with the range defined in the prop `timeRange`.
 */
export default class Brush extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isBrushing: false
        };

        this.handleBrushMouseDown = this.handleBrushMouseDown.bind(this);
        this.handleBrushTouchStart = this.handleBrushTouchStart.bind(this);

        this.handleOverlayMouseDown = this.handleOverlayMouseDown.bind(this);
        this.handleOverlayTouchStart = this.handleOverlayTouchStart.bind(this);

        this.handleHandleMouseDown = this.handleHandleMouseDown.bind(this);
        this.handleHandleTouchStart = this.handleHandleTouchStart.bind(this);

        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);

        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);

        this.handleClick = this.handleClick.bind(this);
    }

    componentDidMount() {
        this.brushGroup.addEventListener("touchstart", this.handleBrushGroupTouchStart, {
            passive: false
        });
    }

    componentWillUnmount() {
        this.brushGroup.removeEventListener("touchstart", this.handleBrushGroupTouchStart, {
            passive: false
        });
    }

    viewport() {
        const { width, timeScale } = this.props;
        const viewBeginTime = timeScale.invert(0);
        const viewEndTime = timeScale.invert(width);
        return new TimeRange(viewBeginTime, viewEndTime);
    }

    startBrushInteraction(pageX, pageY) {
        const xy0 = [Math.round(pageX), Math.round(pageY)];
        const begin = +this.props.timeRange.begin();
        const end = +this.props.timeRange.end();

        document.addEventListener("mouseup", this.handleMouseUp);
        document.addEventListener("touchend", this.handleTouchEnd);

        this.setState({
            isBrushing: true,
            brushingInitializationSite: "brush",
            initialBrushBeginTime: begin,
            initialBrushEndTime: end,
            initialBrushXYPosition: xy0
        });
    }

    startOverlayBrushInteraction(pageX) {
        const offset = getElementOffset(this.overlay);
        const x = pageX - offset.left;
        const t = this.props.timeScale.invert(x).getTime();

        document.addEventListener("mouseup", this.handleMouseUp);
        document.addEventListener("touchend", this.handleTouchEnd);

        this.setState({
            isBrushing: true,
            brushingInitializationSite: "overlay",
            initialBrushBeginTime: t,
            initialBrushEndTime: t,
            initialBrushXYPosition: null
        });
    }

    endBrushInteraction() {
        document.removeEventListener("mouseover", this.handleMouseMove);
        document.removeEventListener("mouseup", this.handleMouseUp);

        document.removeEventListener("touchmove", this.handleTouchMove);
        document.removeEventListener("touchend", this.handleTouchEnd);

        this.setState({
            isBrushing: false,
            brushingInitializationSite: null,
            initialBrushBeginTime: null,
            initialBrushEndTime: null,
            initialBrushXYPosition: null
        });
    }

    startHandleInteraction(handle, pageX, pageY) {
        const xy0 = [Math.round(pageX), Math.round(pageY)];
        const begin = this.props.timeRange.begin().getTime();
        const end = this.props.timeRange.end().getTime();

        document.addEventListener("mouseover", this.handleMouseMove);
        document.addEventListener("mouseup", this.handleMouseUp);

        document.addEventListener("touchmove", this.handleTouchMove);
        document.addEventListener("touchend", this.handleTouchEnd);

        this.setState({
            isBrushing: true,
            brushingInitializationSite: `handle-${handle}`,
            initialBrushBeginTime: begin,
            initialBrushEndTime: end,
            initialBrushXYPosition: xy0
        });
    }

    timeRangeUpdateCheck(pageX, pageY) {
        const xy = [Math.round(pageX), Math.round(pageY)];
        const viewport = this.viewport();

        if (this.state.isBrushing) {
            let newBegin;
            let newEnd;

            const tb = this.state.initialBrushBeginTime;
            const te = this.state.initialBrushEndTime;

            if (this.state.brushingInitializationSite === "overlay") {
                const offset = getElementOffset(this.overlay);
                const xx = pageX - offset.left;
                const t = this.props.timeScale.invert(xx).getTime();
                if (t < tb) {
                    newBegin = t < viewport.begin().getTime() ? viewport.begin() : t;
                    newEnd = tb > viewport.end().getTime() ? viewport.end() : tb;
                } else {
                    newBegin = tb < viewport.begin().getTime() ? viewport.begin() : tb;
                    newEnd = t > viewport.end().getTime() ? viewport.end() : t;
                }
            } else {
                const xy0 = this.state.initialBrushXYPosition;
                let timeOffset =
                    this.props.timeScale.invert(xy0[0]).getTime() -
                    this.props.timeScale.invert(xy[0]).getTime();

                // Constrain
                let startOffsetConstraint = timeOffset;
                let endOffsetConstrain = timeOffset;
                if (tb - timeOffset < viewport.begin()) {
                    startOffsetConstraint = tb - viewport.begin().getTime();
                }
                if (te - timeOffset > viewport.end()) {
                    endOffsetConstrain = te - viewport.end().getTime();
                }

                newBegin =
                    this.state.brushingInitializationSite === "brush" ||
                    this.state.brushingInitializationSite === "handle-left"
                        ? parseInt(tb - startOffsetConstraint, 10)
                        : tb;
                newEnd =
                    this.state.brushingInitializationSite === "brush" ||
                    this.state.brushingInitializationSite === "handle-right"
                        ? parseInt(te - endOffsetConstrain, 10)
                        : te;

                // Swap if needed
                if (newBegin > newEnd) [newBegin, newEnd] = [newEnd, newBegin];
            }

            if (this.props.onTimeRangeChanged) {
                newBegin = newBegin instanceof Date ? newBegin.valueOf() : newBegin;
                newEnd = newEnd instanceof Date ? newEnd.valueOf() : newEnd;
                this.props.onTimeRangeChanged(new TimeRange(newBegin, newEnd));
            }
        }
    }

    //
    // Event handlers
    //

    /**
     * Allow for the brush to be moved via touch.
     * @param e
     */
    handleBrushGroupTouchStart(e) {
        e.preventDefault();
    }

    /**
     * Pass the page x/y coordinates forward to initiate the brush interaction.
     * @param e {MouseEvent}
     */
    handleBrushMouseDown(e) {
        e.preventDefault();
        const { pageX, pageY } = e;
        this.startBrushInteraction(pageX, pageY);
    }

    /**
     * Grab the page x/y coordinates from the first Touch point in the TouchList of the targetTouches property of the
     * event.  Ignore multiple Touch points; assume that the interaction is being made via a single Touch point.
     * @param e {TouchEvent}
     */
    handleBrushTouchStart(e) {
        const { targetTouches = [] } = e;
        const mainTargetTouch = targetTouches[0];
        let pageX = 0;
        let pageY = 0;
        if (!!mainTargetTouch) {
            pageX = mainTargetTouch.pageX;
            pageY = mainTargetTouch.pageY;
        }

        this.startBrushInteraction(pageX, pageY);
    }

    /**
     * Pass the page x coordinate forward to initiate the overlay brush interaction.
     * @param e {MouseEvent}
     */
    handleOverlayMouseDown(e) {
        e.preventDefault();
        const { pageX } = e;
        this.startOverlayBrushInteraction(pageX);
    }

    /**
     * Grab the page x coordinate from the first Touch point in the TouchList of the targetTouches property of the
     * event.  Ignore multiple Touch points; assume that the interaction is being made via a single Touch point.
     * @param e {TouchEvent}
     */
    handleOverlayTouchStart(e) {
        const { targetTouches = [] } = e;
        const mainTargetTouch = targetTouches[0];
        let pageX = 0;
        if (!!mainTargetTouch) {
            pageX = mainTargetTouch.pageX;
        }

        this.startOverlayBrushInteraction(pageX);
    }

    /**
     * Pass the page x/y coordinates forward to initiate the brush handle interaction.
     * @param e {MouseEvent}
     * @param handle {string} - "left" or "right".  The corresponding handle that was clicked.
     */
    handleHandleMouseDown(e, handle) {
        e.preventDefault();
        const { pageX, pageY } = e;

        this.startHandleInteraction(handle, pageX, pageY);
    }

    /**
     * Grab the page x/y coordinates from the first Touch point in the TouchList of the targetTouches property of the
     * event.  Ignore multiple Touch points; assume that the interaction is being made via a single Touch point.
     * @param e {TouchEvent}
     * @param handle {string} - "left" or "right".  The corresponding handle that was clicked.
     */
    handleHandleTouchStart(e, handle) {
        const { targetTouches = [] } = e;
        const mainTargetTouch = targetTouches[0];
        let pageX = 0;
        let pageY = 0;
        if (!!mainTargetTouch) {
            pageX = mainTargetTouch.pageX;
            pageY = mainTargetTouch.pageY;
        }

        this.startHandleInteraction(handle, pageX, pageY);
    }

    handleMouseUp(e) {
        e.preventDefault();
        this.endBrushInteraction();
    }

    handleTouchEnd() {
        this.endBrushInteraction();
    }

    /**
     * Handles clearing the TimeRange if the user clicks on the overlay (but
     * doesn't drag to create a new brush). This will send a null as the
     * new TimeRange. The user of this code can react to that however they
     * see fit, but the most logical response is to reset the timerange to
     * some initial value. This behavior is optional.
     */
    handleClick() {
        if (this.props.allowSelectionClear && this.props.onTimeRangeChanged) {
            this.props.onTimeRangeChanged(null);
        }
    }

    /**
     * Pass the page x/y coordinates forward to perform a time range update check.
     * @param e {MouseEvent}
     */
    handleMouseMove(e) {
        e.preventDefault();
        const { pageX, pageY } = e;
        this.timeRangeUpdateCheck(pageX, pageY);
    }

    /**
     * Grab the page x/y coordinates from the first Touch point in the TouchList of the targetTouches property of the
     * event.  Ignore multiple Touch points; assume that the interaction is being made via a single Touch point.
     * @param e {TouchEvent}
     */
    handleTouchMove(e) {
        const { targetTouches = [] } = e;
        const mainTargetTouch = targetTouches[0];
        let pageX = 0;
        let pageY = 0;
        if (!!mainTargetTouch) {
            pageX = mainTargetTouch.pageX;
            pageY = mainTargetTouch.pageY;
        }

        this.timeRangeUpdateCheck(pageX, pageY);
    }

    //
    // Render
    //

    renderOverlay() {
        const { width, height } = this.props;

        let cursor;
        switch (this.state.brushingInitializationSite) {
            case "handle-right":
            case "handle-left":
                cursor = "ew-resize";
                break;
            case "brush":
                cursor = "move";
                break;
            default:
                cursor = "crosshair";
        }

        const overlayStyle = {
            fill: "white",
            opacity: 0,
            cursor
        };

        let handlers = {
            onMouseDown: this.handleOverlayMouseDown,
            onMouseUp: this.handleMouseUp
        };
        if (this.props.isPinchZooming === false) {
            handlers.onTouchStart = this.handleOverlayTouchStart;
            handlers.onTouchEnd = this.handleTouchEnd;
            handlers.onClick = this.handleClick;
        }

        return (
            <rect
                ref={c => {
                    this.overlay = c;
                }}
                x={0}
                y={0}
                width={width}
                height={height}
                style={overlayStyle}
                {...handlers}
            />
        );
    }

    renderBrush() {
        const { timeRange, timeScale, height, style } = this.props;

        if (!timeRange) {
            return <g />;
        }

        let cursor;
        switch (this.state.brushingInitializationSite) {
            case "handle-right":
            case "handle-left":
                cursor = "ew-resize";
                break;
            case "overlay":
                cursor = "crosshair";
                break;
            default:
                cursor = "move";
        }

        // Style of the brush area
        const brushDefaultStyle = {
            fill: "#777",
            fillOpacity: 0.3,
            stroke: "#fff",
            shapeRendering: "crispEdges",
            cursor
        };
        const brushStyle = merge(true, brushDefaultStyle, style);

        if (!this.viewport().disjoint(timeRange)) {
            const range = timeRange.intersection(this.viewport());
            const begin = range.begin();
            const end = range.end();
            const [x, y] = [timeScale(begin), 0];
            const endPos = timeScale(end);
            let width = endPos - x;
            if (width < 1) {
                width = 1;
            }

            const bounds = { x, y, width, height };

            let handlers = {
                onMouseDown: this.handleBrushMouseDown,
                onMouseUp: this.handleMouseUp
            };
            if (this.props.isPinchZooming === false) {
                handlers.onTouchStart = this.handleBrushTouchStart;
                handlers.onTouchEnd = this.handleTouchEnd;
            }

            return <rect {...bounds} style={brushStyle} pointerEvents="all" {...handlers} />;
        }
        return <g />;
    }

    renderHandles() {
        const { timeRange, timeScale, height } = this.props;

        if (!timeRange) {
            return <g />;
        }

        // Style of the handles
        const handleStyle = {
            fill: "white",
            opacity: 0,
            cursor: "ew-resize"
        };

        if (!this.viewport().disjoint(timeRange)) {
            const range = timeRange.intersection(this.viewport());
            const [begin, end] = range.toJSON();
            const [x, y] = [timeScale(begin), 0];
            const endPos = timeScale(end);

            let width = endPos - x;
            if (width < 1) {
                width = 1;
            }

            const handleSize = this.props.handleSize;

            const leftHandleBounds = { x: x - 1, y, width: handleSize, height };
            const rightHandleBounds = {
                x: x + (width - handleSize),
                y,
                width: handleSize + 1,
                height
            };

            let leftHandleHandlers = {
                onMouseDown: e => this.handleHandleMouseDown(e, "left"),
                onMouseUp: this.handleMouseUp
            };
            let rightHandleHandlers = {
                onMouseDown: e => this.handleHandleMouseDown(e, "right"),
                onMouseUp: this.handleMouseUp
            };
            if (this.props.isPinchZooming === false) {
                leftHandleHandlers.onTouchStart = e => this.handleHandleTouchStart(e, "left");
                leftHandleHandlers.onTouchEnd = this.handleTouchEnd;
                rightHandleHandlers.onTouchStart = e => this.handleHandleTouchStart(e, "right");
                rightHandleHandlers.onTouchEnd = this.handleTouchEnd;
            }

            return (
                <g>
                    <rect
                        {...leftHandleBounds}
                        style={handleStyle}
                        pointerEvents="all"
                        {...leftHandleHandlers}
                    />
                    <rect
                        {...rightHandleBounds}
                        style={handleStyle}
                        pointerEvents="all"
                        {...rightHandleHandlers}
                    />
                </g>
            );
        }
        return <g />;
    }

    render() {
        let handlers = {
            onMouseMove: this.handleMouseMove
        };
        if (this.props.isPinchZooming === false) {
            handlers.onTouchMove = this.handleTouchMove;
        }

        return (
            <g {...handlers} ref={c => (this.brushGroup = c)}>
                {this.renderOverlay()}
                {this.renderBrush()}
                {this.renderHandles()}
            </g>
        );
    }
}

Brush.propTypes = {
    /**
     * The timerange for the brush. Typically you would maintain this
     * as state on the surrounding page, since it would likely control
     * another page element, such as the range of the main chart. See
     * also `onTimeRangeChanged()` for receiving notification of the
     * brush range being changed by the user.
     *
     * Takes a Pond TimeRange object.
     */
    timeRange: PropTypes.instanceOf(TimeRange),
    /**
     * The brush is rendered as an SVG rect. You can specify the style
     * of this rect using this prop.
     */
    style: PropTypes.object, //eslint-disable-line
    /**
     * The size of the invisible side handles. Defaults to 6 pixels.
     */
    handleSize: PropTypes.number,
    /**
     * Used to pause the touch interactions while true.
     */
    isPinchZooming: PropTypes.bool,

    allowSelectionClear: PropTypes.bool,
    /**
     * A callback which will be called if the brush range is changed by
     * the user. It is called with a Pond TimeRange object. Note that if
     * `allowSelectionClear` is set to true, then this can also be called
     * when the user performs a simple click outside the brush area. In
     * this case it will be called with null as the TimeRange. You can
     * use this to reset the selection, perhaps to some initial range.
     */
    onTimeRangeChanged: PropTypes.func,
    /**
     * [Internal] The timeScale supplied by the surrounding ChartContainer
     */
    timeScale: PropTypes.func,
    /**
     * [Internal] The width supplied by the surrounding ChartContainer
     */
    width: PropTypes.number,
    /**
     * [Internal] The height supplied by the surrounding ChartContainer
     */
    height: PropTypes.number
};

Brush.defaultProps = {
    handleSize: 6,
    allowSelectionClear: false
};
