import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Upload, ArrowLeft, Loader2, CheckCircle, FileText, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

export default function DocumentScanner() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
      setScanResult(null);
      setError(null);
    }
  };

  const handleScan = async () => {
    if (!file) return;
    
    setIsScanning(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('document', file);

    try {
      // Send to the Node server which handles Cloudinary upload + Groq OCR
      const response = await fetch('http://localhost:3000/api/v1/ocr/scan', {
        method: 'POST',
        body: formData,
        // Let browser set content-type for FormData with boundary
      });

      if (!response.ok) {
        throw new Error('Failed to scan document');
      }

      const data = await response.json();
      setScanResult(data.data);
    } catch (err) {
      console.error(err);
      setError("Failed to extract text. Please try taking a clearer photo.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="absolute top-[10%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-teal-200/40 blur-[100px]"></div>
      </div>

      <header className="relative z-10 flex items-center p-6 bg-white/60 backdrop-blur-md border-b border-white/40 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="mr-4 rounded-full bg-white shadow-sm">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Scan Documents</h1>
          <p className="text-sm text-slate-500">Upload old prescriptions or lab reports for AI extraction</p>
        </div>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto p-6 flex flex-col items-center">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8">
          
          {/* Left Column: Upload / Camera */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="glass-panel overflow-hidden border-teal-500/20 shadow-xl">
              <CardContent className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                {previewUrl ? (
                  <div className="w-full space-y-4">
                    <div className="relative w-full aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden shadow-inner border border-slate-200">
                      <img src={previewUrl} alt="Document preview" className="object-cover w-full h-full" />
                    </div>
                    <div className="flex gap-4">
                      <Button variant="outline" className="flex-1 rounded-xl" onClick={() => fileInputRef.current?.click()} disabled={isScanning}>
                        Retake
                      </Button>
                      <Button className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700" onClick={handleScan} disabled={isScanning}>
                        {isScanning ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scanning...</>
                        ) : (
                          <><CheckCircle className="w-4 h-4 mr-2" /> Extract Data</>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-6">
                    <div className="w-32 h-32 mx-auto bg-teal-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-teal-100">
                      <Camera className="w-12 h-12 text-teal-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Take a Photo</h2>
                    <p className="text-slate-500">Ensure the text is clearly visible and well-lit.</p>
                    
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    
                    <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
                      <Button size="lg" className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-lg py-6" onClick={() => fileInputRef.current?.click()}>
                        <Camera className="w-5 h-5 mr-2" /> Open Camera
                      </Button>
                      <Button variant="outline" size="lg" className="w-full rounded-xl text-lg py-6 border-slate-300" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="w-5 h-5 mr-2" /> Upload File
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column: OCR Results */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full">
            <Card className="glass-panel flex-1 border-teal-500/20 shadow-xl overflow-hidden flex flex-col">
              <div className="p-6 bg-white/50 border-b border-white/40 backdrop-blur-sm flex items-center gap-3">
                <FileText className="w-6 h-6 text-teal-600" />
                <h3 className="font-bold text-lg text-slate-800">Extracted Medical Data</h3>
              </div>
              <CardContent className="p-6 flex-1 overflow-y-auto bg-white/30">
                {isScanning ? (
                  <div className="flex flex-col items-center justify-center h-full text-teal-600 space-y-4">
                    <div className="relative">
                      <div className="absolute inset-0 border-4 border-teal-200 rounded-full animate-ping"></div>
                      <Loader2 className="w-12 h-12 animate-spin relative z-10" />
                    </div>
                    <p className="font-medium animate-pulse">Our AI is reading the document...</p>
                  </div>
                ) : error ? (
                   <div className="flex flex-col items-center justify-center h-full text-red-500 space-y-4">
                    <AlertCircle className="w-12 h-12" />
                    <p className="font-medium text-center">{error}</p>
                  </div>
                ) : scanResult ? (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Diagnoses / Conditions</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {scanResult.diagnoses?.map((d, i) => <li key={i} className="text-slate-800 font-medium">{d}</li>)}
                      </ul>
                      {(!scanResult.diagnoses || scanResult.diagnoses.length === 0) && <p className="text-slate-400 italic">None detected</p>}
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Medications</h4>
                      <div className="space-y-3">
                        {scanResult.medications?.map((m, i) => (
                          <div key={i} className="p-3 bg-white rounded-lg shadow-sm border border-slate-100 flex justify-between items-center">
                            <span className="font-bold text-slate-800">{m.name}</span>
                            <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{m.dosage || 'Unknown dosage'}</span>
                          </div>
                        ))}
                        {(!scanResult.medications || scanResult.medications.length === 0) && <p className="text-slate-400 italic">None detected</p>}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Lab Results / Observations</h4>
                      <div className="text-slate-700 whitespace-pre-wrap bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                        {scanResult.observations || <span className="text-slate-400 italic">None detected</span>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4 opacity-50">
                    <FileText className="w-16 h-16" />
                    <p className="font-medium text-center max-w-xs">Scan a document to see structured medical entities extracted here automatically.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
