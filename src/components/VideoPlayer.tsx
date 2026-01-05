import { useEffect, useRef, useState } from "react";

export const VideoPlayer = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch((error) => {
          console.error("Error playing video:", error);
        });
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  useEffect(() => {
    // Try to autoplay when component mounts
    const playVideo = async () => {
      if (videoRef.current) {
        try {
          await videoRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.log("Autoplay prevented:", error);
          // Autoplay was prevented, we'll show the play button
          setIsPlaying(false);
        }
      }
    };

    playVideo();
  }, []);

  return (
    <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
      <div className="relative w-full h-full bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          loop
          muted={isMuted}
          playsInline
          autoPlay
          onClick={togglePlay}
          onPlay={() => {
            console.log("Video started playing");
            setIsPlaying(true);
          }}
          onPause={() => {
            console.log("Video paused");
            setIsPlaying(false);
          }}
          onError={(e) => {
            const video = e.target as HTMLVideoElement;
            console.error("Video error:", video.error);
            console.log("Video source:", video.currentSrc);
            console.log("Video network state:", video.networkState);
            console.log("Video ready state:", video.readyState);
          }}
          onCanPlay={() => console.log("Video can play")}
          onLoadStart={() => console.log("Video loading started")}
          onLoadedData={() => console.log("Video loaded data")}
          onWaiting={() => console.log("Video waiting")}
          onStalled={() => console.log("Video stalled")}
          onSuspend={() => console.log("Video suspended")}
          onAbort={() => console.log("Video loading aborted")}
          onEmptied={() => console.log("Video emptied")}
        >
          <source src="/intro-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <button
              onClick={togglePlay}
              className="p-4 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              <svg
                className="w-12 h-12 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Play/Pause Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
        className={`absolute inset-0 m-auto w-16 h-16 bg-black/50 rounded-full text-white hover:bg-black/70 transition-all duration-200 flex items-center justify-center ${
          isPlaying ? "opacity-0 hover:opacity-100" : "opacity-100"
        }`}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <svg
            className="w-8 h-8"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            className="w-8 h-8"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

      {/* Mute Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleMute();
        }}
        className="absolute bottom-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-all duration-200"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
            />
          </svg>
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15.536 8.464a5 5 0 010 7.072M12 6l1.768-1.768a9 9 0 0112.728 12.728L12 6z"
            />
          </svg>
        )}
      </button>
    </div>
  );
};
