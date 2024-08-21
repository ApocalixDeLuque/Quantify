'use client';
import { useEffect, useState, useRef } from 'react';
import { blobToBase64 } from '@/utils/blobToBase64';
import { createMediaStream } from '@/utils/createMediaStream';

export const useRecordVoice = () => {
  const [voiceToText, setVoiceToText] = useState('');
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const isRecording = useRef(false);
  const chunks = useRef<Blob[]>([]);

  const startRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'inactive') {
      try {
        isRecording.current = true;
        mediaRecorder.start();
        setRecording(true);
      } catch (error) {
        console.error('Error starting MediaRecorder:', error);
      }
    } else {
      console.warn('MediaRecorder is not initialized or is already recording.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      isRecording.current = false;
      mediaRecorder.stop();
      setRecording(false);
    } else {
      console.warn('MediaRecorder is not recording.');
    }
  };

  const getText = async (base64data: string) => {
    try {
      const response = await fetch('/api/speechToText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: base64data,
        }),
      }).then((res) => res.json());
      const { text } = response;
      setVoiceToText(text);
    } catch (error) {
      console.error('Error fetching text from audio:', error);
    }
  };

  const initialMediaRecorder = (stream: MediaStream) => {
    try {
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.onstart = () => {
        createMediaStream(stream, isRecording.current, () => {});
        chunks.current = [];
      };

      mediaRecorder.ondataavailable = (ev: BlobEvent) => {
        chunks.current.push(ev.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks.current, { type: 'audio/wav' });
        blobToBase64(audioBlob, getText);
      };

      setMediaRecorder(mediaRecorder);
    } catch (error) {
      console.error('Error initializing MediaRecorder:', error);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(initialMediaRecorder)
        .catch((error) => {
          console.error('Error accessing audio devices:', error);
        });
    }
  }, []);

  return { recording, startRecording, stopRecording, voiceToText };
};
