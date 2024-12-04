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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [alertType, setAlertType] = useState("fixed");
  const [percentChange, setPercentChange] = useState("");
  const [priceDirection, setPriceDirection] = useState("Increase");

  

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

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStock('');
    setTargetPrice('');
    setError('');
  };

  const savePriceAlert = async () => {
    if (!selectedStock) {
      setError('Please select a stock.');
      return;
    }

    let alertData = {};
    if (alertType=== "fixed")
    {
      if (!targetPrice || isNaN(targetPrice)) {
        setError("Please enter a valid target price.");
        return;
      }
      alertData = { ticker: selectedStock, alertType: "fixed", targetPrice: parseFloat(targetPrice), priceDirection };
      console.log(`Fixed price alert set for ${selectedStock} at ${targetPrice}`);
    } else if (alertType === "percent") {
      if (!percentChange || isNaN(percentChange)) {
        setError("Please enter a valid percentage change.(Don't use percent sign)");
        return;
      }
      const latestPrice = prices[selectedStock];
      if (!latestPrice || isNaN(latestPrice))
      {
        setError("Could not fetch the latest stock price");
        return;
      }
      const calculatedPrice = (
        latestPrice * (1+parseFloat(percentChange)/100)
      ).toFixed(2);
      alertData = { ticker: selectedStock, alertType: "percent", targetPrice: calculatedPrice , priceDirection}
      console.log(`Percent change alert set for ${selectedStock}: ${percentChange}% change -> ${calculatedPrice}`);
      
      
    }

    try {
      const userDocRef = doc(db,"users", user.uid);
      const alertRef = doc(userDocRef, "alerts", `${selectedStock}-${alertType}-${priceDirection}`);
      await setDoc(alertRef, alertData);
      console.log("Alert saved successfully:", alertData);

      const response = await fetch('http://127.0.0.1:8000/api/publish-alert/', {
        method: 'POST',
        headers: {
          'Content-Type' : 'application/json',
        },
        body: JSON.stringify({message_data: JSON.stringify(alertData) }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error publishing the alert: ${errorText}`);
        setError("Failed to publish the alert.");

        return;
      }
      console.log("Alert published to Pub/Sub successfully");

    } catch (error) {
      console.error("Error saving alert:", error);
      setError("Failed to save the alert.");
    }

    setError("");
    closeModal();
    
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
        <button onClick={openModal}>Set Price Alerts</button>
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
        {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Set Price Alert</h2>
            <label htmlFor="alert-type">Choose Alert Type:</label>
            <select
              id="alert-type"
              value={alertType}
              onChange={(e)=> setAlertType(e.target.value)}
            >
              <option value="fixed">Fixed Price</option>
              <option value="percent">Percentage Change</option>
            </select>
            {alertType === "fixed" ? (
              <div>
              <label htmlFor="target-price">Target Price:</label>
              <input
                type="number"
                id="target-price"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="Enter target price"
              />
            </div>
            ) : (
              <div>
              <label htmlFor="percent-change">Percentage Change (%):</label>
              <input
                type="number"
                id="percent-change"
                value={percentChange}
                onChange={(e) => setPercentChange(e.target.value)}
                placeholder="Enter percentage change"
              />
            </div>
          )}

          <label htmlFor="price-direction">Alert Direction:</label>
          <select
            id = "price-direction"
            value = {priceDirection}
            onChange={(e)=> setPriceDirection(e.target.value)}
          >
            <option value="increase">Increase</option>
            <option value="decrease">Decrease</option>
          </select>
            
            {error && <p className="error-message">{error}</p>}

            <div className="modal-field">
              <label htmlFor="stock-select">Select Stock:</label>
              <select
                id="stock-select"
                value={selectedStock}
                onChange={(e) => setSelectedStock(e.target.value)}
              >
                <option value="">--Select a Stock--</option>
                {watchlist.map((stock, index) => (
                  <option key={index} value={stock}>
                    {stock}
                  </option>
                ))}
                {holdings.map((stock, index) => (
                  <option key={`holdings-${index}`} value={stock}>
                    {stock}
                  </option>
                ))}
              </select>
            </div>


            <div className="modal-buttons">
              <button onClick={savePriceAlert}>Save Alert</button>
              <button onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
            </div>
          </div>
        );
      }

export default Dashboard;
