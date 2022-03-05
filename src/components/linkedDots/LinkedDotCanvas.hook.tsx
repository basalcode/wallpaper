/* packages */
import { useEffect, useState } from 'react';

/* types */
import { CanvasSize, DotSize } from './LinkedDotCanvas';

// interfaces
export interface Dot {
    id: number,
    x: number,
    y: number,
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    radian: number,
    speed: number
}

// enums
export enum BoundaryIndex {
    Bottom = 0,
    Left,
    Top,
    Right
}

// functions
const getQuadrantIndex = (radian: number): number => {
    const qudrantUnit: number = Math.PI / 2;
    const quadrantIndex: number = Math.floor(radian / qudrantUnit);

    return quadrantIndex;
}

const getQuadrantMinRadian = (quadrantIndex: number): number => {
    const quadrantMaxRadian: number = quadrantIndex * (Math.PI / 2);

    return quadrantMaxRadian;
}

const getReflectedQuadrantIndex = (originalQuadrantIndex: number, boundaryIndex: number): number => {
    const nextIndex: number = 1;
    const previousIndex: number = -1;

    const isForwardDirection = moveQuadrantIndex(originalQuadrantIndex, -1) === boundaryIndex;
    const shiftingIndex: number = isForwardDirection ? nextIndex : previousIndex;

    const reflectedQuadrantIndex: number = moveQuadrantIndex(originalQuadrantIndex, shiftingIndex);
    return reflectedQuadrantIndex;
}

const moveQuadrantIndex = (currentQuadrantIndex: number, movement: number): number => {
    const quadrantAmount: number = 4;

    return (quadrantAmount + (currentQuadrantIndex + movement)) % quadrantAmount;
}

const getOverflowedRadian = (radian: number): number => {
    return radian % (Math.PI / 2);
}

const getReflexedDot = (currentDot: Dot, boundaryIndex: number): Dot => {
    const originalQuadrantIndex: number = getQuadrantIndex(currentDot.radian);
    const reflectedQuadrantIndex = getReflectedQuadrantIndex(originalQuadrantIndex, boundaryIndex);

    const reflectedRadian = getQuadrantMinRadian(reflectedQuadrantIndex) + ((Math.PI / 2) - getOverflowedRadian(currentDot.radian));

    const reflectedMovementX: number = Math.cos(reflectedRadian) * currentDot.speed;
    const reflectedMovementY: number = Math.sin(reflectedRadian) * currentDot.speed;

    const reflectedX: number = currentDot.x + reflectedMovementX;
    const reflectedY: number = currentDot.y + reflectedMovementY;

    const reflectedCenterX: number = getCenterCoordinate(reflectedX, currentDot.width);
    const reflectedCenterY: number = getCenterCoordinate(reflectedY, currentDot.height);

    const newDot: Dot = {
        ...currentDot,
        x: reflectedX,
        y: reflectedY,
        centerX: reflectedCenterX,
        centerY: reflectedCenterY,
        radian: reflectedRadian
    }

    return newDot;
}

const initializeDot = (canvasWidth: number, canvasHeight: number, pointWidth: number, pointHeight: number, id: number): Dot => {
    const x: number = Math.floor(Math.random() * (canvasWidth - pointWidth));
    const y: number = Math.floor(Math.random() * (canvasHeight - pointHeight));
    const centerX: number = getCenterCoordinate(x, pointWidth);
    const centerY: number = getCenterCoordinate(y, pointHeight);
    const radian: number = Math.random() * (Math.PI * 2);
    const speed: number = 1;

    const dot: Dot = {
        id: id,
        x: x,
        y: y,
        centerX: centerX,
        centerY: centerY,
        width: pointWidth,
        height: pointHeight,
        radian: radian,
        speed: speed
    }

    return dot;
}

const getInsertionIndex = (sortedDots: Array<Dot>, insertionCoodinate: number): number => {
    let startIndex: number = 0;
    let finishIndex: number = sortedDots.length - 1;
    let insertIndex: number = - 1;

    while (true) {
        const isReversedSequence: boolean = startIndex > finishIndex;
        if (isReversedSequence) {
            insertIndex = startIndex;
            break;
        }

        const range: number = finishIndex - startIndex;
        const centerIndex: number = Math.floor(startIndex + range / 2);
        const centerElement: Dot = sortedDots[centerIndex];
        const centerCooridnate: number = centerElement.x;

        const isSearchDirectionForward: boolean = insertionCoodinate < centerCooridnate;
        const isSearchDirectionBackward: boolean = insertionCoodinate > centerCooridnate;
        const isSameAsCenterVlaue: boolean = insertionCoodinate === centerCooridnate;

        if (isSameAsCenterVlaue) {
            insertIndex = centerIndex;
            break;
        }

        if (isSearchDirectionForward) {
            finishIndex = centerIndex - 1;
            continue;
        };
        if (isSearchDirectionBackward) {
            startIndex = centerIndex + 1;
            continue;
        }
    }

    return insertIndex;
}

