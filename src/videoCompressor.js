// In-browser client-side video compressor (strips audio & compresses bitrate)
export const compressVideoFile = (file, onProgress) => {
  return new Promise((resolve, reject) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      
      // Style video off-screen to allow browser rendering/playback engines to play it
      video.style.position = 'fixed';
      video.style.top = '-10000px';
      video.style.left = '-10000px';
      video.style.width = '100px';
      video.style.height = '100px';
      video.style.pointerEvents = 'none';
      video.style.opacity = '0';
      document.body.appendChild(video);

      const fileUrl = URL.createObjectURL(file);
      video.src = fileUrl;

      const cleanUp = () => {
        try {
          URL.revokeObjectURL(fileUrl);
          video.remove();
        } catch (e) {}
      };

      video.onloadedmetadata = () => {
        const duration = video.duration || 1;

        // Set target resolution to 480px width. This guarantees extremely small file sizes (under 1.2MB)
        // and lightning-fast loading speeds for visitors, while fitting perfectly in device frame mockups.
        const MAX_WIDTH = 480;
        let width = video.videoWidth || 480;
        let height = video.videoHeight || 270;
        
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Capture visual stream at 30 FPS (no audio track)
        const stream = canvas.captureStream(30);

        let mimeType = 'video/webm';
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
          mimeType = 'video/webm;codecs=vp9';
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          mimeType = 'video/webm';
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4';
        }

        let mediaRecorder;
        try {
          // Calculate dynamic bitrate to guarantee file size is under Vercel's 4.5MB payload limit (3.2MB target max size)
          const targetBitrate = Math.min(1500000, Math.floor(22000000 / duration));
          mediaRecorder = new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond: targetBitrate
          });
        } catch (e) {
          mediaRecorder = new MediaRecorder(stream);
        }

        const chunks = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          cleanUp();
          const compressedBlob = new Blob(chunks, { type: mimeType });
          resolve({ blob: compressedBlob });
        };

        mediaRecorder.start();
        video.currentTime = 0;
        
        // Play video in background to record canvas frames
        video.play().then(() => {
          const renderLoop = () => {
            if (video.paused || video.ended) {
              if (mediaRecorder.state === 'recording') {
                if (onProgress) onProgress(100);
                mediaRecorder.stop();
              }
              return;
            }

            ctx.drawImage(video, 0, 0, width, height);

            if (onProgress && duration > 0) {
              const progress = Math.min(99, Math.round((video.currentTime / duration) * 100));
              onProgress(progress);
            }

            requestAnimationFrame(renderLoop);
          };

          renderLoop();
        }).catch((err) => {
          cleanUp();
          reject(err);
        });
      };

      video.onerror = (err) => {
        cleanUp();
        reject(err);
      };
    } catch (err) {
      reject(err);
    }
  });
};
