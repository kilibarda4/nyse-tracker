import React, { useState, useEffect } from 'react';
import './Dashboard.css';  // Add styles here if needed
import { auth } from './firebase';
import { db } from './firebase';  // Firestore reference
import { doc, getDoc, updateDoc } from 'firebase/firestore';

function Dashboard() {
  const [ticker, setTicker] = useState('');
  const [watchlist, setWatchlist] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null); // To store user data

  useEffect(() => {
    // Check if user is logged in and get their UID
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      fetchUserStockData(currentUser.uid); // Fetch user data when they log in
    }
  }, []);

  // Fetch user data (watchlist & holdings) from Firestore
  const fetchUserStockData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setWatchlist(data.watchlist || []);
        setHoldings(data.holdings || []);
      } else {
        console.error("No user data found");
      }
    } catch (error) {
      console.error("Error fetching user data: ", error);
    }
  };

  const handleLogout = () => {
    auth.signOut();
  };

  const handleTickerChange = (e) => {
    setTicker(e.target.value);
  };

  const addToWatchlist = async () => {
    if (ticker) {
      const updatedWatchlist = [...watchlist, ticker];
      setWatchlist(updatedWatchlist);
      await updateDoc(doc(db, "users", user.uid), { watchlist: updatedWatchlist });
      setTicker('');
    }
  };

  const addToHoldings = async () => {
    if (ticker) {
      const updatedHoldings = [...holdings, ticker];
      setHoldings(updatedHoldings);
      await updateDoc(doc(db, "users", user.uid), { holdings: updatedHoldings });
      setTicker('');
    }
  };

  return (
    <div className="dashboard">
      <h1>Stock Monitoring Dashboard</h1>

      <div className="logout-container">
        <button onClick={handleLogout} className="btn-logout">Log Out</button>
      </div>

      <div className="input-container">
        <label htmlFor="ticker-input">Enter Ticker:</label>
        <input
          type="text"
          id="ticker-input"
          value={ticker}
          onChange={handleTickerChange}
          placeholder="e.g. AAPL, MSFT"
        />
      </div>

      <div className="tables-container">
        {/* Watchlist Table */}
        <div className="table-container">
          <h2>Watchlist</h2>
          <button onClick={addToWatchlist}>+ Add to Watchlist</button>
          <table>
            <thead>
              <tr>
                <th>Ticker</th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map((stock, index) => (
                <tr key={index}>
                  <td>{stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Holdings Table */}
        <div className="table-container">
          <h2>Holdings</h2>
          <button onClick={addToHoldings}>+ Add to Holdings</button>
          <table>
            <thead>
              <tr>
                <th>Ticker</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((stock, index) => (
                <tr key={index}>
                  <td>{stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
