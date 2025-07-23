/** biome-ignore-all lint/suspicious/noConsole: temporary */

import { ArrowLeft } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useRoom } from '@/http/use-room';

type RoomParams = {
  roomId: string;
};

const isRecordingSupported =
  !!navigator.mediaDevices &&
  typeof navigator.mediaDevices.getUserMedia === 'function' &&
  typeof window.MediaRecorder === 'function';

export function RecordRoomAudio() {
  const params = useParams<RoomParams>();

  const { data, isLoading } = useRoom(params.roomId);
  console.log(data);
  const [isRecording, setIsRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>(null);

  if (!params.roomId) {
    return <Navigate to="/" />;
  }

  async function uploadAudio(audio: Blob) {
    const formData = new FormData();
    formData.append('file', audio, 'audio.webm');

    const response = await fetch(
      `http://localhost:3333/rooms/${params.roomId}/audio`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const result = await response.json();

    console.log('Áudio enviado com sucesso:', result);
  }

  function createRecorder(audio: MediaStream) {
    recorder.current = new MediaRecorder(audio, {
      mimeType: 'audio/webm',
      audioBitsPerSecond: 64_000,
    });

    recorder.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        uploadAudio(event.data);
      }
    };

    recorder.current.onstart = () => {
      console.log('Gravação iniciada');
    };

    recorder.current.onstop = () => {
      console.log('Gravação finalizada');
    };

    recorder.current.start();
  }

  function stopRecording() {
    setIsRecording(false);

    if (recorder.current && recorder.current.state !== 'inactive') {
      recorder.current.stop();
      console.log('Gravação pausada');
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }

  async function startRecording() {
    if (!isRecordingSupported) {
      alert('O seu navegador não suporta gravação de áudio.');
      return;
    }

    setIsRecording(true);

    const audio = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44_100,
      },
    });

    createRecorder(audio);

    intervalRef.current = setInterval(() => {
      recorder.current?.stop();
      createRecorder(audio);
    }, 10_000);
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <Link to={`/room/${params.roomId}`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 size-4" />
                Voltar para as questões da sala
              </Button>
            </Link>
          </div>
          {isLoading ? (
            <p>Carregando</p>
          ) : (
            <>
              <h1 className="mb-2 font-bold text-3xl text-foreground">
                Gravação de áudio da sala{' '}
                <span className="text-gray-400">{data?.[0].name}</span>
              </h1>
              <p className="text-muted-foreground">
                Grave o áudio que será transcrito e utilizado para repostas de
                perguntas a serem geradas pela A.I.
              </p>
              <div className="mt-5 flex flex-col justify-center gap-3">
                {isRecording ? (
                  <Button onClick={stopRecording}>Pausar gravação</Button>
                ) : (
                  <Button onClick={startRecording}>Iniciar gravação</Button>
                )}

                {isRecording ? <p>Gravando...</p> : <p>Pausado...</p>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
