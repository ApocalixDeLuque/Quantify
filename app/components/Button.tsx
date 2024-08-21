'use client';

import { useRecordVoice } from '@/hooks/useRecordVoice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone } from '@fortawesome/free-solid-svg-icons';

const Microphone = () => {
  const { startRecording, stopRecording, voiceToText } = useRecordVoice();

  return (
    <>
      <button
        onMouseDown={startRecording} // start recording when mouse is pressed
        onMouseUp={stopRecording} // stop recording when mouse is released
        onTouchStart={startRecording} // start recording when touch begins on a touch device
        onTouchEnd={stopRecording} // stop recording when touch ends on a touch device
        className="border-none bg-transparent w-10"
      >
        {/* Microphone icon component */}
        <FontAwesomeIcon icon={faMicrophone} />
      </button>
      <p className="w-[500px] text-center">{voiceToText}</p>
    </>
  );
};

export { Microphone };
