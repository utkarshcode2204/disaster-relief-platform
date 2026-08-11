import { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import socket from '../../services/socket';
import { useAuth } from '../../context/AuthContext';

function Chat({ requestId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${requestId}`);
        setMessages(res.data);
      } catch (err) {
        console.error('Failed to load messages', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();

    socket.emit('join_request', requestId);

    const handleNewMessage = (msg) => {
      if (msg.requestId === requestId) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    socket.on('new_message', handleNewMessage);

    return () => {
      socket.emit('leave_request', requestId);
      socket.off('new_message', handleNewMessage);
    };
  }, [requestId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await api.post(`/messages/${requestId}`, { text });
      setText('');
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  if (loading) return <p className="text-xs text-gray-500">Loading chat...</p>;

  return (
    <div className="mt-2 border-t pt-2">
      <div className="max-h-40 overflow-y-auto space-y-1 mb-2">
        {messages.length === 0 && (
          <p className="text-xs text-gray-400">No messages yet.</p>
        )}
        {messages.map((m) => (
          <div
            key={m._id}
            className={`text-xs p-1.5 rounded ${
              m.senderId?._id === user?.id ? 'bg-blue-100 ml-4' : 'bg-gray-100 mr-4'
            }`}
          >
            <span className="font-medium">{m.senderId?.name || 'Unknown'}:</span> {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-1">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="border rounded px-2 py-1 text-xs flex-1"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white text-xs px-2 py-1 rounded hover:bg-blue-600"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;