import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import Modal from '../../components/shared/Modal';
// 1. Import your complaintAPI
import { complaintAPI } from '../../services/api'; // <-- Make sure this path is correct

// 2. Removed axios and FLASK_API
// import axios from 'axios';
// const FLASK_API = 'http://localhost:5000'; // No longer needed here

const StudentMess = () => {
  const { user } = useSelector((state) => state.auth);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [myComplaints, setMyComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const [complaintForm, setComplaintForm] = useState({
    description: '',
  });

  useEffect(() => {
    loadComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myComplaints, statusFilter, severityFilter]);

  // 3. UPDATED loadComplaints to use complaintAPI
  const loadComplaints = async () => {
    try {
      // Use the getAllComplaints function from api.js
      const response = await complaintAPI.getAllComplaints();

      // Check the response format from api.js { success: true, data: [...] }
      if (response.success && Array.isArray(response.data)) {
        // Keep your original filter logic
        const messComplaints = response.data.filter(complaint => 
          complaint.admin_view?.departments?.includes("Mess & Dining")
        );
        setMyComplaints(messComplaints);
      } else {
        console.error('Error loading complaints:', response.error);
      }
    } catch (error) {
      console.error('Error loading complaints:', error);
    }
  };

  // This function is fine, it works on the local myComplaints state
  const filterComplaints = () => {
    let filtered = [...myComplaints];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => {
        const status = c.student_view?.status || c.status || 'Pending';
        return status.toLowerCase().replace(' ', '_') === statusFilter;
      });
    }
    
    if (severityFilter !== 'all') {
      filtered = filtered.filter((c) => {
        const severity = c.admin_view?.severity || c.student_view?.severity || 3;
        
        // Map 1-5 scale to low/medium/high
        if (severityFilter === 'low') return severity <= 2;
        if (severityFilter === 'medium') return severity === 3;
        if (severityFilter === 'high') return severity >= 4;
        
        return true;
      });
    }
    
    setFilteredComplaints(filtered);
  };

  // 4. UPDATED handleSubmitComplaint to use complaintAPI
  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use the submitComplaint function from api.js
      // Pass 'mess' as the categoryHint since this is the Mess page
      const response = await complaintAPI.submitComplaint(
        complaintForm.description, 
        'mess' // This is the 'categoryHint' in api.js
      );

      // Check the response format from api.js { success: true, ... }
      if (response.success) {
        alert('Complaint registered successfully!');
        setComplaintForm({ description: '' });
        setShowComplaintModal(false);
        await loadComplaints(); // Reload complaints
      } else {
        // 5. Fixed alert to show the actual error
        alert('Error submitting complaint: ' + response.error);
      }
    } catch (error) {
      // This catches network failures or other JS errors
      console.error('Error:', error);
      alert('A critical error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions are fine as-is
  const getStatusBadgeClass = (status) => {
    const statusMap = {
      Pending: 'pending',
      in_progress: 'in-progress',
      resolved: 'resolved',
    };
    return statusMap[status] || 'pending';
  };

  const getSeverityBadgeClass = (severity) => {
    // Severity is now 1-5 scale
    if (severity >= 4) return 'severity-high';
    if (severity >= 3) return 'severity-medium';
    return 'severity-low';
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-content">
          <div className="page-header">
            <i className="fas fa-utensils"></i>
            <div>
              <h1>Mess Management</h1>
              <p>Timings, menus, and complaint management</p>
            </div>
          </div>

          {/* Mess Timings */}
          <div className="content-card">
            <h2>
              <i className="fas fa-clock"></i> Mess Timings
            </h2>
            <table>
              <thead>
                <tr>
                  <th>Meal</th>
                  <th>Weekdays</th>
                  <th>Weekends</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Breakfast</strong></td>
                  <td>7:30 AM - 9:30 AM</td>
                  <td>8:00 AM - 10:00 AM</td>
                </tr>
                <tr>
                  <td><strong>Lunch</strong></td>
                  <td>12:30 PM - 2:30 PM</td>
                  <td>12:30 PM - 2:30 PM</td>
                </tr>
                <tr>
                  <td><strong>Snacks</strong></td>
                  <td>5:00 PM - 6:00 PM</td>
                  <td>5:00 PM - 6:00 PM</td>
                </tr>
                <tr>
                  <td><strong>Dinner</strong></td>
                  <td>7:30 PM - 10:00 PM</td>
                  <td>7:30 PM - 10:00 PM</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Weekly Menu */}
          <div className="content-card">
            <h2>
              <i className="fas fa-calendar-week"></i> This Week&apos;s Menu
            </h2>
            <div className="alert alert-info">
              <i className="fas fa-file-pdf"></i>
              <span>
                View the complete menu: <a href="#">Download PDF</a>
              </span>
            </div>
          </div>

          {/* Submit Complaint */}
          <div className="content-card">
            <h2>
              <i className="fas fa-exclamation-circle"></i> Submit a Complaint
            </h2>
            <button className="btn btn-primary" onClick={() => setShowComplaintModal(true)}>
              <i className="fas fa-plus"></i> File New Complaint
            </button>
          </div>

          {/* Filters */}
          <div className="content-card">
            <h2>
            	<i className="fas fa-filter"></i> Filters
            </h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                <label>Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                <label>Severity</label>
                <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
                  <option value="all">All Severity</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>

          {/* My Complaints */}
          <div className="content-card">
            <h2>
            	<i className="fas fa-list"></i> My Complaints
            </h2>
            <div className="table-container">
              <table>
                <thead>
                 <tr>
                    <th>Complaint ID</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComplaints.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                        No complaints found
                      </td>
                    </tr>
                  ) : (
                    filteredComplaints.map((complaint) => (
                      <tr key={complaint.id}>
                        <td>{complaint.id}</td>
                        <td>{complaint.student_view?.complaint?.substring(0, 50) || 'N/A'}...</td>
                        <td>
                          <span className={`status-badge ${getStatusBadgeClass(complaint.student_view?.status)}`}>
                            {complaint.student_view?.status || 'Unknown'}
                          </span>
                        </td>
                        <td>
                         {complaint.student_view?.timestamp
                            ? new Date(complaint.student_view.timestamp).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td>
                          <button
                            className="btn btn-primary"
                            style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}
                            onClick={() => {
                              setSelectedComplaint(complaint);
                            	setShowDetailsModal(true);
                           }}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                 )}
                </tbody>
        	  </table>
            </div>
          </div>
        </div>
      </div>

      {/* Complaint Modal */}
      <Modal
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        title={<><i className="fas fa-exclamation-circle"></i> Submit Mess Complaint</>}
      >
        <form onSubmit={handleSubmitComplaint}>
          <div className="form-group">
            <label htmlFor="description">Describe Your Complaint *</label>
         <textarea
              id="description"
              rows="6"
              maxLength="5000"
              placeholder="Please describe your complaint in detail..."
              value={complaintForm.description}
              onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
              required
          	></textarea>
            <p style={{ textAlign: 'right', color: '#666', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            	{complaintForm.description.length}/5000
            </p>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            <i className="fas fa-check"></i> {loading ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
      	onClose={() => {
          setShowDetailsModal(false);
          setSelectedComplaint(null);
        }}
        title={<><i className="fas fa-info-circle"></i> Complaint Details</>}
      >
        {selectedComplaint ? (
          <div>
          	<div style={{ marginBottom: '1rem' }}>
            	<h4>📋 Complaint Information</h4>
            	<p><strong>ID:</strong> {selectedComplaint.id || 'N/A'}</p>
            	<p><strong>Description:</strong> {selectedComplaint.student_view?.complaint || 'N/A'}</p>
            	<p>
            	  <strong>Status:</strong>{' '}
            	  <span className={`status-badge ${getStatusBadgeClass(selectedComplaint.student_view?.status)}`}>
              	{selectedComplaint.student_view?.status || 'Unknown'}
            	  </span>
            	</p>
            	<p>
            	  <strong>Submitted:</strong>{' '}
            	  {selectedComplaint.student_view?.timestamp
              	? new Date(selectedComplaint.student_view.timestamp).toLocaleString()
              	: 'N/A'}
            	</p>
          	</div>

          	{/* Suggestions ONLY */}
          	{selectedComplaint.admin_view?.suggestions && selectedComplaint.admin_view.suggestions.length > 0 && (
          	  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' }}>
          	  	<h4 style={{ marginBottom: '1rem' }}>💡 Suggestions While We Review</h4>
        	  <ul style={{ lineHeight: '1.8', paddingLeft: '1.5rem', margin: 0, color: '#555' }}>
          	  	{selectedComplaint.admin_view.suggestions.map((suggestion, index) => (
          	  	  <li key={index} style={{ marginBottom: '0.7rem' }}>
          	  		{suggestion}
          	  	  </li>
          	  	))}
        	  </ul>
          	  </div>
        	  )}

          	<button
          	  className="btn btn-primary"
          	  style={{ marginTop: '1.5rem', width: '100%' }}
          	  onClick={() => {
          	  	setShowDetailsModal(false);
        	  	setSelectedComplaint(null);
          	  }}
          	>
          	  Close
          	</button>
          </div>
        ) : (
          <p>No complaint selected</p>
        )}
      </Modal>

      <Footer />
    </>
  );
};

export default StudentMess;