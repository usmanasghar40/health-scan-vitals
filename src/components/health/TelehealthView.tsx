import React, { useState, useEffect, useRef } from 'react';
import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import { useUser, type Appointment } from '@/contexts/UserContext';
import { apiPost } from '@/lib/api';
import {
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Monitor, MonitorOff,
  MessageSquare, Users, Settings, MoreVertical, Maximize2, Minimize2,
  Grid, User, Volume2, VolumeX, Hand, Smile, ChevronUp, ChevronDown,
  Copy, Check, Shield, Clock, Circle, Square, Camera, Sparkles,
  X, Send, AlertCircle, Wifi, WifiOff, RefreshCw, Layout, PictureInPicture,
  Pause, Play, Disc, StopCircle, Share2, Link, Calendar, Info, ArrowLeft
} from 'lucide-react';


interface Participant {
  id: string;
  name: string;
  initials: string;
  isMuted: boolean;
  isVideoOn: boolean;
  isHost: boolean;
  isSpeaking: boolean;
  isScreenSharing: boolean;
  role: 'provider' | 'patient' | 'guest';
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  isPrivate: boolean;
}

type CallState = 'lobby' | 'connecting' | 'in-call' | 'ended';
type ViewMode = 'speaker' | 'gallery' | 'sidebar';

type TelehealthViewProps = {
  onNavigate?: (tab: string) => void;
};

