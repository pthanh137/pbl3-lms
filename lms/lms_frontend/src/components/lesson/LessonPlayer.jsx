import { useState, useEffect, useRef } from 'react';
import { enrollmentsAPI } from '../../api/client';

/**
 * Premium Udemy-style Video Player Component
 * 
 * Features:
 * - Playback speed control (0.5x, 1x, 1.25x, 1.5x, 2x)
 * - Auto play next lesson when video ends
 * - Progress bar and duration display
 * - Remember playback position in localStorage
 * - Fullscreen support
 * - Auto mark as completed at 90% or manual
 * - Responsive design
 */
const LessonPlayer = ({ 
  lesson, 
  videoUrl, 
  onComplete, 
  onNextLesson,
  isCompleted: externalIsCompleted = false 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(externalIsCompleted);
  const [completing, setCompleting] = useState(false);

  // Sync with external isCompleted prop
  useEffect(() => {
    setIsCompleted(externalIsCompleted);
  }, [externalIsCompleted]);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState(null);

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const playerRef = useRef(null); // For YouTube IFrame API
  const isYouTubeRef = useRef(false);
  const progressCheckIntervalRef = useRef(null);

  const playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  // Check if URL is YouTube
  const isYouTubeUrl = (url) => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  // Get YouTube video ID
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    
    if (url.includes('youtube.com/watch?v=')) {
      return url.split('v=')[1]?.split('&')[0];
    }
    if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1]?.split('?')[0];
    }
    if (url.includes('youtube.com/embed/')) {
      return url.split('embed/')[1]?.split('?')[0];
    }
    return null;
  };

  // Load YouTube IFrame API
  useEffect(() => {
    if (!videoUrl || !isYouTubeUrl(videoUrl) || !containerRef.current) return;

    const initialize = () => {
      if (window.YT && window.YT.Player) {
        initializeYouTubePlayer();
      }
    };

    // Check if YouTube API is already loaded
    if (window.YT && window.YT.Player) {
      initialize();
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      // Wait for API to be ready
      const checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          initialize();
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    // Load YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // Set up global callback
    const originalCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (originalCallback) originalCallback();
      initialize();
    };

    return () => {
      stopProgressTracking();
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // Ignore cleanup errors
        }
        playerRef.current = null;
        isYouTubeRef.current = false;
      }
    };
  }, [videoUrl]);

  const initializeYouTubePlayer = () => {
    if (!videoUrl || !containerRef.current) return;

    const videoId = getYouTubeVideoId(videoUrl);
    if (!videoId) return;

    // Destroy existing player if any
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {
        // Ignore errors during cleanup
      }
      playerRef.current = null;
    }

    isYouTubeRef.current = true;

    // Wait a bit for DOM to be ready
    setTimeout(() => {
      try {
        playerRef.current = new window.YT.Player('youtube-player', {
          videoId: videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 0,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            enablejsapi: 1,
          },
          events: {
            onReady: (event) => {
              try {
                const savedTime = getSavedPlaybackPosition();
                const duration = event.target.getDuration();
                if (duration && savedTime > 0 && savedTime < duration) {
                  event.target.seekTo(savedTime, true);
                }
                if (duration) {
                  setDuration(duration);
                }
                const rate = event.target.getPlaybackRate();
                if (rate) {
                  setPlaybackRate(rate);
                }
              } catch (e) {
                console.log('Error in onReady:', e);
              }
            },
            onStateChange: (event) => {
              try {
                if (event.data === window.YT.PlayerState.PLAYING) {
                  setIsPlaying(true);
                  startProgressTracking();
                } else if (event.data === window.YT.PlayerState.PAUSED) {
                  setIsPlaying(false);
                  stopProgressTracking();
                } else if (event.data === window.YT.PlayerState.ENDED) {
                  setIsPlaying(false);
                  stopProgressTracking();
                  handleVideoEnd();
                }
              } catch (e) {
                console.log('Error in onStateChange:', e);
              }
            },
            onError: (event) => {
              console.error('YouTube player error:', event.data);
            },
          },
        });
      } catch (error) {
        console.error('Error initializing YouTube player:', error);
      }
    }, 200);
  };

  // Initialize HTML5 video player for non-YouTube videos
  useEffect(() => {
    if (!videoUrl || isYouTubeUrl(videoUrl) || !videoRef.current) return;

    const video = videoRef.current;
    const savedTime = getSavedPlaybackPosition();

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      if (savedTime > 0) {
        video.currentTime = savedTime;
      }
      video.playbackRate = playbackRate;
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      savePlaybackPosition(video.currentTime);
      checkCompletion(video.currentTime, video.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      startProgressTracking();
    };

    const handlePause = () => {
      setIsPlaying(false);
      stopProgressTracking();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      stopProgressTracking();
      handleVideoEnd();
    };

    const handleDurationChange = () => {
      setDuration(video.duration);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('durationchange', handleDurationChange);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('durationchange', handleDurationChange);
    };
  }, [videoUrl, playbackRate]);

  // Get saved playback position from localStorage
  const getSavedPlaybackPosition = () => {
    if (!lesson?.id) return 0;
    const saved = localStorage.getItem(`lesson_${lesson.id}_position`);
    return saved ? parseFloat(saved) : 0;
  };

  // Save playback position to localStorage
  const savePlaybackPosition = (time) => {
    if (!lesson?.id) return;
    localStorage.setItem(`lesson_${lesson.id}_position`, time.toString());
  };

  // Start tracking progress
  const startProgressTracking = () => {
    if (progressCheckIntervalRef.current) {
      clearInterval(progressCheckIntervalRef.current);
    }

    progressCheckIntervalRef.current = setInterval(() => {
      if (isYouTubeRef.current && playerRef.current) {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          const duration = playerRef.current.getDuration();
          if (currentTime !== undefined && duration !== undefined) {
            setCurrentTime(currentTime);
            savePlaybackPosition(currentTime);
            checkCompletion(currentTime, duration);
          }
        } catch (e) {
          // Player might not be ready yet
        }
      } else if (videoRef.current) {
        const currentTime = videoRef.current.currentTime;
        const duration = videoRef.current.duration;
        if (currentTime !== undefined && duration !== undefined) {
          checkCompletion(currentTime, duration);
        }
      }
    }, 500);
  };

  // Stop tracking progress
  const stopProgressTracking = () => {
    if (progressCheckIntervalRef.current) {
      clearInterval(progressCheckIntervalRef.current);
      progressCheckIntervalRef.current = null;
    }
  };

  // Check if lesson should be auto-completed (90% watched)
  const checkCompletion = (currentTime, totalDuration) => {
    if (isCompleted || !totalDuration || totalDuration === 0) return;
    
    const progress = (currentTime / totalDuration) * 100;
    if (progress >= 90 && !isCompleted) {
      handleComplete();
    }
  };

  // Handle video end
  const handleVideoEnd = () => {
    if (!isCompleted) {
      handleComplete();
    }
    if (onNextLesson) {
      setTimeout(() => {
        onNextLesson();
      }, 2000);
    }
  };

  // Toggle play/pause
  const togglePlayPause = (e) => {
    if (e) {
      e.stopPropagation();
    }
    if (isYouTubeRef.current && playerRef.current) {
      try {
        const state = playerRef.current.getPlayerState();
        if (state === window.YT.PlayerState.PLAYING) {
          playerRef.current.pauseVideo();
        } else {
          playerRef.current.playVideo();
        }
      } catch (e) {
        console.log('Error toggling YouTube player:', e);
      }
    } else if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  // Seek to specific time
  const seekTo = (time) => {
    if (isYouTubeRef.current && playerRef.current) {
      try {
        playerRef.current.seekTo(time, true);
      } catch (e) {
        console.log('Error seeking YouTube player:', e);
      }
    } else if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  // Change playback speed
  const changePlaybackRate = (rate) => {
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
    
    if (isYouTubeRef.current && playerRef.current) {
      try {
        playerRef.current.setPlaybackRate(rate);
      } catch (e) {
        console.log('Error setting YouTube playback rate:', e);
      }
    } else if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  // Close speed menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showSpeedMenu && !e.target.closest('.relative')) {
        setShowSpeedMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showSpeedMenu]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Show/hide controls on mouse movement
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
      const timeout = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
      setControlsTimeout(timeout);
    };

    if (containerRef.current) {
      containerRef.current.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
      }
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [isPlaying, controlsTimeout]);

  // Handle complete
  const handleComplete = async () => {
    if (isCompleted || completing || !lesson?.id) return;

    try {
      setCompleting(true);
      await enrollmentsAPI.completeLesson(lesson.id);
      setIsCompleted(true);
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error('Error completing lesson:', err);
      alert(err.response?.data?.detail || 'Failed to mark lesson as completed.');
    } finally {
      setCompleting(false);
    }
  };

  // Format time
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Check if lesson has document file instead of video
  const documentFileUrl = lesson?.document_file_url || lesson?.document_file;

  if (!videoUrl && !documentFileUrl) {
    return (
      <div className="w-full aspect-video bg-slate-900 rounded-xl flex items-center justify-center">
        <p className="text-slate-400">No content available</p>
      </div>
    );
  }

  // If document file exists, show document viewer
  if (documentFileUrl && !videoUrl) {
    return (
      <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Reading Material</h3>
              <p className="text-sm text-slate-600">Download and read the document below</p>
            </div>
          </div>
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-slate-900">Document File</p>
                  <p className="text-xs text-slate-500">Click to download and view</p>
                </div>
              </div>
              <a
                href={documentFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download & View
              </a>
            </div>
          </div>
          {lesson?.content && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Instructions</h4>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{lesson.content}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black rounded-xl overflow-hidden group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => {
        if (isPlaying) {
          setTimeout(() => setShowControls(false), 2000);
        }
      }}
    >
      {/* Video Container */}
      <div className="relative w-full aspect-video">
        {isYouTubeUrl(videoUrl) ? (
          <div id="youtube-player" className="w-full h-full"></div>
        ) : (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            onClick={togglePlayPause}
            playsInline
          />
        )}

        {/* Overlay Controls - Only active when controls are hidden */}
        {!showControls && (
          <div
            className="absolute inset-0 bg-black bg-opacity-0 transition-opacity duration-300 z-10"
            onClick={togglePlayPause}
          />
        )}

        {/* Control Bar */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 z-20 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress Bar */}
          <div className="px-4 pt-2 pb-1" onClick={(e) => e.stopPropagation()}>
            <div
              className="h-1 bg-slate-600 rounded-full cursor-pointer group/progress"
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percentage = clickX / rect.width;
                const newTime = percentage * duration;
                seekTo(newTime);
              }}
            >
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="h-full w-3 bg-blue-500 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity -translate-x-1/2 translate-y-[-2px]" />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="px-4 py-3 flex items-center justify-between gap-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              {/* Play/Pause Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayPause(e);
                }}
                className="text-white hover:text-blue-400 transition p-1 z-30 relative"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Time Display */}
              <div className="text-white text-sm font-medium">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Playback Speed */}
              <div className="relative z-30">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSpeedMenu(!showSpeedMenu);
                  }}
                  className="text-white hover:text-blue-400 transition px-2 py-1 text-sm font-medium"
                >
                  {playbackRate}x
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-slate-800 rounded-lg shadow-lg overflow-hidden z-10">
                    {playbackSpeeds.map((speed) => (
                      <button
                        key={speed}
                        onClick={(e) => {
                          e.stopPropagation();
                          changePlaybackRate(speed);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700 transition ${
                          playbackRate === speed ? 'bg-blue-600' : ''
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                className="text-white hover:text-blue-400 transition p-1 z-30 relative"
                aria-label="Fullscreen"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={isFullscreen ? "M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" : "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"}
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Center Play Button (when paused) */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause(e);
              }}
              className="w-20 h-20 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition transform hover:scale-110 pointer-events-auto"
              aria-label="Play"
            >
              <svg className="w-10 h-10 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Completion Status */}
      {isCompleted && (
        <div className="absolute top-4 right-4 bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Completed
        </div>
      )}
    </div>
  );
};

export default LessonPlayer;

