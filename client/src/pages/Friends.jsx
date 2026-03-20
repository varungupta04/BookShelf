import { useState, useEffect } from 'react';
import { Users, UserPlus, Check, X, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { InnerLayout } from '../components/InnerLayout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function Friends() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('find');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [friends, setFriends] = useState([]);

  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/api/friends/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setSearchResults(data.users || []);
    } catch (error) {
      addToast('Failed to search users', 'error');
    } finally {
      setSearchLoading(false);
    }
  };

  const sendFriendRequest = async (receiverId) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/api/friends/request`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiver_id: receiverId })
      });
      if (!response.ok) throw new Error('Failed to send request');
      addToast('Friend request sent!', 'success');
      setSearchResults(prev => prev.filter(u => u.id !== receiverId));
    } catch (error) {
      addToast(error.message || 'Failed to send friend request', 'error');
    }
  };

  const fetchIncomingRequests = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/api/friends/requests/incoming`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setIncomingRequests(data.requests || []);
    } catch (error) {
      addToast('Failed to fetch friend requests', 'error');
    }
  };

  const handleFriendRequest = async (requestId, status) => {
    try {
      const token = await getAuthToken();
      await fetch(`${API_URL}/api/friends/request/${requestId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      addToast(`Request ${status}!`, 'success');
      setIncomingRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      addToast('Failed to update request', 'error');
    }
  };

  const fetchFriends = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/api/friends`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setFriends(data.friends || []);
    } catch (error) {
      addToast('Failed to fetch friends', 'error');
    }
  };

  useEffect(() => {
    if (activeTab === 'requests') fetchIncomingRequests();
    else if (activeTab === 'friends') fetchFriends();
  }, [activeTab]);

  return (
    <InnerLayout title="Friends">
      <div className="max-w-4xl mx-auto">
        <div className="flex border-b border-slate-200 mb-8">
          <button onClick={() => setActiveTab('find')} className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'find' ? 'text-[#2D4A38] border-[#2D4A38]' : 'text-slate-500 border-transparent hover:text-slate-700'}`}>
            Find Friends
          </button>
          <button onClick={() => setActiveTab('requests')} className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors relative ${activeTab === 'requests' ? 'text-[#2D4A38] border-[#2D4A38]' : 'text-slate-500 border-transparent hover:text-slate-700'}`}>
            Requests
            {incomingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {incomingRequests.length}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab('friends')} className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'friends' ? 'text-[#2D4A38] border-[#2D4A38]' : 'text-slate-500 border-transparent hover:text-slate-700'}`}>
            My Friends
          </button>
        </div>

        {activeTab === 'find' && (
          <div>
            <div className="flex gap-2 mb-6 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                  placeholder="Search by email or username..."
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#2D4A38]/30"
                />
              </div>
              <button onClick={searchUsers} disabled={searchLoading || !searchQuery.trim()} className="btn-primary">
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {searchResults.map((u) => (
                <div key={u.id} className="card p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{u.username || u.email}</h3>
                    <p className="text-sm text-slate-600">{u.email}</p>
                  </div>
                  <button onClick={() => sendFriendRequest(u.id)} className="btn-primary flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div>
            {incomingRequests.length === 0 ? (
              <div className="card text-center p-8">
                <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No pending requests</h3>
                <p className="text-slate-600">You don't have any friend requests at the moment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {incomingRequests.map((req) => (
                  <div key={req.id} className="card p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{req.profiles?.username || req.profiles?.email}</h3>
                      <p className="text-sm text-slate-600">{req.profiles?.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleFriendRequest(req.id, 'accepted')} className="btn-primary flex items-center gap-2">
                        <Check className="h-4 w-4" /> Accept
                      </button>
                      <button onClick={() => handleFriendRequest(req.id, 'declined')} className="btn-ghost flex items-center gap-2 text-red-600">
                        <X className="h-4 w-4" /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'friends' && (
          <div>
            {friends.length === 0 ? (
              <div className="card text-center p-8">
                <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No friends yet</h3>
                <p className="text-slate-600">Start by searching for friends!</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {friends.map((friend) => (
                  <div key={friend.id} className="card p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{friend.username || friend.email}</h3>
                      <p className="text-sm text-slate-600">{friend.email}</p>
                    </div>
                    <div className="w-10 h-10 bg-[#2D4A38] text-white rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </InnerLayout>
  );
}