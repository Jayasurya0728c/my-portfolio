// In-browser client-side video compressor (strips audio & compresses bitrate)
export const compressVideoFile = (file, onProgress) => {
  return new Promise((resolve, reject) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      const fileUrl = URL.createObjectURL(file);
      video.src = fileUrl;

      video.onloadedmetadata = () => {
        const duration = video.duration || 1;
        
        // Target resolution: max 960px width for crisp device frame playback
        const MAX_WIDTH = 960;
        let width = video.videoWidth || 960;
        let height = video.videoHeight || 540;
        
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
          mediaRecorder = new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond: 800000 // 800 kbps crisp lightweight stream
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
          URL.revokeObjectURL(fileUrl);
          const compressedBlob = new Blob(chunks, { type: mimeType });
          const reader = new FileReader();
          reader.onloadend = () => resolve({ dataUrl: reader.result, blob: compressedBlob });
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(compressedBlob);
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
          URL.revokeObjectURL(fileUrl);
          reject(err);
        });
      };

      video.onerror = (err) => {
        URL.revokeObjectURL(fileUrl);
        reject(err);
      };
    } catch (err) {
      reject(err);
    }
  });
};
