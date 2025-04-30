
import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import ListingsPage from "./ListingsPage";
import HomesPage from "./HomesPage";
import ListingPage from "./ListingPage";

function App() {

  return (
    <div className="p-2">
      <Router>
        <Routes>
          <Route path="*" element={<Navigate to="/listings"/>} />
          <Route path="/listings" element={<ListingsPage />} />
          <Route path="/listings/:id" element={<ListingPage />} />
          <Route path="/homes" element={<HomesPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
