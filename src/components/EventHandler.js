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
import ReactDOM from "react-dom"; // eslint-disable-line
import PropTypes from "prop-types";

import { TimeRange } from "pondjs";

import { getElementOffset } from "../js/util";

/**
 * Internal component which provides the top level event catcher for the charts.
 * This is a higher order component. It wraps a tree of SVG elements below it,
 * passed in as this.props.children, and catches events that they do not handle.
 *
 * The EventHandler is responsible for pan and zoom events as well as other click
 * and hover actions.
 */
export default class EventHandler extends React.Component {
    previousDiff = -1;

    constructor(props) {
        super(props);

        this.state = {
            isPinchZooming: false,
            isPanning: false,
            initialPanBegin: null,
            initialPanEnd: null,
            initialPanPosition: null
        };

        this.handleScrollWheel = this.handleScrollWheel.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseOut = this.handleMouseOut.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);

        this.handleContextMenu = this.handleContextMenu.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchDone = this.handleTouchDone.bind(this);
    }

    componentDidMount() {
        this.eventHandlerRef.addEventListener("wheel", this.handleScrollWheel, { passive: false });

        if (this.props.enableDragZoom === true || this.props.enablePanZoom === true) {
            // Bound with a passive option so preventDefault can be called on the event (needed for "touchmove")
            this.eventHandlerRef.addEventListener("touchstart", this.handleTouchStart, {
                passive: false
            });
            this.eventHandlerRef.addEventListener("touchmove", this.handleTouchMove, {
                passive: false
            });
            this.eventHandlerRef.addEventListener("touchend", this.handleTouchDone, {
                passive: false
            });
            this.eventHandlerRef.addEventListener("touchcancel", this.handleTouchDone, {
                passive: false
            });
        }
    }

    componentWillUnmount() {
        this.eventHandlerRef.removeEventListener("wheel", this.handleScrollWheel, {
            passive: false
        });
        this.eventHandlerRef.removeEventListener("touchstart", this.handleTouchStart, {
            passive: false
        });
        this.eventHandlerRef.removeEventListener("touchmove", this.handleTouchMove, {
            passive: false
        });
        this.eventHandlerRef.removeEventListener("touchend", this.handleTouchDone, {
            passive: false
        });
        this.eventHandlerRef.removeEventListener("touchcancel", this.handleTouchDone, {
            passive: false
        });
    }

    // get the event mouse position relative to the event rect
    getOffsetCentralPosition(e) {
        const offset = getElementOffset(this.eventRect);
        const x = e.pageX - offset.left;
        const y = e.pageY - offset.top;
        return [Math.round(x), Math.round(y)];
    }

    triggerZoom(begin, end, center, scale) {
        let beginScaled = center - parseInt((center - begin) * scale, 10);
        let endScaled = center + parseInt((end - center) * scale, 10);

        // Duration constraint
        let duration = (end - begin) * scale;

        if (this.props.minDuration) {
            const minDuration = parseInt(this.props.minDuration, 10);
            if (duration < this.props.minDuration) {
                beginScaled = center - ((center - begin) / (end - begin)) * minDuration;
                endScaled = center + ((end - center) / (end - begin)) * minDuration;
            }
        }

        if (this.props.minTime && this.props.maxTime) {
            const maxDuration = this.props.maxTime.getTime() - this.props.minTime.getTime();
            if (duration > maxDuration) {
                duration = maxDuration;
            }
        }

        // Range constraint
        if (this.props.minTime && beginScaled < this.props.minTime.getTime()) {
            beginScaled = this.props.minTime.getTime();
            endScaled = beginScaled + duration;
        }

        if (this.props.maxTime && endScaled > this.props.maxTime.getTime()) {
            endScaled = this.props.maxTime.getTime();
            beginScaled = endScaled - duration;
        }

        const newBegin = new Date(beginScaled);
        const newEnd = new Date(endScaled);

        const newTimeRange = new TimeRange(newBegin, newEnd);

        if (this.props.onZoom) {
            this.props.onZoom(newTimeRange);
        }
    }

    /**
     * Perform the interaction for the 'mousedown' and 'touchstart' events
     * @param e {MouseEvent | TouchEvent}
     */
    handleUserInteractionStart(e) {
        document.addEventListener("mouseover", this.handleMouseMove);
        document.addEventListener("mouseup", this.handleMouseUp);
        // Use mouse event handlers for single point-of-contact touch; they do everything we care about
        document.addEventListener("touchmove", this.handleMouseMove, {
            passive: false
        });
        document.addEventListener("touchend", this.handleMouseUp);

        if (this.props.enableDragZoom) {
            const offsetxy = this.getOffsetCentralPosition(e);
            this.setState({
                isDragging: true,
                initialDragZoom: offsetxy[0],
                currentDragZoom: offsetxy[0]
            });
        }

        if (this.props.enablePanZoom) {
            const x = e.pageX;
            const y = e.pageY;
            const xy0 = [Math.round(x), Math.round(y)];

            const begin = this.props.scale.domain()[0].getTime();
            const end = this.props.scale.domain()[1].getTime();

            this.setState({
                isPanning: true,
                initialPanBegin: begin,
                initialPanEnd: end,
                initialPanPosition: xy0
            });
        }
    }

    /**
     * Handle the interaction for the 'mousemove' and 'touchmove' events
     * @param e {MouseEvent | TouchEvent}
     */
    handleUserInteractionMove(e) {
        const x = e.pageX;
        const y = e.pageY;

        // NOTE: Function guard needed because Android does not prevent the mousemove event from getting here event
        // with preventDefault being thrown in the touchmove handler.
        if (x === undefined || y === undefined) {
            return;
        }

        const xy = [Math.round(x), Math.round(y)];
        const offsetxy = this.getOffsetCentralPosition(e);

        if (this.state.isDragging) {
            this.setState({
                currentDragZoom: offsetxy[0]
            });
        }
        if (this.state.isPanning) {
            const xy0 = this.state.initialPanPosition;
            const timeOffset =
                this.props.scale.invert(xy[0]).getTime() -
                this.props.scale.invert(xy0[0]).getTime();

            let newBegin = parseInt(this.state.initialPanBegin - timeOffset, 10);
            let newEnd = parseInt(this.state.initialPanEnd - timeOffset, 10);
            const duration = parseInt(this.state.initialPanEnd - this.state.initialPanBegin, 10);

            if (this.props.minTime && newBegin < this.props.minTime.getTime()) {
                newBegin = this.props.minTime.getTime();
                newEnd = newBegin + duration;
            }

            if (this.props.maxTime && newEnd > this.props.maxTime.getTime()) {
                newEnd = this.props.maxTime.getTime();
                newBegin = newEnd - duration;
            }

            const newTimeRange = new TimeRange(newBegin, newEnd);
            if (this.props.onZoom) {
                this.props.onZoom(newTimeRange);
            }
        } else if (this.props.onMouseMove) {
            const mousePosition = this.getOffsetCentralPosition(e);
            if (this.props.onMouseMove) {
                this.props.onMouseMove(mousePosition[0], mousePosition[1]);
            }
        }
    }

    /**
     * Handle the interaction for the 'mouseup' and 'touchend' events
     * @param e {MouseEvent | TouchEvent}
     */
    handleUserInteractionEnd(e) {
        document.removeEventListener("mouseover", this.handleMouseMove);
        document.removeEventListener("mouseup", this.handleMouseUp);
        document.removeEventListener("touchmove", this.handleMouseMove, {
            passive: false
        });
        document.removeEventListener("touchend", this.handleMouseUp);

        const offsetxy = this.getOffsetCentralPosition(e);

        const x = e.pageX;
        const isPanning =
            this.state.initialPanPosition && Math.abs(x - this.state.initialPanPosition[0]) > 2;
        const isDragging =
            this.state.initialDragZoom && Math.abs(offsetxy[0] - this.state.initialDragZoom) > 2;

        // Added to allow just a touch event to update the tracker position.  Touch events will always
        // be panning/dragging in the "handleUserInteractionMove" function, and this will never be triggered
        // there.
        if (this.props.onMouseMove && !isPanning && !isDragging) {
            this.props.onMouseMove(offsetxy[0], offsetxy[1]);
        }

        if (this.props.onMouseClick && !isPanning && !isDragging) {
            this.props.onMouseClick(offsetxy[0], offsetxy[1], e);
        }

        if (this.props.enableDragZoom) {
            if (isDragging) {
                const start = this.props.scale.invert(this.state.initialDragZoom).getTime();
                const end = this.props.scale.invert(this.state.currentDragZoom).getTime();

                let newBegin = parseInt(start, 10);
                let newEnd = parseInt(end, 10);

                if (this.props.minTime && newBegin < this.props.minTime.getTime()) {
                    newBegin = this.props.minTime.getTime();
                }

                if (this.props.maxTime && newEnd > this.props.maxTime.getTime()) {
                    newEnd = this.props.maxTime.getTime();
                }

                const newTimeRange = new TimeRange([newBegin, newEnd].sort());
                if (this.props.onZoom) {
                    this.props.onZoom(newTimeRange);
                }
            }

            this.setState({
                isDragging: false,
                initialDragZoom: null,
                initialPanEnd: null,
                currentDragZoom: null
            });
        }

        if (this.props.enablePanZoom) {
            this.setState({
                isPanning: false,
                initialPanBegin: null,
                initialPanEnd: null,
                initialPanPosition: null
            });
        }
    }

    //
    // Event handlers
    //

    handleScrollWheel(e) {
        if (!this.props.enablePanZoom && !this.props.enableDragZoom) {
            return;
        }

        e.preventDefault();

        const SCALE_FACTOR = 0.001;
        let scale = 1 + e.deltaY * SCALE_FACTOR;
        if (scale > 3) {
            scale = 3;
        }
        if (scale < 0.1) {
            scale = 0.1;
        }

        const xy = this.getOffsetCentralPosition(e);

        const begin = this.props.scale.domain()[0].getTime();
        const end = this.props.scale.domain()[1].getTime();
        const center = this.props.scale.invert(xy[0]).getTime();

        this.triggerZoom(begin, end, center, scale);
    }

    handleMouseDown(e) {
        if (!this.props.enablePanZoom && !this.props.enableDragZoom) {
            return;
        }

        if (e.button === 2) {
            return;
        }

        e.preventDefault();

        this.handleUserInteractionStart(e);

        return false;
    }

    handleMouseUp(e) {
        if (!this.props.onMouseClick && !this.props.enablePanZoom && !this.props.enableDragZoom) {
            return;
        }

        e.stopPropagation();

        this.handleUserInteractionEnd(e);
    }

    /**
     * Allow the functionality of "mouseout" to be unique just to mouse interaction.
     * There is no touch equivalent here, and downstream property binding won't care.
     * @param e {MouseEvent}
     */
    handleMouseOut(e) {
        e.preventDefault();

        if (this.props.onMouseOut) {
            this.props.onMouseOut();
        }
    }

    handleMouseMove(e) {
        e.preventDefault();

        this.handleUserInteractionMove(e);
    }

    handleContextMenu(e) {
        var x = e.pageX;
        var y = e.pageY;
        if (this.props.onContextMenu) {
            this.props.onContextMenu(x, y);
        }
    }

    /**
     * Update pinch/zoom status if there is more than 1 touch point active. If a single touch point is active,
     * opt into the pan/zoom behavior flow.
     * @param e {TouchEvent}
     */
    handleTouchStart(e) {
        const { touches } = e;

        if (touches) {
            if (touches.length > 1) {
                // Notify that a pinch zoom has started
                if (this.props.onPinchZoomStart && !this.state.isPinchZooming) {
                    this.setState({
                        isPinchZooming: true
                    });
                    this.props.onPinchZoomStart();
                }
                // Need to end any previous interaction to kill any open event handlers
                this.handleUserInteractionEnd(e);
            } else if (touches.length === 1) {
                if (!this.props.enablePanZoom && !this.props.enableDragZoom) {
                    return;
                }
                this.handleUserInteractionStart(touches.item(0));
            }
        }
    }

    /**
     * This function implements a 2-pointer horizontal pinch/zoom gesture. If the distance between the two pointers
     * has increased, zoom in.  If the distance has decreased, zoom out. If a single touch point is being used, opt
     * into the pan/zoom movement behavior flow.
     * @param e {TouchEvent}
     */
    handleTouchMove(e) {
        // NOTE: Preventing default here so that the mousemove event is not fired
        e.preventDefault();
        const { touches } = e;

        if (touches) {
            // If 2+ pointers are down, check for pinch gestures using the first two
            if (touches.length >= 2) {
                // Calculate the distance between the two pointers
                const curDiff = Math.abs(touches.item(0).clientX - touches.item(1).clientX);
                if (this.previousDiff > 0) {
                    // If zoomDiff is negative, zooming IN.  Positive, zooming OUT.
                    const zoomDiff = this.previousDiff - curDiff;
                    // Use a 10x greater scale value to calculate zoom since pinching is 10x slower (roughly)
                    const SCALE_FACTOR = 0.01;
                    let scale = 1 + zoomDiff * SCALE_FACTOR;
                    if (scale > 3) {
                        scale = 3;
                    }
                    if (scale < 0.1) {
                        scale = 0.1;
                    }
                    // Use the first event in the cache as a reference for event pageX placement to trigger the zoom.
                    const xy = this.getOffsetCentralPosition(touches.item(0));
                    const begin = this.props.scale.domain()[0].getTime();
                    const end = this.props.scale.domain()[1].getTime();
                    const center = this.props.scale.invert(xy[0]).getTime();
                    this.triggerZoom(begin, end, center, scale);
                }
                // Cache the distance for the next move event
                this.previousDiff = curDiff;
            } else if (touches.length === 1) {
                this.handleUserInteractionMove(touches.item(0));
            }
        }
    }

    /**
     * When the touch event has completed, toggle the state variable and reset the diff variable.
     * @param e {TouchEvent}
     */
    handleTouchDone(e) {
        const { touches } = e;

        // Notify that the pinch zoom has stopped
        if (this.props.onPinchZoomEnd && this.state.isPinchZooming) {
            this.setState({
                isPinchZooming: false
            });
            this.props.onPinchZoomEnd();
        }
        // If the number of pointers down is less than two then reset diff tracker
        if (touches && touches.length < 2) {
            this.previousDiff = -1;
            this.handleUserInteractionEnd(e);
        }
    }

    //
    // Render
    //

    render() {
        const cursor = this.state.isPanning ? "-webkit-grabbing" : "default";
        const handlers = {
            onMouseDown: this.handleMouseDown,
            onMouseMove: this.handleMouseMove,
            onMouseOut: this.handleMouseOut,
            onMouseUp: this.handleMouseUp,
            onContextMenu: this.handleContextMenu
        };

        // NOTE: The foreign object is necessary to render a div over the chart that can kill touch/pointer events
        // and allow the pointer event handlers higher up in the DOM to work predictably.  Style appropriately if
        // a form of zoom is enabled.
        let foreignObjectSizerStyle = {
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        };
        if (this.props.enableDragZoom === true || this.props.enablePanZoom === true) {
            foreignObjectSizerStyle.pointerEvents = "none";
            foreignObjectSizerStyle.touchAction = "none";
        }

        return (
            <g
                pointerEvents="all"
                ref={c => {
                    this.eventHandlerRef = c;
                }}
                {...handlers}
            >
                <foreignObject x={0} y={0} width={this.props.width} height={this.props.height}>
                    <div style={foreignObjectSizerStyle} />
                </foreignObject>
                <rect
                    key="handler-hit-rect"
                    ref={c => {
                        this.eventRect = c;
                    }}
                    style={{ fill: "#000", opacity: 0.0, cursor }}
                    x={0}
                    y={0}
                    width={this.props.width}
                    height={this.props.height}
                />
                {this.props.children}
                {this.state.isDragging && (
                    <rect
                        style={{ opacity: 0.3, fill: "grey" }}
                        x={Math.min(this.state.currentDragZoom, this.state.initialDragZoom)}
                        y={0}
                        width={Math.abs(this.state.currentDragZoom - this.state.initialDragZoom)}
                        height={this.props.height}
                        pointerEvents="none"
                    />
                )}
            </g>
        );
    }
}

EventHandler.propTypes = {
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
    enablePanZoom: PropTypes.bool,
    enableDragZoom: PropTypes.bool,
    scale: PropTypes.func.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    maxTime: PropTypes.instanceOf(Date),
    minTime: PropTypes.instanceOf(Date),
    minDuration: PropTypes.number,
    onZoom: PropTypes.func,
    onPinchZoomStart: PropTypes.func,
    onPinchZoomEnd: PropTypes.func,
    onMouseMove: PropTypes.func,
    onMouseOut: PropTypes.func,
    onMouseClick: PropTypes.func,
    onContextMenu: PropTypes.func
};

EventHandler.defaultProps = {
    enablePanZoom: false,
    enableDragZoom: false
};
