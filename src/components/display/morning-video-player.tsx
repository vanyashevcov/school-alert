
'use client';

import { useEffect, useRef } from 'react';

interface MorningVideoPlayerProps {
    onVideoEnd: () => void;
}

export default function MorningVideoPlayer({ onVideoEnd }: MorningVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        // Ensure video is unmuted if audio context is running
        if (videoRef.current) {
            videoRef.current.muted = false;
        }
    }, []);

    return (
        <div className="absolute inset-0 z-[200] bg-black flex items-center justify-center">
            <video
                ref={videoRef}
                src="/video.mp4"
                autoPlay
                onEnded={onVideoEnd}
                className="w-full h-full object-cover"
            />
        </div>
    );
}
