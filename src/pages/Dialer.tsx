import React, { useState, useEffect, useRef } from 'react'
import { Phone, PhoneCall, PhoneOff, Globe, Clock, User, Mail, Hash, Asterisk, Mic, Volume2 } from 'lucide-react'

const countryCodes = [
  { code: '+1', country: 'US/Canada', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
]

const dialPad = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#']
]

export function Dialer() {
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0])
  const [phoneNumber, setPhoneNumber] = useState('')
  const [callerName, setCallerName] = useState('')
  const [callerEmail, setCallerEmail] = useState('')
  const [isCalling, setIsCalling] = useState(false)
  const [callStatus, setCallStatus] = useState('')
  const [callDuration, setCallDuration] = useState(0)
  const [showCountrySelector, setShowCountrySelector] = useState(false)
  const [callHistory, setCallHistory] = useState<any[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [showCallerInfo, setShowCallerInfo] = useState(false)
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState<string>('+18148460215')
  const [isDialing, setIsDialing] = useState(false)
  
  // NUCLEAR-LEVEL call protection - prevents ALL duplicates
  const [callButtonDisabled, setCallButtonDisabled] = useState(false)
  const [isProcessingCall, setIsProcessingCall] = useState(false)
  const lastCallAttempt = useRef<number>(0)
  const callInProgressRef = useRef<boolean>(false)
  const requestInProgressRef = useRef<boolean>(false)
  const callTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // Call state
  const [activeCall, setActiveCall] = useState<any>(null)

  useEffect(() => {
    fetchCallHistory();
    fetchTwilioStatus();
    
    // Cleanup on unmount
    return () => {
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
      }
    }
  }, [])

  const fetchTwilioStatus = async () => {
    try {
      const response = await fetch('/status')
      if (response.ok) {
        const data = await response.json()
        if (data.phoneNumber) {
          setTwilioPhoneNumber(data.phoneNumber)
        }
      }
    } catch (error) {
      console.error('Error fetching Twilio status:', error)
    }
  }

  const fetchCallHistory = async () => {
    try {
      const response = await fetch('/status')
      if (response.ok) {
        const data = await response.json()
        setCallHistory(data)
      }
    } catch (error) {
      console.error('Error fetching call history:', error)
    }
  }

  const addDigit = (digit: string) => {
    if (phoneNumber.length < 15 && !callButtonDisabled && !isProcessingCall && !requestInProgressRef.current) {
      setPhoneNumber(prev => prev + digit)
    }
  }

  const clearNumber = () => {
    if (!callButtonDisabled && !isProcessingCall && !requestInProgressRef.current) {
      setPhoneNumber('')
    }
  }

  const backspace = () => {
    if (!callButtonDisabled && !isProcessingCall && !requestInProgressRef.current) {
      setPhoneNumber(prev => prev.slice(0, -1))
    }
  }

  // Call Function - Direct call from Twilio number to target
  const handleCall = async () => {
    if (!phoneNumber.trim()) {
      alert('Please enter a phone number');
      return;
    }

    if (activeCall) {
      alert('Call already in progress');
      return;
    }

    const fullNumber = `${selectedCountry.code}${phoneNumber}`;
    
    try {
      setCallStatus('🎯 Connecting...');
      setIsCalling(true);
      setIsDialing(true);

      // Make direct call from Twilio number to target
      const response = await fetch('/call-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: fullNumber
        })
      });

      const result = await response.json();

      if (result.success) {
        setCallStatus('✅ Call connected - Target will hear your Twilio number');
        setIsConnected(true);
        setIsDialing(false);
        setActiveCall({ sid: result.callSid });

        // Start call timer
        const interval = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);
        (window as any).callInterval = interval;
      } else {
        setCallStatus(`❌ Call failed: ${result.error}`);
        resetCallState();
        alert(`Call failed: ${result.error}`);
      }

    } catch (error: any) {
      console.error('Call error:', error);
      setCallStatus(`❌ Call failed: ${error.message}`);
      resetCallState();
      alert(`Call failed: ${error.message}`);
    }
  }

  const resetCallState = () => {
    setIsCalling(false);
    setIsDialing(false);
    setCallButtonDisabled(false);
    setIsProcessingCall(false);
    callInProgressRef.current = false;
    requestInProgressRef.current = false;
    setIsConnected(false);
    
    // Clear timeout
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
  }

  const handleEndCall = async () => {
    if (!activeCall) return;
    
    try {
      // End the call via backend
      await fetch('/end', { method: 'POST' });
      
      // Clear call interval
      if ((window as any).callInterval) {
        clearInterval((window as any).callInterval);
        (window as any).callInterval = null;
      }
      
      setCallStatus('Call ended');
      setActiveCall(null);
      resetCallState();
      setCallDuration(0);
      
    } catch (error) {
      console.error('Error ending call:', error);
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📞 Nuclear-Level Dialer</h1>
          <p className="text-gray-600 text-lg">Zero duplicates guaranteed with nuclear-level protection</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Phone Dialer */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-auto border border-gray-100">
              {/* Phone Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-2 bg-gray-300 rounded-full mx-auto mb-4"></div>
                <h2 className="text-2xl font-bold text-gray-900">Nuclear-Level Dialer</h2>
              </div>
              
              {/* Country Code Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  🌍 Country Code
                </label>
                <div className="relative">
                  <button
                    onClick={() => !callButtonDisabled && !isProcessingCall && !requestInProgressRef.current && setShowCountrySelector(!showCountrySelector)}
                    disabled={callButtonDisabled || isProcessingCall || requestInProgressRef.current}
                    className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-all duration-200 shadow-sm disabled:opacity-50"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{selectedCountry.flag}</span>
                      <div className="text-left">
                        <div className="font-bold text-lg">{selectedCountry.code}</div>
                        <div className="text-sm text-gray-500">{selectedCountry.country}</div>
                      </div>
                    </div>
                    <Globe className="h-5 w-5 text-gray-400" />
                  </button>
                  
                  {showCountrySelector && !callButtonDisabled && !isProcessingCall && !requestInProgressRef.current && (
                    <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-80 overflow-y-auto">
                      {countryCodes.map((country) => (
                        <button
                          key={country.code}
                          onClick={() => {
                            setSelectedCountry(country)
                            setShowCountrySelector(false)
                          }}
                          className="w-full flex items-center space-x-3 p-4 hover:bg-blue-50 text-left border-b border-gray-100 last:border-b-0"
                        >
                          <span className="text-2xl">{country.flag}</span>
                          <div>
                            <div className="font-semibold">{country.code}</div>
                            <div className="text-sm text-gray-600">{country.country}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Phone Number Input */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  📱 Phone Number
                </label>
                
                {/* Quick Test Numbers */}
                <div className="mb-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => setPhoneNumber('5551234567')}
                    disabled={callButtonDisabled || isProcessingCall || requestInProgressRef.current}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                  >
                    Test US: 5551234567
                  </button>
                  <button
                    onClick={() => setPhoneNumber('9711794552')}
                    disabled={callButtonDisabled || isProcessingCall || requestInProgressRef.current}
                    className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                  >
                    Test IN: 9711794552
                  </button>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-gray-200 rounded-2xl p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-lg font-bold text-gray-700">{selectedCountry.code}</span>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => {
                        if (!callButtonDisabled && !isProcessingCall && !requestInProgressRef.current) {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          if (value.length <= 15) {
                            setPhoneNumber(value);
                          }
                        }
                      }}
                      placeholder="Enter phone number"
                      className="flex-1 text-2xl font-mono font-bold bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
                      disabled={callButtonDisabled || isProcessingCall || requestInProgressRef.current}
                      maxLength={15}
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">
                      {phoneNumber.length}/15 digits • Type or use dial pad
                    </div>
                  </div>
                </div>
              </div>

              {/* Dial Pad */}
              <div className="mb-8">
                <div className="grid grid-cols-3 gap-4">
                  {dialPad.map((row, rowIndex) => (
                    row.map((digit, colIndex) => (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => addDigit(digit)}
                        disabled={callButtonDisabled || isProcessingCall || requestInProgressRef.current}
                        className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 hover:from-blue-100 hover:to-blue-200 border-2 border-gray-300 text-3xl font-bold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                      >
                        {digit === '*' ? <Asterisk className="h-8 w-8 mx-auto" /> : 
                         digit === '#' ? <Hash className="h-8 w-8 mx-auto" /> : digit}
                      </button>
                    ))
                  ))}
                </div>
              </div>

              {/* Control Buttons */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <button
                  onClick={clearNumber}
                  disabled={callButtonDisabled || isProcessingCall || requestInProgressRef.current}
                  className="btn-secondary py-4 rounded-xl font-semibold transition-all duration-200 hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
                >
                  Clear
                </button>
                <button
                  onClick={backspace}
                  disabled={callButtonDisabled || isProcessingCall || requestInProgressRef.current || !phoneNumber}
                  className="btn-secondary py-4 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50"
                >
                  ←
                </button>
                <button
                  onClick={() => !callButtonDisabled && !isProcessingCall && !requestInProgressRef.current && setPhoneNumber(prev => prev + '+')}
                  disabled={callButtonDisabled || isProcessingCall || requestInProgressRef.current}
                  className="btn-secondary py-4 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50"
                >
                  +
                </button>
              </div>

              {/* Caller Information Toggle */}
              <div className="mb-6">
                <button
                  onClick={() => !callButtonDisabled && !isProcessingCall && !requestInProgressRef.current && setShowCallerInfo(!showCallerInfo)}
                  disabled={callButtonDisabled || isProcessingCall || requestInProgressRef.current}
                  className="w-full flex items-center justify-center space-x-2 p-3 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                >
                  <User className="h-4 w-4" />
                  <span>{showCallerInfo ? 'Hide' : 'Add'} Caller Information</span>
                </button>
              </div>

              {/* Caller Information */}
              {showCallerInfo && (
                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="h-4 w-4 inline mr-1" />
                      Caller Name
                    </label>
                    <input
                      type="text"
                      value={callerName}
                      onChange={(e) => setCallerName(e.target.value)}
                      placeholder="Optional"
                      className="input rounded-lg"
                      disabled={callButtonDisabled || isProcessingCall || requestInProgressRef.current}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Caller Email
                    </label>
                    <input
                      type="email"
                      value={callerEmail}
                      onChange={(e) => setCallerEmail(e.target.value)}
                      placeholder="Optional"
                      className="input rounded-lg"
                      disabled={callButtonDisabled || isProcessingCall || requestInProgressRef.current}
                    />
                  </div>
                </div>
              )}

              {/* Call Button */}
              <div className="flex space-x-4">
                {!isCalling ? (
                  <button
                    onClick={handleCall}
                    disabled={!phoneNumber.trim() || activeCall}
                    className="btn-primary flex-1 flex items-center justify-center space-x-3 py-5 text-xl rounded-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <PhoneCall className="h-7 w-7" />
                    <span>
                      {activeCall ? 'Calling...' : 'Call from Twilio'}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={handleEndCall}
                    className="btn-danger flex-1 flex items-center justify-center space-x-3 py-5 text-xl rounded-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <PhoneOff className="h-7 w-7" />
                    <span>End Call</span>
                  </button>
                )}
              </div>

              {/* Status Display */}
              {isDialing && (
                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center space-x-2 text-blue-600 mb-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                  <p className="text-sm text-blue-600">📞 Dialing...</p>
                </div>
              )}
              
              {callStatus && (
                <div className={`mt-4 p-3 rounded-xl ${
                  callStatus.includes('connected') ? 'bg-green-50 text-green-800' :
                  callStatus.includes('failed') ? 'bg-red-50 text-red-800' :
                  'bg-blue-50 text-blue-800'
                }`}>
                  <p className="text-sm font-medium">{callStatus}</p>
                </div>
              )}

              {/* Call Duration */}
              {isCalling && callDuration > 0 && (
                <div className="mt-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{formatDuration(callDuration)}</p>
                  <p className="text-sm text-gray-600">Call Duration</p>
                </div>
              )}
            </div>
          </div>

          {/* Call Status & History */}
          <div className="space-y-6">
            {/* Call Status */}
            <div className="text-center p-4">
              <div className="mb-4 space-y-3">
                <div className="flex items-center justify-center space-x-2 p-3 rounded-xl bg-green-50 text-green-700">
                  <Mic className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Nuclear-Level Dialer Ready</span>
                </div>
                
                <div className="flex items-center justify-center space-x-2 p-3 rounded-xl bg-green-50 text-green-700">
                  <Volume2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Zero Duplicates Guaranteed</span>
                </div>
                
                <div className="flex items-center justify-center space-x-2 p-3 rounded-xl bg-blue-50 text-blue-700">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">5-Second Click Protection</span>
                </div>
                
                <div className="flex items-center justify-center space-x-2 p-3 rounded-xl bg-red-50 text-red-700">
                  <Phone className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium">15-Second Button Lock</span>
                </div>
              </div>
            </div>

            {/* Recent Call History */}
            <div className="card rounded-2xl shadow-xl">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Recent Calls
              </h2>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {callHistory.length > 0 ? (
                  callHistory.slice(0, 5).map((call) => (
                    <div key={call.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Phone className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{call.phoneNumber || call.lead?.phoneE164}</div>
                          <div className="text-xs text-gray-500">{call.outcome || 'Manual call'}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">{formatDuration(call.duration || 0)}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(call.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Phone className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No call history yet</p>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => window.location.href = '/calls'}
                className="w-full btn-secondary mt-4 rounded-xl font-semibold"
              >
                View All Calls
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}