const getOverflowBoundsIndex = (newDot: Dot, canvasSize: CanvasSize): number => {
    const { x, y, width, height }: Dot = newDot;
    const canvasWidth: number = canvasSize.width;
    const canvasHeight: number = canvasSize.height;

    const isTopOutOfBounds: boolean = y < 0;
    if (isTopOutOfBounds) return BoundaryIndex.Top;

    const isLeftOutOfBounds: boolean = x < 0;
    if (isLeftOutOfBounds) return BoundaryIndex.Left

    const isBottomOutOfBounds: boolean = y + height > canvasHeight;
    if (isBottomOutOfBounds) return BoundaryIndex.Bottom

    const isRightOutOfBounds: boolean = x + width > canvasWidth;
    if (isRightOutOfBounds) return BoundaryIndex.Right

    const isNotOverflowed = -1;
    return isNotOverflowed;
}

const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

const getCenterCoordinate = (coordinate: number, size: number): number => {
    return coordinate + (size / 2);
}

export const useLinkedDotAnimation = (context: CanvasRenderingContext2D | null, dotAmount: number, canvasSize: CanvasSize, dotSize: DotSize, linkingRadius: number, framePerSecond: number, dotColor: string, lineColor: string) => {
    const [dots, setDots] = useState<Array<Dot> | null>(null);

    useEffect(() => {
        if (!context) return;

        const canvasWidth: number = canvasSize.width;
        const cavnasHeight: number = canvasSize.height;
        const dotWidth: number = dotSize.width;
        const dotHeight: number = dotSize.height;

        if (!dots) {
            const initializer = Array<number>(dotAmount).fill(0);

            const initializedDots: Array<Dot> = initializer.map((_, index): Dot => {
                const dotId: number = index;
                const initializedDot: Dot = initializeDot(canvasWidth, cavnasHeight, dotWidth, dotHeight, dotId);

                return initializedDot;
            });

            const sortedInitializedDots: Array<Dot> = initializedDots.sort((target: Dot, next: Dot): number => { return target.centerX - next.centerY; });

            setDots(sortedInitializedDots);
            return;
        }

        const secondUnit: number = 1000;
        const secondPerFrame: number = secondUnit / framePerSecond;
        const rendererId = setTimeout(() => {
            context.clearRect(0, 0, canvasWidth, cavnasHeight);

            const newDots = dots.map((dot: Dot) => {
                const movementX: number = Math.cos(dot.radian) * dot.speed;
                const movementY: number = Math.sin(dot.radian) * dot.speed;

                const newX: number = dot.x + movementX;
                const newY: number = dot.y + movementY;
                const centerX: number = getCenterCoordinate(newX, dot.width);
                const centerY: number = getCenterCoordinate(newY, dot.height);

                let newDot: Dot = {
                    ...dot,
                    x: newX,
                    y: newY,
                    centerX: centerX,
                    centerY: centerY
                }

                const overflowedBoundIndex: number = getOverflowBoundsIndex(newDot, canvasSize);
                const isOverflowed: boolean = overflowedBoundIndex !== -1;

                if (isOverflowed) newDot = getReflexedDot(dot, overflowedBoundIndex);

                context.strokeStyle = `rgb(255, 255, 255)`;
                context.strokeRect(newDot.x, newDot.y, newDot.width, newDot.height);

                return newDot;
            });

            const sortedNewDots: Array<Dot> = newDots.sort((target: Dot, next: Dot): number => { return target.centerX - next.centerX });

            sortedNewDots.forEach((standardDot: Dot, index: number): void => {
                const centerX: number = standardDot.centerX;
                const centerY: number = standardDot.centerY;

                const filterFinishX: number = (centerX + linkingRadius) > canvasWidth ? canvasWidth : (centerX + linkingRadius);

                const filteredFinishIndex: number = getInsertionIndex(sortedNewDots, filterFinishX);

                for (let filteredIndex = index; filteredIndex < filteredFinishIndex; filteredIndex++) {
                    const dotInsideFilter: Dot = sortedNewDots[filteredIndex];
                    const filteredDotCenterX: number = dotInsideFilter.centerX;
                    const filteredDotCenterY: number = dotInsideFilter.centerY;

                    const distance: number = getDistance(centerX, centerY, filteredDotCenterX, filteredDotCenterY);
                    const isInsideRange: boolean = distance <= linkingRadius;

                    if (isInsideRange) {
                        const maximumOpacity: number = 0.8;
                        const opacity: number = maximumOpacity - (distance / linkingRadius);
                        context.strokeStyle = `rgba(255, 255, 255, ${opacity})`;

                        context.beginPath();
                        context.moveTo(centerX, centerY);
                        context.lineTo(filteredDotCenterX, filteredDotCenterY);
                        context.stroke();
                    }
                }
            });

            setDots(sortedNewDots);
        }, secondPerFrame);

        return () => clearTimeout(rendererId);
    }, [context, dots, canvasSize]);
}