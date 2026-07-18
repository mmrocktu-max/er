import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { Cookie, X, UploadCloud, CheckCircle2, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from './AuthContext';
import { createApiClient } from './api';

interface LobbyProps {
  onGetStarted: (metrics?: any) => void;
}

function Lobby({ onGetStarted }: LobbyProps) {
  const { token } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);
  const cookieRef = useRef<HTMLDivElement>(null);
  
  const [cookieDismissed, setCookieDismissed] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success'>('idle');
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1.2, ease: 'power2.out' }
      );

      gsap.fromTo(
        titleRef.current,
        { y: 50, scale: 0.95, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, duration: 1.5, delay: 0.2, ease: 'back.out(1.5)' }
      );

      gsap.fromTo(
        uploadRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, delay: 0.6, ease: 'power3.out' }
      );

      gsap.to(uploadRef.current, {
        boxShadow: '0 0 25px rgba(139, 92, 246, 0.4)',
        repeat: -1,
        yoyo: true,
        duration: 2,
        ease: 'sine.inOut'
      });

      gsap.fromTo(
        cookieRef.current,
        { x: 100, y: 50, opacity: 0 },
        { x: 0, y: 0, opacity: 1, duration: 1, delay: 1, ease: 'power3.out' }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const dismissCookie = () => {
    if (cookieRef.current) {
      gsap.to(cookieRef.current, {
        x: 150,
        y: 50,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.in',
        onComplete: () => setCookieDismissed(true)
      });
    } else {
      setCookieDismissed(true);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    
    setUploadStatus('uploading');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await createApiClient(token).post('/upload-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      setMetrics(response.data);
      setUploadStatus('success');
      
      // Automatically transition to dashboard after 2 seconds
      setTimeout(() => {
        onGetStarted(response.data);
      }, 2000);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus('idle');
      alert('Failed to upload and ingest the excel file.');
    }
  }, [token, onGetStarted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/octet-stream': ['.xlsx', '.xls'],
      'text/csv': ['.csv'],
      '*/*': ['.xlsx', '.xls', '.csv']
    },
    maxFiles: 1
  });

  return (
    <div
      ref={containerRef}
      id="lobby-container"
      className="relative flex-1 flex flex-col justify-between p-8 sm:p-16 select-none z-10"
    >
      <div className="flex-1 flex flex-col justify-center items-center text-center" id="main-title-section">
        <h1
          ref={titleRef}
          id="product-display-title"
          className="font-pixel text-[8vw] sm:text-[6.5vw] md:text-[5.5vw] text-white tracking-widest leading-none select-none glow-text-purple px-4 drop-shadow-2xl font-bold filter saturate-125"
          style={{ letterSpacing: '0.08em' }}
        >
          FINANCE DASHBOARD
        </h1>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-end gap-6 w-full" id="lobby-bottom-panel">
        
        {/* Upload Dropzone */}
        <div 
          ref={uploadRef}
          id="upload-capsule" 
          className={`p-[2px] rounded-2xl bg-white/10 backdrop-blur-md border shadow-lg transition-colors duration-300 w-full max-w-sm ${isDragActive ? 'border-brand-pink bg-brand-purple/20' : 'border-white/20'}`}
        >
          <div 
            {...getRootProps()} 
            className="flex flex-col items-center justify-center p-6 bg-black/60 hover:bg-black/80 rounded-xl cursor-pointer transition-colors duration-300 min-h-[140px]"
          >
            <input {...getInputProps()} />
            
            {uploadStatus === 'idle' && (
              <>
                <UploadCloud className={`w-10 h-10 mb-3 ${isDragActive ? 'text-brand-pink' : 'text-gray-400'}`} />
                <p className="text-sm font-semibold text-white mb-1">
                  {isDragActive ? "Drop the Excel file here!" : "Upload Supplier Data"}
                </p>
                <p className="text-xs text-gray-400 text-center">
                  Drag & drop your .xlsx file here to initialize the APEX Engine
                </p>
              </>
            )}
            
            {uploadStatus === 'uploading' && (
              <div className="flex flex-col items-center">
                <Loader2 className="w-10 h-10 mb-3 text-brand-purple animate-spin" />
                <p className="text-sm font-semibold text-white mb-1 glow-text-purple">
                  Ingesting Records...
                </p>
                <p className="text-xs text-brand-pink text-center animate-pulse">
                  Vectorizing data and syncing ledger. Please wait.
                </p>
              </div>
            )}
            
            {uploadStatus === 'success' && (
              <div className="flex flex-col items-center">
                <CheckCircle2 className="w-10 h-10 mb-3 text-emerald-400" />
                <p className="text-sm font-semibold text-white mb-1">
                  Ingestion Complete!
                </p>
                <p className="text-xs text-gray-400 text-center">
                  Loaded {metrics?.suppliers_count} records. Launching dashboard...
                </p>
              </div>
            )}
          </div>
        </div>

        {!cookieDismissed && (
          <div
            ref={cookieRef}
            id="cookie-consent-popup"
            className="w-full max-w-sm p-5 bg-white text-gray-900 rounded-2xl shadow-2xl flex flex-col gap-4 border border-gray-100 z-50 text-left"
          >
            <div className="flex justify-between items-start" id="cookie-header-row">
              <div className="flex items-center gap-2" id="cookie-title-group">
                <div className="p-1.5 bg-violet-100 text-violet-700 rounded-lg" id="cookie-icon-wrapper">
                  <Cookie className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-gray-900" id="cookie-heading">Cookie Settings</h3>
              </div>
              <button
                onClick={dismissCookie}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                id="close-cookie-button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed" id="cookie-description">
              We use cookies to enhance your experience, analyze site traffic and deliver personalized content.
              Read our{' '}
              <a href="#" className="text-violet-600 hover:underline font-medium" id="cookie-policy-link">
                Cookie Policy
              </a>
              .
            </p>

            <div className="flex gap-2 w-full mt-1" id="cookie-actions">
              <button
                onClick={dismissCookie}
                className="flex-1 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                id="reject-cookies-button"
              >
                Reject
              </button>
              <button
                onClick={dismissCookie}
                className="flex-1 py-2 text-xs font-medium text-white bg-black hover:bg-neutral-800 rounded-lg transition-colors shadow-sm"
                id="accept-cookies-button"
              >
                Accept
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Lobby;
