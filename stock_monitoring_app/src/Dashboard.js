import React, { useState, useEffect } from 'react';
import './Dashboard.css';  // Add styles here if needed
import { auth } from './firebase';
import { db } from './firebase';  // Firestore reference
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

function Dashboard() {
  const [ticker, setTicker] = useState('');
  const [watchlist, setWatchlist] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [prices, setPrices]     = useState({});
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

  useEffect(() => {
    console.log("Prices Updated:",prices);
  }, [prices]);

  // Fetch user data (watchlist & holdings) from Firestore
  const fetchUserStockData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setWatchlist(data.watchlist || []);
        setHoldings(data.holdings || []);
        fetchPrices([...data.watchlist,...data.holdings]);
        
        console.log("test");
        console.log(prices);
      } else {
        console.error("No user data found");
      }
    } catch (error) {
      console.error("Error fetching user data: ", error);
    }
  };


  const fetchPrices = async (tickers) => {
    console.log("fetchPrices called with", tickers);
    try {
      const params = new URLSearchParams();
      console.log("trying");
      tickers.forEach((ticker)=> params.append("symbols[]",ticker));
      console.log("before response");
      const response = await fetch(`http://127.0.0.1:8000/api/stock/?${params.toString()}`);
      console.log("after response");
      if(!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      console.log("before setting data to data");
      const data = await response.json();
      console.log("before setting");
      console.log(data);
      console.log("heyy bnro");

      setPrices(data);
    } catch (error) {
      console.error("Error fetching stock prices: ", error);
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
      if (watchlist.includes(ticker)) {
        setError('Stock already exists in watchlist.');
        console.error('Stock already exists in watchlist.');
        return;
      }
      const updatedWatchlist = [...watchlist, ticker];
      setWatchlist(updatedWatchlist);
      if (user && user.uid) {
        try {
          const userDocRef = doc(db,"users",user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) 
          {
            const userData = userDocSnap.data();

            await updateDoc(userDocRef, {
              watchlist: updatedWatchlist,
              holdings: userData.holdings || holdings
            });
          } else {
            await setDoc(userDocRef, { watchlist: updatedWatchlist, holdings:[] });
          }
          fetchPrices([...updatedWatchlist, ...holdings]);
        } catch (error) {
          console.error("Error adding to watchlist: ", error);
        }
      } else {
        console.error("User is not authenticated.");
      }
      setTicker('');
    }
  };

  const addToHoldings = async () => {
    if (ticker) {
      if (holdings.includes(ticker)) {
        setError('Stock already exists in holdings.');
        console.error('Stock already exists in holdings.');
        return;
      }
      const updatedHoldings = [...holdings, ticker];
      setHoldings(updatedHoldings);
      if (user && user.uid) 
      {
        try {
          const userDocRef = doc(db,"users",user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists())
          {
            const userData = userDocSnap.data;

            await updateDoc(userDocRef, {
              holdings: updatedHoldings,
              watchlist: userData.watchlist || watchlist
            });
          } else {
            await setDoc(userDocRef, { holdings: updatedHoldings, watchlist: [] });
          }
          fetchPrices([...watchlist, ...updatedHoldings]);
        } catch (error) {
          console.error("Error adding to holdings.", error);
        }
      } else {
        console.error("User is not authenticated.");
      }
      setTicker('');
    }
  };

  return (
    <div className="dashboard">
      <div className="logout-container">
        <button onClick={handleLogout} className="btn-logout">Log Out</button>
      </div>
      <h1>Stock Monitoring Dashboard</h1>

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
      <div className="buttons-container">
        <button onClick={addToWatchlist}>+ Add to Watchlist</button>
        <button onClick={addToHoldings}>+ Add to Holdings</button>
      </div>
      <div className="tables-container">
        {/* Watchlist Table */}
        <div className="table-container">
          <h2>Watchlist</h2>

          <table>
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Last Price</th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map((stock, index) => (
                <tr key={index}>
                  <td>{stock}</td>
                  <td>{prices[stock]|| 'Loading...'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Holdings Table */}
        <div className="table-container">
          <h2>Holdings</h2>
          <table>
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Last Price</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((stock, index) => (
                <tr key={index}>
                  <td>{stock}</td>
                  <td>{prices[stock]|| 'Loading...'}</td>
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
