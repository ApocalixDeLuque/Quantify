'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@radix-ui/react-avatar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faPaperPlane, faScaleBalanced, faVolumeHigh } from '@fortawesome/free-solid-svg-icons';
import { useRecordVoice } from '@/hooks/useRecordVoice';

interface Message {
  content: string;
  isUser: boolean;
  timestamp: string;
  audioUrl?: string;
}

const formatDate = (date: Date): string => {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
};

const Dashboard: React.FC = () => {
  const { recording, startRecording, stopRecording, voiceToText } = useRecordVoice();
  const [generatingAudio, setGeneratingAudio] = useState<{ [key: string]: boolean }>({});
  const [generatingResponse, setGeneratingResponse] = useState(false);
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      content: '¡Hola! soy Quantify, tu asistente de voz para conversión de unidades. ¿Qué vamos a convertir hoy? ⚖️',
      isUser: false,
      timestamp: formatDate(new Date()),
    },
  ]);
  const [audioCache, setAudioCache] = useState<{ [key: string]: string }>({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    console.log('updating voiceToText');
    console.log(voiceToText);
    handleSendMessage(voiceToText);
  }, [voiceToText]);

  const handleSendMessage = async (message: string): Promise<void> => {
    if (message.trim() !== '') {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          content: message,
          isUser: true,
          timestamp: formatDate(new Date()),
        },
      ]);
      setText('');

      setGeneratingResponse(true);
      try {
        const response = await fetch('/api/chatResponse', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message }),
        });
        const data = await response.json();
        const botMessage: Message = {
          content: data.choices[0].message.content,
          isUser: false,
          timestamp: formatDate(new Date()),
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
        await handleTTS(botMessage);
      } catch (error) {
        console.error('Error fetching chat response:', error);
      } finally {
        setGeneratingResponse(false);
      }
    }
  };

  const handleTTS = async (message: Message): Promise<void> => {
    if (message.audioUrl) {
      setGeneratingAudio((prevState) => ({ ...prevState, [message.content]: true }));
      new Audio(message.audioUrl).play();
      setGeneratingAudio((prevState) => ({ ...prevState, [message.content]: false }));
    } else {
      setGeneratingAudio((prevState) => ({ ...prevState, [message.content]: true }));
      try {
        const response = await fetch('/api/textToSpeech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: message.content,
          }),
        }).then((res) => res.json());
        const { audio } = response;
        if (audio) {
          const audioUrl = `data:audio/mp3;base64,${audio}`;
          setAudioCache((prevCache) => ({ ...prevCache, [message.content]: audioUrl }));
          new Audio(audioUrl).play();
          setMessages((prevMessages) =>
            prevMessages.map((msg) => (msg.content === message.content ? { ...msg, audioUrl } : msg))
          );
          setGeneratingAudio((prevState) => ({ ...prevState, [message.content]: false }));
        }
      } catch (error) {
        console.error('Error fetching audio from text:', error);
        setGeneratingAudio((prevState) => ({ ...prevState, [message.content]: false }));
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b bg-background">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faScaleBalanced} className="w-6 h-6 text-primary" />
          <div className="text-lg font-medium">Quantify</div>
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        <div className="flex flex-col gap-4 p-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex w-full items-start justify-end ${message.isUser ? '' : 'flex-row-reverse'} gap-3`}
            >
              <div className="flex flex-col w-fit min-w-[10%] max-w-[50%] gap-2">
                <div
                  className={`flex flex-col rounded-lg p-3 gap-1 ${
                    message.isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                  }`}
                >
                  <p>{message.content}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`self-start min-w-fit p-2 gap-2 ${
                      message.isUser
                        ? 'hover:bg-accent hover:text-accent-foreground'
                        : 'hover:bg-accent-foreground hover:text-accent'
                    }`}
                    onClick={() => handleTTS(message)}
                    disabled={generatingAudio[message.content]}
                  >
                    <FontAwesomeIcon className="w-4 h-4 text-muted-foreground" icon={faVolumeHigh} />
                    <p className="text-xs">{generatingAudio[message.content] ? 'Generando...' : 'Reproducir'}</p>
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">{message.timestamp}</div>
              </div>
              <Avatar className="w-8 h-8 border">
                <AvatarImage
                  src={message.isUser ? '/placeholder-user.jpg' : '/placeholder-user.jpg'}
                  alt={`${message.isUser ? 'User' : 'Bot'} Avatar`}
                />
                <AvatarFallback>{message.isUser ? 'U' : 'B'}</AvatarFallback>
              </Avatar>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>
      <footer
        className={`sticky bottom-0 z-10 flex items-center gap-2 px-4 py-3 border-t bg-background ${
          generatingResponse ? 'disabled-footer' : ''
        }`}
      >
        <Textarea
          placeholder="Escribe un mensaje..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              sendButtonRef.current?.click();
            }
          }}
        />
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          className={`min-w-20 min-h-fit rounded-lg min-h-5 border-none bg-transparent w-10 py-2 ${
            recording ? 'bg-[#ffcdd2] text-[#c62828] animate-jump' : 'bg-[#eee] text-[#555555]'
          }`}
        >
          <FontAwesomeIcon icon={faMicrophone} />
        </button>
        <Button
          ref={sendButtonRef}
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => handleSendMessage(text)}
          disabled={generatingResponse}
        >
          <FontAwesomeIcon icon={faPaperPlane} className="w-5 h-5 text-muted-foreground" />
        </Button>
      </footer>
    </div>
  );
};

export default Dashboard;
