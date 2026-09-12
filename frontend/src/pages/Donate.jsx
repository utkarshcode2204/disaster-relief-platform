import { useEffect, useState } from 'react';
import api from '../services/api';
import socket from '../services/socket';

const PRESET_AMOUNTS = [100, 500, 1000];

function Donate() {
  const [summary, setSummary] = useState({ totalRaised: 0, donorCount: 0 });
  const [recentDonations, setRecentDonations] = useState([]);
  const [amount, setAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle | processing | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    try {
      const [summaryRes, recentRes] = await Promise.all([
        api.get('/donations/summary'),
        api.get('/donations/recent'),
      ]);
      setSummary(summaryRes.data);
      setRecentDonations(recentRes.data);
    } catch (err) {
      console.error('Failed to load donation data', err);
    }
  };

  useEffect(() => {
    fetchData();

    const handleNewDonation = (donation) => {
      setSummary((prev) => ({
        totalRaised: prev.totalRaised + donation.amount,
        donorCount: prev.donorCount + 1,
      }));
      setRecentDonations((prev) => [donation, ...prev].slice(0, 20));
    };

    socket.on('new_donation', handleNewDonation);
    return () => socket.off('new_donation', handleNewDonation);
  }, []);

  const getFinalAmount = () => {
    if (customAmount) return Number(customAmount);
    return amount;
  };

  const handleDonate = async (e) => {
    e.preventDefault();
    const finalAmount = getFinalAmount();
    if (!finalAmount || finalAmount <= 0) {
      setErrorMsg('Please enter a valid amount.');
      return;
    }

    setStatus('processing');
    setErrorMsg('');

    // Simulated payment delay - this project uses a mock donation flow
    // (no real payment gateway wired in) so it can be demoed without
    // requiring business KYC verification.
    setTimeout(async () => {
      try {
        await api.post('/donations', {
          amount: finalAmount,
          donorName: donorName.trim() || undefined,
          donorEmail: donorEmail.trim() || undefined,
          message: message.trim() || undefined,
        });
        setStatus('success');
        setDonorName('');
        setDonorEmail('');
        setMessage('');
        setCustomAmount('');
      } catch (err) {
        setStatus('error');
        setErrorMsg(err.response?.data?.message || 'Something went wrong. Please try again.');
      }
    }, 1200);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-blue-700 mb-2">Support Disaster Relief</h1>
      <p className="text-gray-600 mb-8">
        Your donation goes toward food, shelter, and emergency supplies for people affected by disasters.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Total raised</p>
          <p className="text-3xl font-bold text-blue-700">₹{summary.totalRaised.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Donors</p>
          <p className="text-3xl font-bold text-blue-700">{summary.donorCount}</p>
        </div>
      </div>

      {status === 'success' ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <p className="text-green-700 font-semibold text-lg mb-2">Thank you for your donation! 🎉</p>
          <p className="text-gray-600 mb-4">Your support helps provide relief to those in need.</p>
          <button
            onClick={() => setStatus('idle')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Donate Again
          </button>
        </div>
      ) : (
        <form onSubmit={handleDonate} className="bg-white border rounded-lg p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Choose an amount</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setAmount(preset);
                    setCustomAmount('');
                  }}
                  className={`px-4 py-2 rounded border ${
                    amount === preset && !customAmount
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  ₹{preset}
                </button>
              ))}
              <input
                type="number"
                min="1"
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 w-40"
              />
            </div>
          </div>

          <input
            type="text"
            placeholder="Your Name (optional)"
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
          <input
            type="email"
            placeholder="Email (optional)"
            value={donorEmail}
            onChange={(e) => setDonorEmail(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
          <textarea
            placeholder="Leave a message (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />

          {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}

          <button
            type="submit"
            disabled={status === 'processing'}
            className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-60"
          >
            {status === 'processing' ? 'Processing...' : `Donate ₹${getFinalAmount() || 0}`}
          </button>
          <p className="text-xs text-gray-400 text-center">
            This is a demo donation flow - no real payment is processed.
          </p>
        </form>
      )}

      {recentDonations.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Recent Donations</h2>
          <div className="space-y-2">
            {recentDonations.map((d, i) => (
              <div key={i} className="bg-gray-50 border rounded px-4 py-2 flex justify-between text-sm">
                <span className="font-medium">{d.donorName || 'Anonymous'}</span>
                <span className="text-blue-700 font-semibold">₹{d.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Donate;