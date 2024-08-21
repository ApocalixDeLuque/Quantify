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
  const { startRecording, stopRecording, voiceToText } = useRecordVoice();
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      content: '¡Hola! soy Quantify, tu asistente de voz para conversión de unidades. ¿Qué vamos a convertir hoy? ⚖️',
      isUser: false,
      timestamp: formatDate(new Date()),
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (voiceToText.trim() !== '') {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          content: voiceToText,
          isUser: true,
          timestamp: formatDate(new Date()),
        },
      ]);
    }
  }, [voiceToText]);

  const handleSendMessage = (): void => {
    if (text.trim() !== '') {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          content: text,
          isUser: true,
          timestamp: formatDate(new Date()),
        },
      ]);
      setText('');
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
                  >
                    <FontAwesomeIcon className="w-5 h-5 text-muted-foreground" icon={faVolumeHigh} />
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
      <footer className="sticky bottom-0 z-10 flex items-center gap-2 px-4 py-3 border-t bg-background">
        <Textarea
          placeholder="Type your message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage();
            }
          }}
        />
        <Button
          variant="ghost"
          size="icon"
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          className="border-none bg-transparent w-10"
        >
          <FontAwesomeIcon icon={faMicrophone} />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={handleSendMessage}>
          <FontAwesomeIcon icon={faPaperPlane} className="w-5 h-5 text-muted-foreground" />
        </Button>
      </footer>
    </div>
  );
};

export default Dashboard;
