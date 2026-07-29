import React, { useState, useRef } from 'react';

// ─── LAPTOP FRAME (For Websites) ──────────────────────────────────────────────
export const LaptopFrame = ({ videoSrc, imageSrc, title, fallbackContent }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const isEmbed = videoSrc && (videoSrc.includes('youtube.com') || videoSrc.includes('youtu.be') || videoSrc.includes('vimeo.com'));

  const getEmbedSrc = (url) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      const id = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1`;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1`;
    }
    if (url.includes('vimeo.com/')) {
      const id = url.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${id}?autoplay=1&loop=1&muted=1&background=1`;
    }
    return url;
  };

  return (
    <div className="laptop-frame-wrapper" style={{ width: '100%', margin: '0 auto 1.5rem auto', maxWidth: '720px' }}>
      <style>{`
        .laptop-container {
          position: relative;
          width: 100%;
        }
        .laptop-screen {
          position: relative;
          background: #0d0d12;
          border: 12px solid #1a1a24;
          border-bottom: none;
          border-radius: 14px 14px 0 0;
          box-shadow: 0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08);
          overflow: hidden;
          aspect-ratio: 16 / 10;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .laptop-camera {
          position: absolute;
          top: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 6px;
          height: 6px;
          background: #2a2a36;
          border-radius: 50%;
          z-index: 10;
        }
        .laptop-media {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: #0d0d12;
          border: none;
        }
        .laptop-base {
          position: relative;
          width: 108%;
          left: -4%;
          height: 14px;
          background: linear-gradient(180deg, #2a2a38 0%, #15151f 100%);
          border-radius: 0 0 12px 12px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }
        .laptop-notch {
          width: 60px;
          height: 5px;
          background: #111118;
          border-radius: 0 0 4px 4px;
        }
        .device-video-overlay {
          position: absolute;
          bottom: 10px;
          right: 10px;
          display: flex;
          gap: 6px;
          z-index: 20;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .laptop-screen:hover .device-video-overlay {
          opacity: 1;
        }
        .video-control-btn {
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff;
          border-radius: 20px;
          padding: 4px 10px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .video-control-btn:hover {
          background: rgba(255, 255, 255, 0.25);
        }
      `}</style>
      <div className="laptop-container">
        <div className="laptop-screen">
          <div className="laptop-camera"></div>
          {videoSrc ? (
            isEmbed ? (
              <iframe
                src={getEmbedSrc(videoSrc)}
                className="laptop-media"
                title={title || 'Website Demo Video'}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="laptop-media"
                  src={videoSrc}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                />
                <div className="device-video-overlay">
                  <button className="video-control-btn" onClick={togglePlay}>
                    {isPlaying ? '⏸ Pause' : '▶ Play'}
                  </button>
                  <button className="video-control-btn" onClick={toggleMute}>
                    {isMuted ? '🔇 Unmute' : '🔊 Mute'}
                  </button>
                </div>
              </>
            )
          ) : imageSrc ? (
            <img className="laptop-media" src={imageSrc} alt={title || 'Laptop preview'} />
          ) : (
            fallbackContent || (
              <div style={{ textAlign: 'center', color: '#71717a', padding: '1rem' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>💻</span>
                <p style={{ fontSize: '0.85rem' }}>Website Video Preview</p>
                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Add video URL in Admin Panel</span>
              </div>
            )
          )}
        </div>
        <div className="laptop-base">
          <div className="laptop-notch"></div>
        </div>
      </div>
    </div>
  );
};


// ─── PHONE FRAME (For Mobile Apps) ─────────────────────────────────────────────
export const PhoneFrame = ({ videoSrc, imageSrc, title, fallbackContent }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const isEmbed = videoSrc && (videoSrc.includes('youtube.com') || videoSrc.includes('youtu.be') || videoSrc.includes('vimeo.com'));

  const getEmbedSrc = (url) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      const id = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1`;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1`;
    }
    if (url.includes('vimeo.com/')) {
      const id = url.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${id}?autoplay=1&loop=1&muted=1&background=1`;
    }
    return url;
  };

  return (
    <div className="phone-frame-wrapper" style={{ width: '100%', maxWidth: '280px', margin: '0 auto 1.5rem auto' }}>
      <style>{`
        .phone-container {
          position: relative;
          width: 100%;
          background: #181824;
          border: 10px solid #222230;
          border-radius: 36px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1);
          overflow: hidden;
          aspect-ratio: 9 / 19;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .phone-notch {
          position: absolute;
          top: 8px;
          width: 80px;
          height: 18px;
          background: #0d0d12;
          border-radius: 10px;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 8px;
        }
        .phone-camera-lens {
          width: 6px;
          height: 6px;
          background: #1c1c28;
          border-radius: 50%;
        }
        .phone-media {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: #0d0d12;
          border: none;
        }
        .phone-home-bar {
          position: absolute;
          bottom: 6px;
          width: 90px;
          height: 4px;
          background: rgba(255, 255, 255, 0.4);
          border-radius: 2px;
          z-index: 10;
        }
        .phone-container:hover .device-video-overlay {
          opacity: 1;
        }
      `}</style>
      <div className="phone-container">
        <div className="phone-notch">
          <div className="phone-camera-lens"></div>
        </div>
        {videoSrc ? (
          isEmbed ? (
            <iframe
              src={getEmbedSrc(videoSrc)}
              className="phone-media"
              title={title || 'Mobile App Video'}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : (
            <>
              <video
                ref={videoRef}
                className="phone-media"
                src={videoSrc}
                autoPlay
                loop
                muted={isMuted}
                playsInline
              />
              <div className="device-video-overlay">
                <button className="video-control-btn" onClick={togglePlay}>
                  {isPlaying ? '⏸' : '▶'}
                </button>
                <button className="video-control-btn" onClick={toggleMute}>
                  {isMuted ? '🔇' : '🔊'}
                </button>
              </div>
            </>
          )
        ) : imageSrc ? (
          <img className="phone-media" src={imageSrc} alt={title || 'Mobile app preview'} />
        ) : (
          fallbackContent || (
            <div style={{ textAlign: 'center', color: '#71717a', padding: '1rem' }}>
              <span style={{ fontSize: '2.2rem', display: 'block', marginBottom: '0.5rem' }}>📱</span>
              <p style={{ fontSize: '0.85rem' }}>Mobile App Video</p>
              <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Add video URL in Admin Panel</span>
            </div>
          )
        )}
        <div className="phone-home-bar"></div>
      </div>
    </div>
  );
};


// ─── DUAL DEVICE FRAME (Both Website & Mobile App) ───────────────────────────
export const DualDeviceFrame = ({ webVideoSrc, webImageSrc, appVideoSrc, appImageSrc, title }) => {
  return (
    <div className="dual-device-grid" style={{ margin: '0 auto 1.5rem auto', width: '100%', maxWidth: '850px' }}>
      <style>{`
        .dual-device-grid {
          display: grid;
          grid-template-columns: 1.4fr 0.8fr;
          gap: 1.5rem;
          align-items: center;
        }
        @media (max-width: 768px) {
          .dual-device-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem;
          }
        }
      `}</style>
      <div>
        <span style={{ display: 'block', fontSize: '0.75rem', color: '#60a5fa', fontWeight: 700, marginBottom: '0.4rem', textAlign: 'center' }}>
          💻 Web Portal
        </span>
        <LaptopFrame videoSrc={webVideoSrc} imageSrc={webImageSrc} title={`${title} Web`} />
      </div>
      <div>
        <span style={{ display: 'block', fontSize: '0.75rem', color: '#c084fc', fontWeight: 700, marginBottom: '0.4rem', textAlign: 'center' }}>
          📱 Mobile App
        </span>
        <PhoneFrame videoSrc={appVideoSrc} imageSrc={appImageSrc} title={`${title} App`} />
      </div>
    </div>
  );
};

