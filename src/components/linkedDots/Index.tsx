import { FunctionComponent, useEffect, useMemo, useState } from 'react';

import Layout from 'components/common/Layout';

import style from './Index.module.scss';

interface Dot {
    x: number,
    y: number,
    radian: number,
    speed: number
}

const Index: FunctionComponent = () => {
    const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);
    const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
    const [dots, setDots] = useState<Array<Dot>>([]);

    const pointAmount: number = 10;

    useEffect(() => {
        if (!canvasElement) return;
        const context: CanvasRenderingContext2D | null = canvasElement.getContext('2d');

        if (!canvasElement) return;
        if (!context) return;

        setContext(context);

        const width: number = canvasElement.width;
        const height: number = canvasElement.height;

        for (let i = 0; i < pointAmount; i++) {
            const x: number = Math.floor(Math.random() * width);
            const y: number = Math.floor(Math.random() * height);
            const radian: number = Math.random() * (Math.PI * 2);
            const degree: number = radian / Math.PI * 180;
            const speed: number = 1;

            const dot: Dot = {
                x: x,
                y: y,
                radian: radian,
                speed: speed
            }
            dots.push(dot);

            context?.strokeRect(x, y, 4, 4);
        }

        return () => {
            context.clearRect(0, 0, width, height);
        }
    }, [canvasElement]);

    const framePerSecond: number = 144;
    const secondUnit: number = 1000;
    const secondPerFrame: number = secondUnit / framePerSecond;

    const getQuadrantIndex = (radian: number): number => {
        const qudrantUnit: number = Math.PI / 2;
        const quadrantIndex: number = Math.floor(radian / qudrantUnit);

        return quadrantIndex;
    }

    const getQuadrantMinRadian = (quadrantIndex: number): number => {
        const quadrantMaxRadian: number = quadrantIndex * (Math.PI / 2);

        return quadrantMaxRadian;
    }

    const getQuadrantDirection = (originalQuadrantIndex: number, boundIndex: number): number => {
        return moveQuadrantIndex(originalQuadrantIndex, -1) === boundIndex ? 1 : -1;
    }

    const quadrantAmount = 4;
    const moveQuadrantIndex = (currentQuadrantIndex: number, movement: number) => {
        return (quadrantAmount + (currentQuadrantIndex + movement)) % quadrantAmount;
    }

    const getOverflowedRadian = (radian: number) => {
        return radian % (Math.PI / 2);
    }

    const getReflexedDot = (currentDot: Dot, boundaryIndex: number): Dot => {
        const originalQuadrantIndex: number = getQuadrantIndex(currentDot.radian);
        const quadrantDirection: number = getQuadrantDirection(originalQuadrantIndex, boundaryIndex);
        const newQuadrantIndex = moveQuadrantIndex(originalQuadrantIndex, quadrantDirection);
        const newRadian = getQuadrantMinRadian(newQuadrantIndex) + ((Math.PI / 2) - getOverflowedRadian(currentDot.radian));

        const newMoveX: number = Math.cos(newRadian) * currentDot.speed;
        const newMoveY: number = Math.sin(newRadian) * currentDot.speed;

        let newX: number = currentDot.x + newMoveX;
        let newY: number = currentDot.y + newMoveY;

        const newDot: Dot = {
            x: newX,
            y: newY,
            radian: newRadian,
            speed: currentDot.speed
        }

        return newDot;
    }

    useEffect(() => {
        if (!canvasElement) return;


        const rendererId = setTimeout(() => {
            const width: number = canvasElement.width;
            const height: number = canvasElement.height;

            context?.clearRect(0, 0, width, height);

            const newDots = dots.map((dot: Dot) => {
                const moveX: number = Math.cos(dot.radian) * dot.speed;
                const moveY: number = Math.sin(dot.radian) * dot.speed;

                const newX: number = dot.x + moveX;
                const newY: number = dot.y + moveY;


                const isTopOutOfBounds: boolean = newY < 0;
                const isLeftOutOfBounds: boolean = newX < 0;
                const isBottomOutOfBounds: boolean = newY > height;
                const isRightOutOfBounds: boolean = newX > width;

                const isOutOfBounds: boolean = isTopOutOfBounds || isLeftOutOfBounds || isBottomOutOfBounds || isRightOutOfBounds;

                if (isOutOfBounds) {
                    if (isTopOutOfBounds) {
                        const newDot: Dot = getReflexedDot(dot, 2);

                        context?.strokeRect(newDot.x, newDot.y, 4, 4);
                        return newDot;
                    }
                    if (isLeftOutOfBounds) {
                        const newDot: Dot = getReflexedDot(dot, 1);

                        context?.strokeRect(newDot.x, newDot.y, 4, 4);
                        return newDot;
                    }
                    if (isBottomOutOfBounds) {
                        const newDot: Dot = getReflexedDot(dot, 0);

                        context?.strokeRect(newDot.x, newDot.y, 4, 4);
                        return newDot;
                    }
                    if (isRightOutOfBounds) {
                        const newDot: Dot = getReflexedDot(dot, 3);

                        context?.strokeRect(newDot.x, newDot.y, 4, 4);
                        return newDot;
                    }
                }

                const newDot: Dot = { x: newX, y: newY, radian: dot.radian, speed: dot.speed };

                context?.strokeRect(newDot.x, newDot.y, 4, 4);

                return newDot;
            });

            setDots(newDots);
        }, secondPerFrame);

        return () => clearTimeout(rendererId);
    }, [canvasElement, dots]);

    return (
        <Layout>
            <canvas
                className={style.canvas}
                width={500}
                height={500}
                ref={element => setCanvasElement(element)}
            ></canvas>
        </Layout>
    );
}

export default Index;