import React from 'react';
import ReactPlayer from 'react-player';
const ReactPlayerAny = ReactPlayer as any;

interface VideoPlayerProps {
    url: string;
    onEnded?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, onEnded }) => {
    return (
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
            <ReactPlayerAny
                url={url}
                className="absolute top-0 left-0"
                width="100%"
                height="100%"
                controls
                playing={false}
                onEnded={onEnded}
                config={{
                    file: {
                        forceHLS: true,
                    }
                } as any}
            />
        </div>
    );
};
