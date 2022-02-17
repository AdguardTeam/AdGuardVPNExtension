import React, { useRef, useEffect } from 'react';

interface CanvasAnimationProps {
    loop: boolean,
    animationDir: string,
}

export const CanvasAnimation = ({ loop, animationDir }: CanvasAnimationProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lastFrame = 50;
    const framesPerSecond = 1000 / 24;

    useEffect(() => {
        let currentFrame = 0;
        const canvas = canvasRef.current;
        if (canvas) {
            // Pixel doubling for high resolution
            canvas.width = 640;
            canvas.height = 1050;
            canvas.style.width = '320px';
            canvas.style.height = '525px';

            const context = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                context?.clearRect(0, 0, context.canvas.width, context.canvas.height);
                context?.drawImage(img, 0, 0);
            };

            const timer = setInterval(() => {
                const endAnimation = currentFrame === lastFrame;

                console.log(animationDir);

                if (!loop && endAnimation) {
                    clearInterval(timer);
                }

                if (endAnimation) {
                    currentFrame = 0;
                } else {
                    img.src = `../../../../assets/frames/${animationDir}/${currentFrame += 1}.jpg`;
                }
            }, framesPerSecond);
        }
    }, []);

    return <canvas aria-label="animation" ref={canvasRef} />;
};
