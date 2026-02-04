import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Mic, Square, Sparkles, Save, CheckCircle, X, Loader2, FileText } from 'lucide-react';
import { apiGet, apiPatch, apiPost } from '@/lib/api';
import { Appointment, useUser } from '@/contexts/UserContext';

interface AIScribeModalProps {
  appointment?: Appointment;
  onClose: () => void;
}

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve(result);
    };
    reader.onerror = () => reject(new Error('Failed to read audio file'));
    reader.readAsDataURL(blob);
  });

const AIScribeModal: React.FC<AIScribeModalProps> = ({ appointment, onClose }) => {
  const { currentUser } = useUser();
  const [consent, setConsent] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [draftNote, setDraftNote] = useState('');
  const [status, setStatus] = useState<'draft' | 'final'>('draft');
  const [scribeId, setScribeId] = useState<string | null>(null);
  const [icdSuggestions, setIcdSuggestions] = useState<Array<{ code: string; description?: string }>>([]);
  const [cptSuggestions, setCptSuggestions] = useState<Array<{ code: string; description?: string }>>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!appointment?.id) {
      setIsLoading(false);
      return () => {
        mounted = false;
        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
          recorderRef.current.stop();
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
      };
    }
    const loadExisting = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiGet(`/scribe?appointmentId=${appointment?.id}`);
        if (!mounted) return;
        if (data?.id) {
          setScribeId(data.id);
          setTranscript(data.transcript || '');
          setDraftNote(data.final_note || data.draft_note || '');
          setStatus(data.status === 'final' ? 'final' : 'draft');
          setIcdSuggestions(Array.isArray(data.icd_codes) ? data.icd_codes : []);
          setCptSuggestions(Array.isArray(data.cpt_codes) ? data.cpt_codes : []);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Unable to load scribe note.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    loadExisting();
    return () => {
      mounted = false;
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [appointment?.id, audioUrl]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
      };
      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err: any) {
      setError(err.message || 'Microphone access is required to record.');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  };

  const handleTranscribe = async () => {
    if (!audioBlob) return;
    setIsTranscribing(true);
    setError(null);
    try {
      const dataUrl = await blobToBase64(audioBlob);
      const base64 = dataUrl.split(',')[1] || '';
      const response = await apiPost('/scribe/transcribe', {
        audioBase64: base64,
        mimeType: audioBlob.type,
        appointmentId: appointment?.id
      });
      setTranscript(response.transcript || '');
    } catch (err: any) {
      setError(err.message || 'Unable to transcribe audio.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSummarize = async () => {
    if (!transcript.trim()) {
      setError('Add a transcript to generate a draft note.');
      return;
    }
    setIsSummarizing(true);
    setError(null);
    try {
      const response = await apiPost('/scribe/summarize', {
        transcript,
        appointmentId: appointment?.id,
        patientId: appointment?.patientId,
        providerId: appointment?.providerId || currentUser?.id
      });
      if (response?.scribe?.id) {
        setScribeId(response.scribe.id);
      }
      setDraftNote(response.draftNote || '');
      setIcdSuggestions(Array.isArray(response.icdSuggestions) ? response.icdSuggestions : []);
      setCptSuggestions(Array.isArray(response.cptSuggestions) ? response.cptSuggestions : []);
      setStatus('draft');
    } catch (err: any) {
      setError(err.message || 'Unable to generate AI note.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!scribeId) return;
    setIsSaving(true);
    setError(null);
    try {
      const response = await apiPatch(`/scribe/${scribeId}`, {
        draftNote
      });
      if (response?.scribe?.id) {
        setStatus(response.scribe.status === 'final' ? 'final' : 'draft');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to save draft.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!scribeId) return;
    setIsFinalizing(true);
    setError(null);
    try {
      const response = await apiPatch(`/scribe/${scribeId}`, {
        finalNote: draftNote,
        status: 'final',
        finalizedBy: currentUser?.id
      });
      if (response?.scribe?.id) {
        setStatus('final');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to finalize note.');
    } finally {
      setIsFinalizing(false);
    }
  };

  const patientName = appointment?.patient
    ? `${appointment.patient?.first_name || 'Patient'} ${appointment.patient?.last_name || ''}`.trim()
    : 'General Session';

  const exportDraftToPdf = () => {
    const dateLabel = appointment?.scheduledDate || 'Visit';
    const html = `
      <html>
        <head>
          <title>AI Scribe Note</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
            h1 { margin-bottom: 4px; }
            h2 { margin-top: 0; color: #334155; font-weight: 500; }
            pre { white-space: pre-wrap; font-family: inherit; font-size: 14px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <h1>AI Scribe Note</h1>
          <h2>${patientName} • ${dateLabel}</h2>
          <pre>${draftNote || ''}</pre>
        </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm">
      <div className="h-[100dvh] w-full">
        <div className="h-full w-full bg-slate-900/95 shadow-2xl lg:mx-auto lg:my-6 lg:max-w-6xl lg:rounded-3xl lg:border lg:border-slate-700/60 flex flex-col">
          <div className="border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 px-6 py-5 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold text-white">AI Scribe Workspace</h2>
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                    status === 'final'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {status === 'final' ? 'Finalized' : 'Draft'}
                  </span>
                </div>
                <p className="text-slate-400 text-sm mt-1">
                  {appointment?.scheduledDate
                    ? `${patientName} • ${appointment?.scheduledDate} • ${appointment?.scheduledTime || ''}`.trim()
                    : patientName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-xl border border-slate-700/50 bg-slate-900/70 p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-5 sm:p-6 lg:p-8 space-y-6 flex-1 min-h-0 overflow-y-auto">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading scribe note...
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-700/60 bg-slate-800/40 px-4 py-3">
                  <label className="flex items-center gap-3 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      className="rounded border-slate-600 bg-slate-800 text-cyan-400"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      disabled={status === 'final'}
                    />
                    Patient consent confirmed
                  </label>
                  <span className="text-xs text-slate-400">
                    Recording and AI summaries require documented consent.
                  </span>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] min-h-0">
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-5 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-white font-semibold">Step 1 • Record Audio</h3>
                          <p className="text-xs text-slate-400 mt-1">Capture the visit conversation for transcription.</p>
                        </div>
                        {status === 'final' && (
                          <span className="text-xs text-emerald-300 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Finalized
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {!isRecording ? (
                          <button
                            onClick={startRecording}
                            disabled={!consent || status === 'final'}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-100 hover:from-cyan-500/40 hover:to-blue-500/40 transition flex items-center gap-2 disabled:opacity-50"
                          >
                            <Mic className="w-4 h-4" />
                            Start recording
                          </button>
                        ) : (
                          <button
                            onClick={stopRecording}
                            className="px-5 py-2.5 rounded-xl bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 transition flex items-center gap-2"
                          >
                            <Square className="w-4 h-4" />
                            Stop recording
                          </button>
                        )}
                        <button
                          onClick={handleTranscribe}
                          disabled={!audioBlob || isTranscribing || status === 'final'}
                          className="px-5 py-2.5 rounded-xl bg-slate-700/60 text-slate-100 hover:bg-slate-700 transition flex items-center gap-2 disabled:opacity-50"
                        >
                          {isTranscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                          Transcribe audio
                        </button>
                      </div>

                      {audioUrl && (
                        <audio controls className="w-full">
                          <source src={audioUrl} />
                        </audio>
                      )}
                    </div>

                    <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-5 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-white font-semibold">Step 2 • Transcript</h3>
                          <p className="text-xs text-slate-400 mt-1">Edit or paste the transcript before summarizing.</p>
                        </div>
                        <button
                          onClick={handleSummarize}
                          disabled={isSummarizing || status === 'final'}
                          className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-100 hover:bg-purple-500/30 transition flex items-center gap-2 disabled:opacity-50"
                        >
                          {isSummarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          Generate AI note
                        </button>
                      </div>
                      <textarea
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        placeholder="Paste or edit the transcript here."
                        rows={9}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                        disabled={status === 'final'}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-white font-semibold">Step 3 • AI Draft Note</h3>
                        <p className="text-xs text-slate-400 mt-1">Review and finalize the AI summary.</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={exportDraftToPdf}
                          disabled={!draftNote}
                          className="px-4 py-2 rounded-lg bg-slate-700/40 text-slate-200 hover:bg-slate-700 transition flex items-center gap-2 disabled:opacity-50"
                        >
                          <FileText className="w-4 h-4" />
                          Export PDF
                        </button>
                        <button
                          onClick={handleSaveDraft}
                          disabled={!scribeId || isSaving || status === 'final'}
                          className="px-4 py-2 rounded-lg bg-slate-700/60 text-slate-100 hover:bg-slate-700 transition flex items-center gap-2 disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Save draft
                        </button>
                        <button
                          onClick={handleFinalize}
                          disabled={!scribeId || isFinalizing || status === 'final'}
                          className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30 transition flex items-center gap-2 disabled:opacity-50"
                        >
                          {isFinalizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          Finalize
                        </button>
                      </div>
                    </div>
                      <textarea
                        value={draftNote}
                        onChange={(e) => setDraftNote(e.target.value)}
                        placeholder="AI-generated note will appear here."
                        rows={12}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        disabled={status === 'final'}
                      />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-4">
                        <p className="text-xs font-semibold text-slate-400 mb-3">ICD Suggestions</p>
                        {icdSuggestions.length ? (
                          <div className="flex flex-wrap gap-2">
                            {icdSuggestions.map((item, index) => (
                              <span
                                key={`${item.code}-${index}`}
                                className="rounded-full bg-slate-800/80 px-3 py-1 text-xs text-slate-200"
                              >
                                {item.code}{item.description ? ` · ${item.description}` : ''}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">No ICD suggestions yet.</p>
                        )}
                      </div>
                      <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-4">
                        <p className="text-xs font-semibold text-slate-400 mb-3">CPT Suggestions</p>
                        {cptSuggestions.length ? (
                          <div className="flex flex-wrap gap-2">
                            {cptSuggestions.map((item, index) => (
                              <span
                                key={`${item.code}-${index}`}
                                className="rounded-full bg-slate-800/80 px-3 py-1 text-xs text-slate-200"
                              >
                                {item.code}{item.description ? ` · ${item.description}` : ''}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">No CPT suggestions yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
};

export default AIScribeModal;
