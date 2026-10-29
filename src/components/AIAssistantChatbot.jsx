import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { lokaApi } from '../api/client';

export default function AIAssistantChatbot({ currentCity = 'Bandung', currentGuests, currentBudget }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnreadGreeting, setHasUnreadGreeting] = useState(true);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Halo traveler! Saya **LokaBot**, asisten AI Loka Travel didukung Google Gemini AI. Ada rencana liburan atau butuh rekomendasi kamar hotel rombongan? Tanyakan saja!',
      time: 'Baru saja',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    `Rekomendasi hotel keluarga di ${currentCity}`,
    'Paket wisata alam paling favorit',
    'Hotel dengan akses ramah lansia & lift',
    'Tips alokasi kamar rombongan 6 orang',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnreadGreeting(false);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setIsLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        text: m.text,
      }));

      const contextPayload = {
        city: currentCity,
        guests: currentGuests || { adults: 2, children: 1, seniors: 0 },
        budget: currentBudget || 2500000,
      };

      const res = await lokaApi.sendChatMessage({
        message: textToSend.trim(),
        history: historyPayload,
        context: contextPayload,
      });

      const botReply = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: res.reply || 'Maaf, saya tidak dapat memproses permintaan saat ini.',
        model: res.model,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          role: 'assistant',
          text: 'Halo! Ada kendala koneksi ke server AI, namun Anda tetap dapat melihat pilihan paket wisata dan konfigurasi kamar hotel langsung di katalog web.',
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex items-end flex-col gap-2 pointer-events-auto">
        {/* Unread Greeting Pill */}
        {hasUnreadGreeting && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="flex items-center gap-2 px-3.5 py-2 bg-white rounded-2xl shadow-xl border border-teal-200/80 text-xs text-slate-800 max-w-[240px] cursor-pointer"
            onClick={() => setIsOpen(true)}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-semibold text-[#0B3B68]">Hai! Butuh saran liburan?</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setHasUnreadGreeting(false);
              }}
              className="text-slate-400 hover:text-slate-600 ml-auto flex items-center justify-center p-0.5"
              aria-label="Tutup sapaan"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}

        {/* Mascot FAB Button */}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          id="btn-lokabot-toggle"
          aria-label="Buka Chat AI LokaBot"
          className="relative group w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-[#0B3B68] to-[#00897B] p-0.5 shadow-2xl shadow-teal-900/30 flex items-center justify-center transition-transform"
        >
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden relative">
            <picture className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center">
              <source srcset="/static/images/mascot/mascot-laptop.webp" type="image/webp" />
              <img
                src="/static/images/mascot/mascot-laptop.png"
                alt="LokaBot Maskot"
                width="48"
                height="48"
                className="w-11 h-11 sm:w-12 sm:h-12 object-contain group-hover:scale-110 transition-transform duration-200"
              />
            </picture>
            <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
        </motion.button>
      </div>

      {/* Chat Window Drawer / Floating Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.22 }}
            className="fixed bottom-24 sm:bottom-24 right-3 sm:right-6 z-50 w-[94vw] sm:w-[420px] max-w-[440px] h-[540px] max-h-[80vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden backdrop-blur-xl"
            role="dialog"
            aria-label="LokaBot AI Travel Concierge"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-[#0B3B68] via-[#0D47A1] to-[#00897B] text-white flex items-center justify-between shadow-md shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white/20 p-0.5 flex items-center justify-center backdrop-blur-sm border border-white/30 shrink-0">
                  <img
                    src="/static/images/mascot/mascot-laptop.png"
                    alt="LokaBot"
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm tracking-tight text-white">LokaBot AI</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-teal-400/25 border border-teal-300/40 text-[9px] font-bold text-teal-100 uppercase tracking-wider">
                      Gemini AI
                    </span>
                  </div>
                  <div className="text-[10px] text-teal-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Asisten Cerdas Wisata Indonesia</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
                  aria-label="Tutup obrolan"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Quick Prompts Carousel */}
            <div className="px-3 py-2 bg-slate-50/90 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-[#00897B] text-[11px] font-medium text-slate-700 hover:text-[#0B3B68] whitespace-nowrap transition shadow-2xs"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3 bg-slate-50/40">
              {messages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden mt-0.5">
                        <img
                          src="/static/images/mascot/mascot-laptop.png"
                          alt="Bot"
                          className="w-6 h-6 object-contain"
                        />
                      </div>
                    )}
                    <div
                      className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                        isUser
                          ? 'bg-[#0B3B68] text-white rounded-br-xs'
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{m.text}</div>
                      <div
                        className={`text-[9px] mt-1 text-right ${
                          isUser ? 'text-blue-200' : 'text-slate-400'
                        }`}
                      >
                        {m.time}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {isLoading && (
                <div className="flex gap-2 justify-start items-center">
                  <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                    <img
                      src="/static/images/mascot/mascot-laptop.png"
                      alt="Bot"
                      className="w-6 h-6 object-contain animate-spin"
                    />
                  </div>
                  <div className="px-3.5 py-2 rounded-2xl bg-white border border-slate-200/80 text-xs text-slate-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00897B] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00897B] animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00897B] animate-bounce [animation-delay:0.3s]" />
                    <span className="text-[11px] ml-1">LokaBot sedang meracik jawaban...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-2.5 sm:p-3 bg-white border-t border-slate-200 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Tanya rekomendasi hotel, wisata, atau budget..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-100/90 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#00897B] focus:bg-white transition"
                  disabled={isLoading}
                />
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-3.5 py-2.5 rounded-xl bg-[#00897B] hover:bg-[#00796B] disabled:bg-slate-300 text-white text-xs font-bold shadow-xs transition shrink-0"
                >
                  Kirim
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