const TelehealthView: React.FC<TelehealthViewProps> = ({ onNavigate }) => {
  const { currentUser, userRole, getAppointments } = useUser();
  
  // Call state
  const [callState, setCallState] = useState<CallState>('lobby');
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('speaker');
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRecordings, setShowRecordings] = useState(false);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);
  const [currentRecordingId, setCurrentRecordingId] = useState<string | null>(null);
  const [isRecordingBusy, setIsRecordingBusy] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [remoteHandRaised, setRemoteHandRaised] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>('');
  const [meetingId, setMeetingId] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingToken, setMeetingToken] = useState('');
  const [currentRoomName, setCurrentRoomName] = useState('');
  const [isLoadingRoom, setIsLoadingRoom] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [connectionStep, setConnectionStep] = useState('');
  const [joinWithCredentials, setJoinWithCredentials] = useState(false);
  const [joinRoomUrl, setJoinRoomUrl] = useState('');
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [pendingJoin, setPendingJoin] = useState<{ roomUrl: string; token: string } | null>(null);
  const [localHasVideo, setLocalHasVideo] = useState(false);
  const [remoteHasVideo, setRemoteHasVideo] = useState(false);
  const isMutedRef = useRef(isMuted);
  const isVideoOnRef = useRef(isVideoOn);
  const callObjectRef = useRef<DailyCall | null>(null);
  const callFrameRef = useRef<DailyCall | null>(null);
  const callContainerRef = useRef<HTMLDivElement | null>(null);
  const useEmbeddedCall = false;
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoElRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoElRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioElRef = useRef<HTMLAudioElement | null>(null);
  const remoteAudioStreamRef = useRef<MediaStream | null>(null);
  
  // Timer
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [copiedMeetingId, setCopiedMeetingId] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Participants
  const [participants, setParticipants] = useState<Participant[]>(() => {
    const fullName = currentUser
      ? `${currentUser.firstName} ${currentUser.lastName}`.trim()
      : 'You';
    const initials = currentUser
      ? `${currentUser.firstName?.[0] || ''}${currentUser.lastName?.[0] || ''}`.toUpperCase()
      : 'You';
    return [
      {
        id: 'local',
        name: fullName,
        initials,
        isMuted: false,
        isVideoOn: true,
        isHost: true,
        isSpeaking: false,
        isScreenSharing: false,
        role: userRole === 'provider' ? 'provider' : 'patient'
      }
    ];
  });
  
  // Waiting room
  const [waitingRoom, setWaitingRoom] = useState<Participant[]>([]);

  // Settings
  const [selectedCamera, setSelectedCamera] = useState('default');
  const [selectedMic, setSelectedMic] = useState('default');
  const [selectedSpeaker, setSelectedSpeaker] = useState('default');
  const [virtualBackground, setVirtualBackground] = useState<'none' | 'blur' | 'office' | 'nature'>('none');

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean);
    const first = parts[0]?.[0] || '';
    const last = parts[1]?.[0] || '';
    return `${first}${last}`.toUpperCase() || 'U';
  };

  const areParticipantsEqual = (a: Participant[], b: Participant[]) => {
    if (a.length !== b.length) return false;
    return a.every((p, idx) => {
      const other = b[idx];
      return (
        p.id === other.id &&
        p.isMuted === other.isMuted &&
        p.isVideoOn === other.isVideoOn &&
        p.isSpeaking === other.isSpeaking &&
        p.isScreenSharing === other.isScreenSharing &&
        p.name === other.name &&
        p.role === other.role
      );
    });
  };

  // Timer effect
  useEffect(() => {
    if (callState === 'in-call') {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  useEffect(() => {
    if (!currentUser) return;
    let isMounted = true;

    const loadAppointments = async () => {
      const allAppointments = await getAppointments();
      const telehealthAppointments = allAppointments.filter((apt) => apt.isTelehealth);
      if (!isMounted) return;
      setAppointments(telehealthAppointments);
      if (userRole === 'provider') {
        setSelectedAppointmentId('instant');
      } else if (telehealthAppointments.length > 0) {
        setSelectedAppointmentId(telehealthAppointments[0].id);
      }
    };

    loadAppointments();
    return () => {
      isMounted = false;
    };
  }, [currentUser, getAppointments]);

  useEffect(() => {
    if (!currentUser || callObjectRef.current) return;
    const fullName = `${currentUser.firstName} ${currentUser.lastName}`.trim();
    setParticipants([
      {
        id: 'local',
        name: fullName || 'You',
        initials: getInitials(fullName || 'You'),
        isMuted,
        isVideoOn,
        isHost: true,
        isSpeaking: false,
        isScreenSharing: false,
        role: userRole === 'provider' ? 'provider' : 'patient'
      }
    ]);
  }, [currentUser, userRole, isMuted, isVideoOn]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (callState === 'in-call') {
      root.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
      root.style.height = '100%';
      body.style.height = '100%';
    }
    return () => {
      root.style.overflow = '';
      body.style.overflow = '';
      root.style.height = '';
      body.style.height = '';
    };
  }, [callState]);

  useEffect(() => {
    if (callState !== 'in-call' || !callObjectRef.current) return;
    callObjectRef.current.setLocalAudio(!isMuted);
    callObjectRef.current.setLocalVideo(isVideoOn);
  }, [callState, isMuted, isVideoOn]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isVideoOnRef.current = isVideoOn;
  }, [isVideoOn]);

  useEffect(() => {
    if (callState !== 'connecting') return;
    if (!connectionStep) {
      setConnectionStep('Starting connection...');
    }
    const timeoutId = setTimeout(() => {
      setCallError('Connection is taking too long. Please try again.');
      setCallState('lobby');
      setIsLoadingRoom(false);
    }, 35000);
    return () => clearTimeout(timeoutId);
  }, [callState, connectionStep]);

  useEffect(() => {
    if (!localStreamRef.current) {
      localStreamRef.current = new MediaStream();
    }
    if (!remoteStreamRef.current) {
      remoteStreamRef.current = new MediaStream();
    }
    if (!remoteAudioStreamRef.current) {
      remoteAudioStreamRef.current = new MediaStream();
    }
  }, []);

  useEffect(() => {
    if (localVideoElRef.current && localStreamRef.current) {
      if (localVideoElRef.current.srcObject !== localStreamRef.current) {
        localVideoElRef.current.srcObject = localStreamRef.current;
      }
    }
    if (remoteVideoElRef.current && remoteStreamRef.current) {
      if (remoteVideoElRef.current.srcObject !== remoteStreamRef.current) {
        remoteVideoElRef.current.srcObject = remoteStreamRef.current;
      }
    }
  }, [localHasVideo, remoteHasVideo, callState, viewMode]);

  useEffect(() => {
    if (callState !== 'in-call') return;
    const raf = requestAnimationFrame(() => {
      if (localVideoElRef.current && localStreamRef.current) {
        localVideoElRef.current.srcObject = localStreamRef.current;
      }
      if (remoteVideoElRef.current && remoteStreamRef.current) {
        remoteVideoElRef.current.srcObject = remoteStreamRef.current;
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [viewMode, callState]);

  const getParticipantVideoTrack = (participant: any) => {
    const screenTrack =
      participant?.tracks?.screenVideo?.persistentTrack ||
      participant?.tracks?.screenVideo?.track ||
      null;
    if (screenTrack) return screenTrack;
    return (
      participant?.tracks?.video?.persistentTrack ||
      participant?.tracks?.video?.track ||
      null
    );
  };

  const updateStreamForParticipant = (participant: any) => {
    const track = getParticipantVideoTrack(participant);
    if (!track) return;
    const streamRef = participant.local ? localStreamRef : remoteStreamRef;
    if (!streamRef.current) {
      streamRef.current = new MediaStream();
    }
    const stream = streamRef.current;
    const existing = stream.getVideoTracks();
    if (existing.some((t) => t.id === track.id)) {
      return;
    }
    existing.forEach((t) => stream.removeTrack(t));
    stream.addTrack(track);
    if (participant.local) {
      setLocalHasVideo((prev) => prev || true);
    } else {
      setRemoteHasVideo((prev) => prev || true);
    }
  };

  const updateAudioForParticipant = (participant: any) => {
    if (participant.local) return;
    const track =
      participant?.tracks?.audio?.persistentTrack ||
      participant?.tracks?.audio?.track ||
      null;
    if (!track) return;
    if (!remoteAudioStreamRef.current) {
      remoteAudioStreamRef.current = new MediaStream();
    }
    const stream = remoteAudioStreamRef.current;
    const existing = stream.getAudioTracks();
    if (!existing.some((t) => t.id === track.id)) {
      existing.forEach((t) => stream.removeTrack(t));
      stream.addTrack(track);
    }
    if (remoteAudioElRef.current) {
      remoteAudioElRef.current.srcObject = stream;
      remoteAudioElRef.current.muted = false;
      remoteAudioElRef.current.volume = 1;
      remoteAudioElRef.current.play().catch(() => undefined);
    }
  };

  const refreshVideoTracks = () => {
    const callObject = callObjectRef.current;
    if (!callObject) return;
    const participants = callObject.participants() as Record<string, any>;
    Object.values(participants).forEach((participant: any) => {
      const track = getParticipantVideoTrack(participant);
      if (!track) return;
      const streamRef = participant.local ? localStreamRef : remoteStreamRef;
      if (!streamRef.current) {
        streamRef.current = new MediaStream();
      }
      const stream = streamRef.current;
      const existing = stream.getVideoTracks();
      if (!existing.some((t) => t.id === track.id)) {
        existing.forEach((t) => stream.removeTrack(t));
        stream.addTrack(track);
      }
      if (participant.local) {
        setLocalHasVideo(true);
      } else {
        setRemoteHasVideo(true);
      }
    });
  };

  const refreshAudioTracks = () => {
    const callObject = callObjectRef.current;
    if (!callObject) return;
    const participants = callObject.participants() as Record<string, any>;
    Object.values(participants).forEach((participant: any) => {
      updateAudioForParticipant(participant);
    });
  };

  useEffect(() => {
    if (callState !== 'in-call') return;
    refreshVideoTracks();
    refreshAudioTracks();
  }, [viewMode, callState]);

  useEffect(() => {
    return () => {
      if (callObjectRef.current) {
        callObjectRef.current.destroy();
        callObjectRef.current = null;
      }
      if (callFrameRef.current) {
        callFrameRef.current.destroy();
        callFrameRef.current = null;
      }
    };
  }, []);

  const syncParticipants = (callObject: DailyCall) => {
    const dailyParticipants = callObject.participants() as Record<string, any>;
    const mapped = Object.values(dailyParticipants).map((participant) => {
      const displayName = participant.user_name || 'Participant';
      const initials = getInitials(displayName);
      const isVideoOn = participant.tracks.video?.state === 'playable';
      const isAudioOn = participant.tracks.audio?.state === 'playable';
      return {
        id: participant.session_id || participant.user_id || participant.id,
        name: displayName,
        initials,
        isMuted: !isAudioOn,
        isVideoOn,
        isHost: participant.local,
        isSpeaking: false,
        isScreenSharing: participant.tracks.screenVideo?.state === 'playable',
        role: participant.local ? (userRole === 'provider' ? 'provider' : 'patient') : 'guest'
      } as Participant;
    });
    const sorted = mapped.sort((a, b) => {
      if (a.isHost && !b.isHost) return -1;
      if (!a.isHost && b.isHost) return 1;
      return a.name.localeCompare(b.name);
    });
    if (sorted.length > 0) {
      setParticipants((prev) => (areParticipantsEqual(prev, sorted) ? prev : sorted));
    }
    const remoteParticipants = sorted.filter((p) => !p.isHost);
    const remoteVideoActive = remoteParticipants.some((p) => p.isVideoOn);
    if (remoteParticipants.length === 0) {
      setRemoteHasVideo(false);
      if (remoteStreamRef.current) {
        remoteStreamRef.current.getVideoTracks().forEach((t) =>
          remoteStreamRef.current?.removeTrack(t)
        );
      }
    } else {
      setRemoteHasVideo(remoteVideoActive);
    }
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatAppointmentLabel = (appointment: Appointment) => {
    const date = appointment.scheduledDate;
    const time = appointment.scheduledTime;
    const type = appointment.appointmentType || 'Telehealth visit';
    return `${date} • ${time} • ${type}`;
  };

  const withTimeout = async <T,>(promise: Promise<T>, ms: number, message: string) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(message)), ms);
    });
    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  const joinWithParams = async (roomUrl: string, token?: string) => {
    const normalizedRoomUrl = roomUrl.startsWith('http') ? roomUrl : `https://${roomUrl}`;
    let resolvedToken = token || '';
    let baseRoomUrl = normalizedRoomUrl;
    try {
      const parsed = new URL(normalizedRoomUrl);
      const tokenFromUrl = parsed.searchParams.get('t') || parsed.searchParams.get('token');
      if (tokenFromUrl) {
        resolvedToken = resolvedToken || tokenFromUrl;
        parsed.search = '';
        baseRoomUrl = parsed.toString();
      }
    } catch {
      // ignore invalid URL
    }
    if (resolvedToken) {
      setConnectionStep('Validating token...');
      await withTimeout(
        apiPost('/telehealth/validate', { token: resolvedToken }),
        8000,
        'Token validation timed out. Please try again.'
      );
    }
    const derivedRoomName = getRoomNameFromUrl(baseRoomUrl);
    if (derivedRoomName) {
      setCurrentRoomName(derivedRoomName);
    }
    if (callObjectRef.current) {
      callObjectRef.current.destroy();
      callObjectRef.current = null;
    }
    if (callFrameRef.current) {
      callFrameRef.current.destroy();
      callFrameRef.current = null;
    }
    if (useEmbeddedCall) {
      setConnectionStep('Preparing call frame...');
      const start = Date.now();
      while (!callContainerRef.current && Date.now() - start < 2000) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      if (!callContainerRef.current) {
        throw new Error('Call container is not ready.');
      }
      const frame = DailyIframe.createFrame(callContainerRef.current, {
        showLeaveButton: true,
        iframeStyle: {
          position: 'absolute',
          width: '100%',
          height: '100%',
          border: '0',
          borderRadius: '16px',
        },
      });
      callFrameRef.current = frame;
      frame.on('left-meeting', () => {
        setCallState('ended');
        resetParticipants();
      });
      setConnectionStep('Joining meeting...');
      await withTimeout(
        frame.join({ url: baseRoomUrl, ...(resolvedToken ? { token: resolvedToken } : {}) }),
        30000,
        'Connection timed out. Please try again.'
      );
      return;
    }
    const callObject = DailyIframe.createCallObject();
    callObjectRef.current = callObject;

    callObject.on('error', (event: any) => {
      const message =
        event?.errorMsg || event?.error?.message || event?.message || 'Daily connection error.';
      setCallError(message);
      setCallState('lobby');
    });
    callObject.on('joined-meeting', () => {
      setCallState('in-call');
      setCallError(null);
      callObject.setLocalAudio(!isMutedRef.current);
      callObject.setLocalVideo(isVideoOnRef.current);
      refreshVideoTracks();
      refreshAudioTracks();
      setTimeout(() => {
        callObject.setLocalAudio(!isMutedRef.current);
        callObject.setLocalVideo(isVideoOnRef.current);
      }, 500);
    });
    callObject.on('joining-meeting', () => {
      setConnectionStep('Joining meeting...');
    });
    callObject.on('camera-error', () => {
      setConnectionStep('Camera permission required.');
    });
    callObject.on('app-message', (event: any) => {
      const data = event?.data;
      if (!data?.type) return;
      if (data.type === 'chat' && data.content) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            senderId: data.senderId || event?.fromId || 'participant',
            senderName: data.senderName || 'Participant',
            content: data.content,
            timestamp: new Date(),
            isPrivate: false,
          },
        ]);
      }
      if (data.type === 'hand') {
        setRemoteHandRaised(Boolean(data.raised));
      }
    });

    callObject.on('participant-joined', () => {
      syncParticipants(callObject);
      refreshVideoTracks();
      callObject.setLocalAudio(!isMutedRef.current);
      callObject.setLocalVideo(isVideoOnRef.current);
    });
    callObject.on('participant-left', () => syncParticipants(callObject));
    callObject.on('participant-updated', (event: any) => {
      if (event?.participant) {
        updateAudioForParticipant(event.participant);
        refreshVideoTracks();
      }
    });
    callObject.on('track-started', (event: any) => {
      if (event.track.kind === 'video') {
        updateStreamForParticipant(event.participant);
        refreshVideoTracks();
        syncParticipants(callObject);
      }
      if (event.track.kind === 'audio') {
        updateAudioForParticipant(event.participant);
        refreshAudioTracks();
      }
    });
    callObject.on('track-stopped', (event: any) => {
      if (event.track.kind === 'video') {
        const participant = event.participant;
        const streamRef = participant?.local ? localStreamRef : remoteStreamRef;
        if (streamRef?.current) {
          streamRef.current.getVideoTracks().forEach((t) => {
            if (t.id === event.track.id) {
              streamRef.current?.removeTrack(t);
            }
          });
        }
        if (participant?.local) {
          setLocalHasVideo(false);
        } else {
          setRemoteHasVideo(false);
        }
        syncParticipants(callObject);
      }
      if (event.track.kind === 'audio') {
        const participant = event.participant;
        // Only remove remote audio tracks when a remote participant stops audio
        if (!participant?.local && remoteAudioStreamRef.current) {
          remoteAudioStreamRef.current.getAudioTracks().forEach((t) => {
            if (t.id === event.track.id) {
              remoteAudioStreamRef.current?.removeTrack(t);
            }
          });
        }
      }
    });
    callObject.on('left-meeting', () => {
      setCallState('ended');
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((t) => localStreamRef.current?.removeTrack(t));
        }
        if (remoteStreamRef.current) {
          remoteStreamRef.current.getTracks().forEach((t) => remoteStreamRef.current?.removeTrack(t));
        }
        if (remoteAudioStreamRef.current) {
          remoteAudioStreamRef.current.getTracks().forEach((t) =>
            remoteAudioStreamRef.current?.removeTrack(t)
          );
        }
        setLocalHasVideo(false);
        setRemoteHasVideo(false);
      resetParticipants();
    });

    setConnectionStep('Starting camera...');
    try {
      await withTimeout(callObject.startCamera(), 8000, 'Camera start timed out.');
      // Ensure local tracks align with current toggles right after camera starts
      callObject.setLocalAudio(!isMutedRef.current);
      callObject.setLocalVideo(isVideoOnRef.current);
    } catch (error: any) {
      setCallError(error?.message || 'Unable to start camera. Check permissions.');
      setCallState('lobby');
      throw error;
    }
    // Use refs to avoid stale state during join
    const displayName = currentUser
      ? `${currentUser.firstName} ${currentUser.lastName}`.trim()
      : 'Guest';
    const joinPromise = callObject.join({
      url: baseRoomUrl,
      ...(resolvedToken ? { token: resolvedToken } : {}),
      userName: displayName,
      startAudioOff: isMutedRef.current,
      startVideoOff: !isVideoOnRef.current,
    });
    try {
      setConnectionStep('Joining meeting...');
      await withTimeout(joinPromise, 30000, 'Connection timed out. Please try again.');
    } catch (error) {
      await callObject.leave().catch(() => undefined);
      callObject.destroy();
      throw error;
    }
    callObject.setLocalAudio(!isMutedRef.current);
    callObject.setLocalVideo(isVideoOnRef.current);
    syncParticipants(callObject);
    refreshAudioTracks();
    refreshVideoTracks();
    setTimeout(() => {
      callObject.setLocalAudio(!isMutedRef.current);
      callObject.setLocalVideo(isVideoOnRef.current);
    }, 500);
  };

  const handleJoinCall = async () => {
    if (!currentUser) {
      setCallError('Please sign in before joining a call.');
      return;
    }
    if (!selectedAppointmentId) {
      setCallError('Select a telehealth appointment to start the call.');
      return;
    }

    setCallError(null);
    setIsMuted(false);
    setIsVideoOn(true);
    isMutedRef.current = false;
    isVideoOnRef.current = true;
    setIsLoadingRoom(true);
    setCallState('connecting');

    try {
      const isInstantMeeting = selectedAppointmentId === 'instant';
      const tokenResponse = isInstantMeeting
        ? await apiPost('/telehealth/instant', { userId: currentUser.id })
        : await apiPost('/telehealth/token', {
            appointmentId: selectedAppointmentId,
            userId: currentUser.id
          });

      const roomUrl = tokenResponse?.roomUrl;
      const token = tokenResponse?.token;
      const roomName = tokenResponse?.roomName || '';
      if (!roomUrl || !token) {
        throw new Error('Unable to create a telehealth session.');
      }

      setMeetingId(roomName);
      setMeetingLink(roomUrl);
      setMeetingToken(token);
      if (userRole === 'provider') {
        setShowCredentialsModal(true);
      }

      if (userRole === 'provider') {
        setPendingJoin({ roomUrl, token });
        setCallState('lobby');
        setShowCredentialsModal(true);
      } else {
        if (useEmbeddedCall) {
          setCallState('in-call');
        }
        await joinWithParams(roomUrl, token);
        setCallState('in-call');
      }
    } catch (error: any) {
      setCallState('lobby');
      setCallError(error?.message || 'Failed to join the call.');
    } finally {
      setIsLoadingRoom(false);
    }
  };

  const handleJoinWithCredentials = async () => {
    if (!currentUser) {
      setCallError('Please sign in before joining a call.');
      return;
    }
    if (!joinRoomUrl) {
      setCallError('Enter an invite link to join.');
      return;
    }
    setCallError(null);
    setIsMuted(false);
    setIsVideoOn(true);
    isMutedRef.current = false;
    isVideoOnRef.current = true;
    setIsLoadingRoom(true);
    setCallState('connecting');

    try {
      if (useEmbeddedCall) {
        setCallState('in-call');
      }
      await joinWithParams(joinRoomUrl);
      setCallState('in-call');
    } catch (error: any) {
      setCallState('lobby');
      setCallError(error?.message || 'Failed to join with credentials.');
    } finally {
      setIsLoadingRoom(false);
    }
  };

  const handleEndCall = async () => {
    if (callFrameRef.current) {
      await callFrameRef.current.leave().catch(() => undefined);
      callFrameRef.current.destroy();
      callFrameRef.current = null;
    }
    if (callObjectRef.current) {
      await callObjectRef.current.leave().catch(() => undefined);
      callObjectRef.current.destroy();
      callObjectRef.current = null;
    }
    setLocalHasVideo(false);
    setRemoteHasVideo(false);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => localStreamRef.current?.removeTrack(t));
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((t) => remoteStreamRef.current?.removeTrack(t));
    }
    if (remoteAudioStreamRef.current) {
      remoteAudioStreamRef.current.getTracks().forEach((t) =>
        remoteAudioStreamRef.current?.removeTrack(t)
      );
    }
    resetParticipants();
    setCallState('ended');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const toggleScreenShare = async () => {
    if (!callObjectRef.current) return;
    if (!isScreenSharing && isOtherParticipantSharing) {
      setCallError('Screen sharing is already active. Ask the other participant to stop sharing.');
      return;
    }
    try {
      if (isScreenSharing) {
        await callObjectRef.current.stopScreenShare();
        setIsScreenSharing(false);
        setParticipants((prev) =>
          prev.map((p) => (p.isHost ? { ...p, isScreenSharing: false } : p))
        );
        setCallError(null);
        syncParticipants(callObjectRef.current);
      } else {
        await callObjectRef.current.startScreenShare();
        setIsScreenSharing(true);
        setParticipants((prev) =>
          prev.map((p) => (p.isHost ? { ...p, isScreenSharing: true } : p))
        );
        setCallError(null);
        syncParticipants(callObjectRef.current);
      }
    } catch (error) {
      setCallError('Unable to toggle screen sharing.');
    }
  };

  const toggleHandRaise = () => {
    const next = !handRaised;
    setHandRaised(next);
    if (callObjectRef.current?.sendAppMessage) {
      callObjectRef.current.sendAppMessage(
        { type: 'hand', raised: next },
        '*'
      );
    }
  };

  const toggleRecording = async () => {
    if (!callObjectRef.current || userRole !== 'provider') return;
    if (!currentUser?.id) {
      setCallError('Please sign in before starting a recording.');
      return;
    }
    const resolvedRoomName =
      meetingId ||
      currentRoomName ||
      getRoomNameFromUrl(meetingLink) ||
      getRoomNameFromUrl(joinRoomUrl);
    if (!resolvedRoomName) {
      setCallError('Recording requires an active room name.');
      return;
    }
    try {
      setIsRecordingBusy(true);
      if (isRecording) {
        if (currentRecordingId) {
          await withTimeout(
            apiPost('/telehealth/recording/stop', {
              recordingId: currentRecordingId,
              roomName: resolvedRoomName,
              userId: currentUser.id,
            }),
            12000,
            'Stopping recording is taking too long. Try again.'
          );
        }
        setIsRecording(false);
        setCurrentRecordingId(null);
        loadRecordings();
      } else {
        const response = await withTimeout(
          apiPost('/telehealth/recording/start', {
            roomName: resolvedRoomName,
            userId: currentUser.id,
          }),
          12000,
          'Starting recording is taking too long. Try again.'
        );
        const recordingId = response?.recordingId || response?.id || null;
        setCurrentRecordingId(recordingId);
        setIsRecording(true);
        loadRecordings();
      }
    } catch (error) {
      setCallError(error?.message || 'Unable to toggle recording.');
    } finally {
      setIsRecordingBusy(false);
    }
  };

  const loadRecordings = async () => {
    if (!currentUser?.id || userRole !== 'provider') return;
    setIsLoadingRecordings(true);
    try {
      const response = await apiPost('/telehealth/recordings/list', {
        userId: currentUser.id,
      });
      setRecordings(response?.recordings || []);
    } catch (error) {
      setCallError('Unable to load recordings.');
    } finally {
      setIsLoadingRecordings(false);
    }
  };

  const resetParticipants = () => {
    const fullName = currentUser
      ? `${currentUser.firstName} ${currentUser.lastName}`.trim()
      : 'You';
    setParticipants([
      {
        id: 'local',
        name: fullName || 'You',
        initials: getInitials(fullName || 'You'),
        isMuted,
        isVideoOn,
        isHost: true,
        isSpeaking: false,
        isScreenSharing: false,
        role: userRole === 'provider' ? 'provider' : 'patient'
      }
    ]);
  };

  const hasRemoteParticipant = participants.some((p) => !p.isHost);
  const hasMultipleParticipants = participants.length > 1;
  const isSomeoneSharing = participants.some((p) => p.isScreenSharing);
  const isOtherParticipantSharing = participants.some(
    (p) => p.isScreenSharing && !p.isHost
  );
  const isMobileDevice =
    typeof navigator !== 'undefined' &&
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    if (userRole === 'provider') {
      setSelectedAppointmentId('instant');
    }
  }, [userRole]);

  useEffect(() => {
    if (!hasMultipleParticipants && viewMode !== 'speaker') {
      setViewMode('speaker');
    }
  }, [hasMultipleParticipants, viewMode]);

  useEffect(() => {
    if (showRecordings) {
      loadRecordings();
    }
  }, [showRecordings]);


  useEffect(() => {
    if (callState === 'ended' && userRole === 'provider') {
      setShowRecordings(true);
      loadRecordings();
    }
  }, [callState, userRole]);

  useEffect(() => {
    if (callState === 'lobby' && userRole === 'provider') {
      loadRecordings();
    }
  }, [callState, userRole]);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (callObjectRef.current) {
      callObjectRef.current.setLocalAudio(!nextMuted);
    }
  };

  const toggleVideo = () => {
    const nextVideo = !isVideoOn;
    setIsVideoOn(nextVideo);
    if (callObjectRef.current) {
      callObjectRef.current.setLocalVideo(nextVideo);
      if (nextVideo) {
        setTimeout(() => refreshVideoTracks(), 0);
      }
    }
  };

  const handleAdmitParticipant = (participantId: string) => {
    const participant = waitingRoom.find(p => p.id === participantId);
    if (participant) {
      setParticipants(prev => [...prev, { ...participant, id: `participant-${Date.now()}` }]);
      setWaitingRoom(prev => prev.filter(p => p.id !== participantId));
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const localName = currentUser
      ? `${currentUser.firstName} ${currentUser.lastName}`.trim()
      : 'You';
    const localSenderId = currentUser?.id || 'local';
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: localSenderId,
      senderName: localName,
      content: newMessage,
      timestamp: new Date(),
      isPrivate: false
    };
    setChatMessages(prev => [...prev, message]);
    if (callObjectRef.current?.sendAppMessage) {
      callObjectRef.current.sendAppMessage(
        {
          type: 'chat',
          content: newMessage,
          senderId: localSenderId,
          senderName: localName,
        },
        '*'
      );
    }
    setNewMessage('');
  };

  const copyMeetingId = () => {
    const baseLink = meetingLink || pendingJoin?.roomUrl || joinRoomUrl;
    const tokenizedLink = buildTokenizedLink(baseLink || '', meetingToken);
    const value = tokenizedLink || baseLink;
    if (!value) {
      setCallError('Invite link is not available yet.');
      return;
    }
    try {
      navigator.clipboard.writeText(value);
      setCopiedMeetingId(true);
      setToastMessage('Invitation link copied to clipboard');
      setTimeout(() => setCopiedMeetingId(false), 2000);
      setTimeout(() => setToastMessage(null), 2200);
    } catch {
      setCallError('Unable to copy invite link.');
    }
  };

  const copyText = (value: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedMeetingId(true);
    setTimeout(() => setCopiedMeetingId(false), 2000);
  };

  const buildTokenizedLink = (url: string, token: string) => {
    if (!url || !token) return '';
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${encodeURIComponent(token)}`;
  };

  const inviteLink = buildTokenizedLink(meetingLink, meetingToken) || meetingLink;

  const getRoomNameFromUrl = (url: string) => {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split('/').filter(Boolean);
      return parts[0] || '';
    } catch {
      return '';
    }
  };

  // Lobby View (simplified)
  if (callState === 'lobby') {
    return (
      <div className="relative min-h-[100dvh] w-full px-4 sm:px-6 lg:px-8 pt-4 pb-6 lg:py-6 overflow-y-auto lg:overflow-hidden bg-slate-950">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-24 right-10 h-72 w-72 rounded-full bg-blue-500/20 blur-[120px]" />
        {showCredentialsModal && inviteLink && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white text-lg font-semibold">Join Credentials</h3>
                <button
                  onClick={() => setShowCredentialsModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="bg-slate-800/60 rounded-lg p-3">
                  <p className="text-slate-400 text-xs">Invite Link</p>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-white font-mono break-all">{inviteLink}</p>
                    <button
                      onClick={() => copyText(inviteLink)}
                      className="p-2 text-slate-400 hover:text-white"
                    >
                      {copiedMeetingId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCredentialsModal(false)}
                  className="flex-1 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    if (inviteLink) {
                      window.open(inviteLink, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="flex-1 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                >
                  Open in browser
                </button>
                <button
                  onClick={async () => {
                    if (!pendingJoin) return;
                    setShowCredentialsModal(false);
                    setCallState('connecting');
                    setIsLoadingRoom(true);
                    try {
                      if (useEmbeddedCall) {
                        setCallState('in-call');
                      }
                      await joinWithParams(pendingJoin.roomUrl, pendingJoin.token);
                      setCallState('in-call');
                    } catch (error: any) {
                      setCallState('lobby');
                      setCallError(error?.message || 'Failed to join the call.');
                    } finally {
                      setIsLoadingRoom(false);
                    }
                  }}
                  className="flex-1 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
                >
                  Join now
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="relative max-w-5xl mx-auto h-full flex flex-col min-h-0">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onNavigate?.('dashboard')}
              className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800/80 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-emerald-300">
              <Shield className="h-4 w-4" />
              Encrypted session
            </div>
          </div>

          <div className="flex-1 flex items-start lg:items-center">
            <div className="w-full grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 items-center">
              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 sm:p-8 shadow-[0_25px_80px_-50px_rgba(59,130,246,0.6)]">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
                  <Sparkles className="h-4 w-4" />
                  Instant Telehealth
                </div>
                <h1 className="mt-4 text-3xl sm:text-4xl font-semibold text-white">
                  Meet your {userRole === 'provider' ? 'patients' : 'doctor'} in seconds
                </h1>
                <p className="mt-2 text-slate-400 text-sm sm:text-base">
                  Start a secure video visit with one tap. Share the access credentials if others need to join.
                </p>

                <div className="mt-5 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-slate-800 bg-slate-950/60 px-3 py-1 text-slate-300">HD Video</span>
                  <span className="rounded-full border border-slate-800 bg-slate-950/60 px-3 py-1 text-slate-300">End-to-end encrypted</span>
                  <span className="rounded-full border border-slate-800 bg-slate-950/60 px-3 py-1 text-slate-300">Mobile ready</span>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                    <p className="text-slate-400">Step 1</p>
                    <p className="mt-1 text-white">Start meeting</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                    <p className="text-slate-400">Step 2</p>
                    <p className="mt-1 text-white">Share credentials</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                    <p className="text-slate-400">Step 3</p>
                    <p className="mt-1 text-white">Begin consult</p>
                  </div>
                </div>

                {userRole === 'patient' && (
                  <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">Join options</p>
                      <button
                        onClick={() => setJoinWithCredentials(!joinWithCredentials)}
                        className="text-xs text-cyan-300 hover:text-cyan-200"
                      >
                        {joinWithCredentials ? 'Use appointment' : 'Use meeting link'}
                      </button>
                    </div>

                    {joinWithCredentials ? (
                      <div className="mt-3 space-y-3">
                        <div>
                          <label className="text-[11px] text-slate-400">Invite link</label>
                          <input
                            type="text"
                            value={joinRoomUrl}
                            onChange={(e) => setJoinRoomUrl(e.target.value)}
                            placeholder="https://your-subdomain.daily.co/meeting?t=token"
                            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-white placeholder:text-slate-600"
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={handleJoinWithCredentials}
                            disabled={isLoadingRoom}
                            className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
                              isLoadingRoom
                                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                : 'bg-cyan-600 text-white hover:bg-cyan-700'
                            }`}
                          >
                            Join with invite
                          </button>
                          <button
                            onClick={() => {
                              if (joinRoomUrl) {
                                window.open(joinRoomUrl, '_blank', 'noopener,noreferrer');
                              }
                            }}
                            className="flex-1 rounded-lg border border-slate-800 py-2 text-sm text-slate-200 hover:bg-slate-800/60"
                          >
                            Open in browser
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-slate-400">
                        If you have an appointment, tap Join Meeting below. Otherwise use a meeting link.
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleJoinCall}
                    disabled={
                      isLoadingRoom ||
                      (!selectedAppointmentId && userRole !== 'provider') ||
                      (userRole === 'patient' && joinWithCredentials)
                    }
                    className={`flex-1 py-3 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                      isLoadingRoom ||
                      (!selectedAppointmentId && userRole !== 'provider') ||
                      (userRole === 'patient' && joinWithCredentials)
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700'
                    }`}
                  >
                    <Video className="w-5 h-5" />
                    {isLoadingRoom
                      ? 'Starting...'
                      : userRole === 'provider'
                        ? 'Start Meeting'
                        : 'Join Meeting'}
                  </button>
                </div>

                {callError && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
                    <AlertCircle className="h-4 w-4 mt-0.5" />
                    <span>{callError}</span>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Your setup</h2>
                  <span className="text-xs text-slate-400 capitalize">{userRole}</span>
                </div>
                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Camera className="h-4 w-4" />
                      Camera
                    </div>
                    <span className={isVideoOn ? 'text-emerald-400' : 'text-rose-400'}>
                      {isVideoOn ? 'On' : 'Off'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Mic className="h-4 w-4" />
                      Microphone
                    </div>
                    <span className={!isMuted ? 'text-emerald-400' : 'text-rose-400'}>
                      {!isMuted ? 'On' : 'Muted'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Wifi className="h-4 w-4" />
                      Connection
                    </div>
                    <span className={connectionQuality === 'poor' ? 'text-rose-400' : 'text-emerald-400'}>
                      {connectionQuality === 'poor' ? 'Needs attention' : 'Ready'}
                    </span>
                  </div>
                </div>
                <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400">
                  Tip: Use headphones for clearer audio and less echo during consultations.
                </div>
                {userRole === 'provider' && (
                  <div className="mt-5 rounded-2xl border border-slate-800/70 bg-slate-950/70 p-4 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
                          <Disc className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">Past recordings</h3>
                          <p className="text-xs text-slate-400">Provider archive</p>
                        </div>
                      </div>
                      <button
                        onClick={loadRecordings}
                        className="text-[11px] text-cyan-300 hover:text-cyan-200 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10"
                      >
                        Refresh
                      </button>
                    </div>
                    {isLoadingRecordings ? (
                      <p className="text-slate-400 text-xs mt-3">Loading recordings…</p>
                    ) : recordings.length === 0 ? (
                      <p className="text-slate-500 text-xs mt-3">
                        No recordings found yet. Join a call to create one.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2 max-h-44 overflow-y-auto pr-1">
                        {recordings.slice(0, 5).map((rec) => (
                          <div
                            key={rec.id}
                            className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/70"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="text-white text-xs font-medium">
                                  {rec.room_name || 'Telehealth room'}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {rec.created_at ? new Date(rec.created_at).toLocaleString() : 'Recording'}
                                </p>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-700 text-slate-300">
                                {rec.status || 'processing'}
                              </span>
                            </div>
                            {rec.download_url ? (
                              <button
                                onClick={() => window.open(rec.download_url, '_blank', 'noopener,noreferrer')}
                                className="mt-2 w-full text-xs py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-100 border border-cyan-500/30 hover:from-cyan-500/30 hover:to-blue-500/30"
                              >
                                Open recording
                              </button>
                            ) : (
                              <p className="mt-2 text-[11px] text-slate-400">
                                Processing… link will appear shortly.
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Connecting View
  if (callState === 'connecting') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center animate-pulse">
            <Video className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Connecting...</h2>
          <p className="text-slate-400">Please wait while we establish a secure connection</p>
          {connectionStep && (
            <p className="text-slate-500 text-sm mt-2">{connectionStep}</p>
          )}
          {callError && (
            <p className="text-rose-400 text-sm mt-2">{callError}</p>
          )}
          <button
            onClick={() => {
              setCallState('lobby');
              setIsLoadingRoom(false);
            }}
            className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
          >
            Cancel
          </button>
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  // Call Ended View
  if (callState === 'ended') {
    return (
      <div className="min-h-[100svh] w-full bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl border border-slate-800/70 bg-gradient-to-b from-slate-900/90 to-slate-950/80 p-6 sm:p-8 shadow-[0_25px_80px_-50px_rgba(59,130,246,0.6)]">
            <div className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500/80 to-rose-600/80 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                  <PhoneOff className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white">Call Ended</h2>
                  <p className="text-slate-400 text-sm">Duration: {formatDuration(callDuration)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setCallState('lobby');
                    setCallDuration(0);
                    setChatMessages([]);
                    setMeetingId('');
                    setMeetingLink('');
                    setMeetingToken('');
                    setCallError(null);
                    setShowCredentialsModal(false);
                    setShowRecordings(false);
                  }}
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all"
                >
                  Start New Call
                </button>
                <button className="px-5 py-2 rounded-full bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition-all">
                  View Notes
                </button>
                <button
                  onClick={() => onNavigate?.('dashboard')}
                  className="px-5 py-2 rounded-full border border-slate-700 text-slate-200 text-sm font-semibold hover:bg-slate-800 transition-all"
                >
                  Back to Home
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4">
                <h3 className="text-white font-semibold mb-3">Call Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Participants</span>
                    <span className="text-white">{participants.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Duration</span>
                    <span className="text-white">{formatDuration(callDuration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Recording</span>
                    <span className="text-white">{isRecording ? 'Saved' : 'Not recorded'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Chat Messages</span>
                    <span className="text-white">{chatMessages.length}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4">
                <h3 className="text-white font-semibold mb-2">Next Steps</h3>
                <p className="text-slate-400 text-sm">
                  Save notes, share recordings, or start a new session. Everything is ready when you are.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                  <span className="px-3 py-1 rounded-full border border-slate-800 bg-slate-950/50">Secure archive</span>
                  <span className="px-3 py-1 rounded-full border border-slate-800 bg-slate-950/50">HIPAA-ready</span>
                  <span className="px-3 py-1 rounded-full border border-slate-800 bg-slate-950/50">Shareable links</span>
                </div>
              </div>
            </div>

            {userRole === 'provider' && (
              <div className="mt-6 bg-gradient-to-b from-slate-900/80 to-slate-950/70 border border-slate-700/60 rounded-2xl p-4 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
                    <Disc className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Recordings</h3>
                    <p className="text-xs text-slate-400">Secure call archive</p>
                  </div>
                </div>
                <button
                  onClick={loadRecordings}
                  className="text-xs text-cyan-300 hover:text-cyan-200 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10"
                >
                  Refresh
                </button>
              </div>
              {isLoadingRecordings ? (
                <p className="text-slate-400 text-sm mt-3">Loading recordings…</p>
              ) : recordings.length === 0 ? (
                <p className="text-slate-500 text-sm mt-3">
                  No recordings found yet. Daily may take a minute to process.
                </p>
              ) : (
                <div className="mt-4 space-y-3 max-h-64 overflow-y-auto pr-1">
                  {recordings.slice(0, 5).map((rec) => (
                    <div
                      key={rec.id}
                      className="p-4 rounded-2xl bg-slate-900/70 border border-slate-700/60"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-white text-sm font-medium">
                            {rec.room_name || 'Telehealth room'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {rec.created_at ? new Date(rec.created_at).toLocaleString() : 'Recording'}
                          </p>
                        </div>
                        <span className="text-[11px] px-2 py-1 rounded-full border border-slate-700 text-slate-300">
                          {rec.status || 'processing'}
                        </span>
                      </div>
                      {rec.download_url ? (
                        <button
                          onClick={() => window.open(rec.download_url, '_blank', 'noopener,noreferrer')}
                          className="mt-3 w-full text-sm py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-100 border border-cyan-500/30 hover:from-cyan-500/30 hover:to-blue-500/30"
                        >
                          Open recording
                        </button>
                      ) : (
                        <p className="mt-3 text-xs text-slate-400">
                          Processing… link will appear shortly.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-slate-500 mt-3">
                Recordings are available only after joining a call.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
    );
  }

  // In-Call View
  if (useEmbeddedCall) {
    return (
      <div className={`${isFullScreen ? 'fixed inset-0 z-50 bg-slate-900' : ''} h-[100svh] min-h-[100svh] w-screen overflow-hidden`}>
        <div className="h-full min-h-0 flex flex-col">
          <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-700/50 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-sm font-medium">Encrypted</span>
              <div className="h-4 w-px bg-slate-700" />
              <span className="text-white font-mono">{formatDuration(callDuration)}</span>
            </div>
            <button
              onClick={handleEndCall}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-all"
            >
              <PhoneOff className="w-4 h-4" />
              <span className="font-medium">End</span>
            </button>
          </div>
          <div className="flex-1 min-h-0 relative p-0 overflow-hidden">
            <div ref={callContainerRef} className="absolute inset-0 rounded-none overflow-hidden bg-slate-800" />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={`${isFullScreen ? 'fixed inset-0 z-50' : ''} relative h-[100svh] min-h-[100svh] w-screen overflow-hidden bg-slate-900 text-white`}>
      <audio ref={remoteAudioElRef} autoPlay playsInline />
      {toastMessage && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full border border-cyan-500/30 bg-slate-900/90 px-4 py-2 text-xs text-cyan-100 shadow-lg">
          {toastMessage}
        </div>
      )}
      <div className="h-full min-h-0 flex flex-col">
        {/* Top Bar */}
        <div className="flex-none bg-slate-900/90 backdrop-blur-md border-b border-slate-700/50 px-2 sm:px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-sm font-medium">Encrypted</span>
            </div>
            <div className="h-4 w-px bg-slate-700" />
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-white font-mono">{formatDuration(callDuration)}</span>
            </div>
            {isRecording && (
              <>
                <div className="h-4 w-px bg-slate-700" />
                <div className="flex items-center gap-2">
                  <Circle className="w-3 h-3 text-rose-500 fill-rose-500 animate-pulse" />
                  <span className="text-rose-400 text-sm">Recording</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 justify-between sm:justify-start">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
              connectionQuality === 'excellent' ? 'bg-emerald-500/20 text-emerald-400' :
              connectionQuality === 'good' ? 'bg-amber-500/20 text-amber-400' :
              'bg-rose-500/20 text-rose-400'
            }`}>
              <Wifi className="w-4 h-4" />
              <span className="text-xs capitalize">{connectionQuality}</span>
            </div>
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-0 overflow-hidden lg:flex lg:gap-3">
          {/* Video Area */}
          <div className="h-full w-full relative overflow-hidden lg:flex-1 lg:min-h-0">
            {/* View Mode Selector */}
            <div className="absolute top-12 right-3 z-10 flex items-center gap-1 bg-slate-900/70 backdrop-blur-sm rounded-lg p-1 border border-slate-700/60">
              <button
                onClick={() => setViewMode('speaker')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'speaker' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
                title="Speaker View"
              >
                <User className="w-4 h-4" />
              </button>
              {hasMultipleParticipants && (
                <>
                  <button
                    onClick={() => setViewMode('gallery')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'gallery' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
                    title="Gallery View"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('sidebar')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'sidebar' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
                    title="Sidebar View"
                  >
                    <Layout className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            {viewMode === 'speaker' ? (
              // Speaker View
              <div className="h-full relative">
                {/* Main Video */}
                <div className="w-full h-full bg-slate-800 overflow-hidden relative">
                  <video
                    ref={hasRemoteParticipant ? remoteVideoElRef : localVideoElRef}
                    className={`w-full h-full ${hasRemoteParticipant ? 'object-contain bg-black' : 'object-contain'} ${
                      hasRemoteParticipant
                        ? remoteHasVideo
                          ? 'opacity-100'
                          : 'opacity-0'
                        : isVideoOn && localHasVideo
                        ? 'opacity-100'
                        : 'opacity-0'
                    }`}
                    autoPlay
                    playsInline
                    muted={!hasRemoteParticipant}
                  />
                  {hasRemoteParticipant && !remoteHasVideo && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-5xl font-bold mb-4">
                          {participants.length > 1 ? participants[1].initials : '?'}
                        </div>
                        <p className="text-white text-xl font-medium">
                          {participants.length > 1 ? participants[1].name : 'Waiting for participant...'}
                        </p>
                      </div>
                    </div>
                  )}
                  {!hasRemoteParticipant && (!isVideoOn || !localHasVideo) && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-5xl font-bold mb-4">
                          {participants[0]?.initials || 'Y'}
                        </div>
                        <p className="text-white text-xl font-medium">Camera is off</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Speaking Indicator */}
                  {participants.length > 1 && participants[1].isSpeaking && (
                    <div className="absolute inset-0 border-4 border-cyan-500 rounded-2xl pointer-events-none" />
                  )}
                  
                  {/* Name Tag */}
                  {participants.length > 1 && (
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 backdrop-blur-sm rounded-lg">
                      {participants[1].isMuted && <MicOff className="w-4 h-4 text-rose-400" />}
                      <span className="text-white text-sm font-medium">{participants[1].name}</span>
                      {participants[1].role === 'provider' && (
                        <span className="px-1.5 py-0.5 bg-purple-500/30 text-purple-400 text-xs rounded">MD</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Self View (Picture in Picture) */}
                {hasRemoteParticipant && (
                  <div className="absolute bottom-3 right-3 w-32 sm:w-40 aspect-video bg-slate-800 rounded-lg overflow-hidden border border-slate-700/70 shadow-lg">
                    <video
                      ref={localVideoElRef}
                      className={`w-full h-full object-contain ${(isVideoOn && localHasVideo) ? 'opacity-100' : 'opacity-0'} -scale-x-100`}
                      autoPlay
                      playsInline
                      muted
                    />
                    {(!isVideoOn || !localHasVideo) && (
                      <div className="w-full h-full flex items-center justify-center">
                        {isVideoOn ? (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">
                            {participants[0].initials}
                          </div>
                        ) : (
                          <VideoOff className="w-8 h-8 text-slate-600" />
                        )}
                      </div>
                    )}
                    {participants[0].isSpeaking && (
                      <div className="absolute inset-0 border-2 border-cyan-500 rounded-xl pointer-events-none" />
                    )}
                    <div className="absolute bottom-1 left-1 flex items-center gap-1 px-2 py-0.5 bg-slate-900/80 rounded text-xs">
                      {isMuted && <MicOff className="w-3 h-3 text-rose-400" />}
                      <span className="text-white">You</span>
                    </div>
                  </div>
                )}
              </div>
            ) : viewMode === 'gallery' ? (
              // Gallery View (stable 2-up layout)
              <div className="h-full grid grid-cols-2 gap-4">
                <div className="bg-slate-800 rounded-2xl overflow-hidden relative">
                  <video
                    ref={localVideoElRef}
                    className={`w-full h-full object-contain ${(isVideoOn && localHasVideo) ? 'opacity-100' : 'opacity-0'} -scale-x-100`}
                    autoPlay
                    playsInline
                    muted
                  />
                  {(!isVideoOn || !localHasVideo) && (
                    <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                        {participants[0]?.initials || 'Y'}
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2 py-1 bg-slate-900/80 backdrop-blur-sm rounded-lg">
                    {isMuted && <MicOff className="w-3 h-3 text-rose-400" />}
                    <span className="text-white text-sm">You</span>
                  </div>
                </div>
                <div className="bg-slate-800 rounded-2xl overflow-hidden relative">
                  <video
                    ref={remoteVideoElRef}
                    className={`w-full h-full object-contain bg-black ${remoteHasVideo ? 'opacity-100' : 'opacity-0'}`}
                    autoPlay
                    playsInline
                  />
                  {!remoteHasVideo && (
                    <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                        {participants[1]?.initials || '?'}
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2 py-1 bg-slate-900/80 backdrop-blur-sm rounded-lg">
                    <span className="text-white text-sm">{participants[1]?.name || 'Participant'}</span>
                  </div>
                </div>
              </div>
            ) : (
              // Sidebar View
              <div className="h-full flex gap-4">
                <div className="flex-1 bg-slate-800 rounded-2xl overflow-hidden relative">
                  <video
                    ref={remoteVideoElRef}
                    className={`w-full h-full object-contain bg-black ${remoteHasVideo ? 'opacity-100' : 'opacity-0'}`}
                    autoPlay
                    playsInline
                  />
                  {!remoteHasVideo && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-32 h-32 rounded-full bg-slate-700 flex items-center justify-center">
                        <User className="w-16 h-16 text-slate-500" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="w-48 space-y-2">
                  <div className="aspect-video bg-slate-800 rounded-xl overflow-hidden relative">
                    <video
                      ref={localVideoElRef}
                      className={`w-full h-full object-contain ${(isVideoOn && localHasVideo) ? 'opacity-100' : 'opacity-0'} -scale-x-100`}
                      autoPlay
                      playsInline
                      muted
                    />
                    {(!isVideoOn || !localHasVideo) && (
                      <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                          {participants[0]?.initials || 'Y'}
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-slate-900/80 rounded text-xs text-white">
                      You
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Hand Raised Indicator */}
            {(handRaised || remoteHandRaised) && (
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                <Hand className="w-5 h-5 text-amber-400" />
                <span className="text-amber-400 text-sm">
                  {remoteHandRaised ? 'Participant raised a hand' : 'Hand raised'}
                </span>
              </div>
            )}
          </div>

          {/* Side Panels */}
          {(showChat || showParticipants || showRecordings) && (
            <div className="fixed inset-0 z-40 bg-slate-900/98 backdrop-blur-md lg:static lg:inset-auto lg:z-auto lg:bottom-auto lg:max-h-none lg:w-80 lg:h-full lg:bg-slate-900/85 lg:rounded-none lg:shadow-none lg:border-t-0 lg:border-l border-slate-700/50 flex flex-col overflow-y-auto">
              <div className="lg:hidden flex items-center justify-between px-4 py-4 border-b border-slate-800/70 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 ring-1 ring-white/10">
                    {showChat ? <MessageSquare className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-white font-semibold leading-tight">
                      {showChat ? 'Chat' : 'Participants'}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {showChat ? 'Secure session' : `${participants.length} in call`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowChat(false); setShowParticipants(false); setShowRecordings(false); }}
                  className="p-2 rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Panel Tabs */}
              <div className="flex border-b border-slate-700/50 bg-slate-900/70">
                <button
                  onClick={() => { setShowChat(true); setShowParticipants(false); setShowRecordings(false); }}
                  className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                    showChat ? 'text-cyan-300 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => { setShowParticipants(true); setShowChat(false); setShowRecordings(false); }}
                  className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                    showParticipants ? 'text-cyan-300 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Participants ({participants.length})
                </button>
                {userRole === 'provider' && (
                  <button
                    onClick={() => { setShowRecordings(true); setShowChat(false); setShowParticipants(false); }}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                      showRecordings ? 'text-cyan-300 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Recordings
                  </button>
                )}
              </div>

              {/* Chat Panel */}
              {showChat && (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-slate-500 py-8">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No messages yet</p>
                      </div>
                    ) : (
                      chatMessages.map(msg => (
                        <div
                          key={msg.id}
                          className={`${msg.senderId === (currentUser?.id || 'local') ? 'text-right' : ''}`}
                        >
                        <div className={`inline-block max-w-[85%] p-3 rounded-xl ${
                          msg.senderId === (currentUser?.id || 'local')
                            ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-100 border border-cyan-500/20'
                            : 'bg-slate-800/70 text-slate-200 border border-slate-700/60'
                          }`}>
                            <p className="text-xs text-slate-400 mb-1">{msg.senderName}</p>
                            <p className="text-sm">{msg.content}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t border-slate-700/50 bg-slate-900/90">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 bg-slate-800/70 border border-slate-700/60 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/70"
                      />
                      <button
                        onClick={handleSendMessage}
                        className="p-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Participants Panel */}
              {showParticipants && (
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-2">
                    {participants.map((p, idx) => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-slate-800/70 border border-slate-700/60 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium shadow-lg shadow-cyan-500/20 ring-1 ring-white/10">
                              {p.initials}
                            </div>
                            {p.isSpeaking && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-800" />
                            )}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">
                              {idx === 0 ? 'You' : p.name}
                              {p.isHost && <span className="text-cyan-400 text-xs ml-1">(Host)</span>}
                            </p>
                            <p className="text-slate-500 text-xs capitalize">{p.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {(idx === 0 ? isMuted : p.isMuted) ? (
                            <MicOff className="w-4 h-4 text-rose-400" />
                          ) : (
                            <Mic className="w-4 h-4 text-slate-400" />
                          )}
                          {(idx === 0 ? isVideoOn : p.isVideoOn) ? (
                            <Video className="w-4 h-4 text-slate-400" />
                          ) : (
                            <VideoOff className="w-4 h-4 text-rose-400" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {waitingRoom.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-2">Waiting Room</h4>
                      {waitingRoom.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-medium">
                              {p.initials}
                            </div>
                            <p className="text-white text-sm">{p.name}</p>
                          </div>
                          <button
                            onClick={() => handleAdmitParticipant(p.id)}
                            className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs hover:bg-emerald-500/30"
                          >
                            Admit
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Recordings Panel */}
              {showRecordings && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {isLoadingRecordings ? (
                    <div className="text-center text-slate-400 text-sm py-6">Loading recordings…</div>
                  ) : recordings.length === 0 ? (
                    <div className="text-center text-slate-500 py-8">
                      <Disc className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No recordings yet</p>
                    </div>
                  ) : (
                    recordings.map((rec) => (
                      <div key={rec.id} className="p-3 bg-slate-800/70 border border-slate-700/60 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white text-sm font-medium">{rec.room_name || 'Telehealth room'}</p>
                            <p className="text-xs text-slate-400">
                              {rec.created_at ? new Date(rec.created_at).toLocaleString() : 'Recording'}
                            </p>
                          </div>
                          <span className="text-xs text-slate-400">{rec.status || 'processing'}</span>
                        </div>
                      {rec.download_url ? (
                        <button
                          onClick={() => window.open(rec.download_url, '_blank', 'noopener,noreferrer')}
                          className="mt-3 w-full text-sm py-2 rounded-lg bg-cyan-600/20 text-cyan-200 hover:bg-cyan-600/30"
                        >
                          Open recording
                        </button>
                      ) : (
                        <p className="mt-3 text-xs text-slate-400">
                          Processing… link will appear shortly.
                        </p>
                      )}
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        {callError && (
          <div className="flex-none border-t border-rose-500/20 bg-rose-500/10 px-3 py-2 text-rose-300 text-xs">
            {callError}
          </div>
        )}
        <div className="flex-none bg-slate-900/90 backdrop-blur-md border-t border-slate-700/50 px-2 sm:px-4 py-2 relative z-50">
          <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2 max-w-6xl mx-auto pointer-events-auto">
            {/* Left Controls */}
            <div className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2">
              <div className="flex items-center">
                <button
                  onClick={toggleMute}
                  className={`p-2 sm:p-3 rounded-l-xl transition-all ${
                    isMuted ? 'bg-rose-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'
                  }`}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button className="p-2 sm:p-3 bg-slate-700 text-white hover:bg-slate-600 rounded-r-xl border-l border-slate-600">
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center">
                <button
                  onClick={toggleVideo}
                  className={`p-2 sm:p-3 rounded-l-xl transition-all ${
                    !isVideoOn ? 'bg-rose-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'
                  }`}
                >
                  {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
                <button className="p-2 sm:p-3 bg-slate-700 text-white hover:bg-slate-600 rounded-r-xl border-l border-slate-600">
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Center Controls */}
            <div className="w-full sm:w-auto flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={toggleScreenShare}
                disabled={!isScreenSharing && isOtherParticipantSharing}
                className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all ${
                  isScreenSharing
                    ? 'bg-emerald-500 text-white'
                    : !isScreenSharing && isOtherParticipantSharing
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
                title={
                  !isScreenSharing && isOtherParticipantSharing
                    ? 'Screen sharing is already active.'
                    : ''
                }
              >
                {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                <span className="text-sm hidden sm:inline">
                  {isScreenSharing
                    ? 'Stop Share'
                    : !isScreenSharing && isOtherParticipantSharing
                      ? 'Share locked'
                      : 'Share Screen'}
                </span>
              </button>

              {userRole === 'provider' && (
                <button
                  onClick={() => {
                    setShowChat(false);
                    setShowParticipants(false);
                    setShowRecordings(false);
                    toggleRecording();
                  }}
                  disabled={isRecordingBusy}
                  className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all ${
                    isRecording
                      ? 'bg-rose-500 text-white'
                      : isRecordingBusy
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-slate-700 text-white hover:bg-slate-600'
                  }`}
                >
                  {isRecording ? <StopCircle className="w-5 h-5" /> : <Disc className="w-5 h-5" />}

                  <span className="text-sm hidden sm:inline">
                    {isRecordingBusy ? 'Working…' : isRecording ? 'Stop' : 'Record'}
                  </span>
                </button>
              )}

              <button
                onClick={toggleHandRaise}
                className={`p-2 sm:p-3 rounded-xl transition-all ${
                  handRaised ? 'bg-amber-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                <Hand className="w-5 h-5" />
              </button>

              <button
                onClick={() => { setShowChat(!showChat); setShowParticipants(false); setShowRecordings(false); }}
                className={`p-2 sm:p-3 rounded-xl transition-all ${
                  showChat ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
              </button>

              <button
                onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); setShowRecordings(false); }}
                className={`p-2 sm:p-3 rounded-xl transition-all ${
                  showParticipants ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                <Users className="w-5 h-5" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu((prev) => !prev)}
                  className="p-2 sm:p-3 bg-slate-700 text-white hover:bg-slate-600 rounded-xl"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                {showMoreMenu && (
                  <div
                    className="absolute bottom-12 right-0 w-48 rounded-xl border border-slate-700 bg-slate-900/95 backdrop-blur-md shadow-xl p-2 text-sm z-30"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        copyMeetingId();
                        setShowMoreMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800"
                    >
                      {copiedMeetingId ? 'Invite link copied' : 'Copy invite link'}
                    </button>
                    <button
                      onClick={() => {
                        setShowChat(true);
                        setShowParticipants(false);
                        setShowRecordings(false);
                        setShowMoreMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800"
                    >
                      Open chat
                    </button>
                    <button
                      onClick={() => {
                        setShowParticipants(true);
                        setShowChat(false);
                        setShowRecordings(false);
                        setShowMoreMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800"
                    >
                      View participants
                    </button>
                    {userRole === 'provider' && (
                      <button
                        onClick={() => {
                          setShowRecordings(true);
                          setShowChat(false);
                          setShowParticipants(false);
                          setShowMoreMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800"
                      >
                        Recordings
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Controls */}
            <div className="w-full sm:w-auto flex items-center justify-center">
              <button
                onClick={handleEndCall}
                className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-all"
              >
                <PhoneOff className="w-5 h-5" />
                <span className="font-medium">End</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelehealthView;
