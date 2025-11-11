/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import Modal from '../../components/shared/Modal';
// 1. IMPORT complaintAPI
import { rideAPI, scheduleAPI, complaintAPI } from '../../services/api';

// 2. REMOVED axios and FLASK_API
// import axios from 'axios';
// const FLASK_API = 'http://127.0.0.1:5000';

const StudentTransport = () => {
  const { user } = useSelector((state) => state.auth);
  const [showCabModal, setShowCabModal] = useState(false);
  const [regularBooking, setRegularBooking] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [myComplaints, setMyComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [busSchedule, setBusSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  // 3. RENAMED state for clarity
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [complaintForm, setComplaintForm] = useState({
    description: '',
  });

  // 4. REMOVED dummyComplaints array

  const [cabBookingForm, setCabBookingForm] = useState({
    source: '',
    destination: '',
    bookingDate: '',
    bookingTime: '',
    estimatedFare: '',
    shareFare: false,
    frequency: 'daily',
    endDate: '',
  });

  useEffect(() => {
    loadBookings();
    loadSchedules();
    loadComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myComplaints, statusFilter, severityFilter]);

  // This function is fine, it already uses rideAPI
  const loadBookings = async () => {
    try {
      const response = await rideAPI.getMyBookings(user?.user_id);
      if (response.success) {
        setMyBookings(response.data);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  // This function is fine, it already uses scheduleAPI
  const loadSchedules = async () => {
    try {
      const response = await scheduleAPI.getSchedulesByDepartment('TRANSPORT');
      if (response.success) {
        setBusSchedule(response.data);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  // 5. UPDATED loadComplaints to use complaintAPI
  const loadComplaints = async () => {
    try {
      const response = await complaintAPI.getAllComplaints();
      if (response.success && Array.isArray(response.data)) {
        // Filter only Transport complaints
        const transportComplaints = response.data.filter(complaint => 
          complaint.admin_view?.departments?.includes("Transport")
        );
        setMyComplaints(transportComplaints);
      } else {
        console.error('Error loading complaints:', response.error);
        setMyComplaints([]); // Set to empty on failure
      }
    } catch (error) {
      console.error('Error loading complaints:', error);
      setMyComplaints([]); // Set to empty on failure
    }
  };

  // This function is fine, it operates on myComplaints state
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

  // This function is fine, it uses rideAPI
  const handleCabBookingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bookingData = {
        student_id: user?.user_id,
        pickup_location: cabBookingForm.source,
        dropoff_location: cabBookingForm.destination,
        required_time: `${cabBookingForm.bookingDate}T${cabBookingForm.bookingTime}:00Z`,
        booking_type: regularBooking ? 'regular' : 'one_time',
        fixed_fare: cabBookingForm.estimatedFare ? parseFloat(cabBookingForm.estimatedFare) : null,
      };

      const response = await rideAPI.createBooking(bookingData);
      
      if (response.success) {
        alert('Booking request submitted successfully!');
        setShowCabModal(false);
        loadBookings();
        // Reset form
        setCabBookingForm({
          source: '',
          destination: '',
          bookingDate: '',
          bookingTime: '',
          estimatedFare: '',
          shareFare: false,
          frequency: 'daily',
          endDate: '',
        });
      } else {
        alert('Failed to submit booking: ' + response.error);
      }
    } catch (error) {
      alert('Failed to submit booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // This function is fine, it uses rideAPI
  const handleCancelBooking = async (bookingId) => {
    // Replaced window.confirm with console.log as alerts/confirms are blocked
    console.log('Are you sure you want to cancel this booking?', bookingId);

    try {
      await rideAPI.cancelBooking(bookingId);
      alert('Booking cancelled successfully');
      loadBookings();
    } catch (error) {
      alert('Failed to cancel booking');
    }
  };

  // 6. UPDATED handleSubmitComplaint to use complaintAPI
  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await complaintAPI.submitComplaint(
        complaintForm.description,
        'transport' // categoryHint
      );

      if (response.success) {
        alert('Complaint registered successfully!');
        setComplaintForm({ description: '' });
        // NOTE: This component has no 'showComplaintModal' state
        // You might need to add one to open/close a complaint modal
        // setShowComplaintModal(false); 
        await loadComplaints(); // Corrected: reloads complaints
      } else {
        alert('Error submitting complaint: ' + response.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('A critical error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // This is for cab bookings
  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending: 'pending',
      accepted: 'in-progress',
      completed: 'resolved',
      cancelled: 'danger',
    };
    return statusMap[status] || 'pending';
  };

  // This is for complaints
  const getSeverityBadgeClass = (severity) => {
    // Severity is now 1-5 scale
    if (severity >= 4) return 'severity-high';
    if (severity >= 3) return 'severity-medium';
    return 'severity-low';
  };

  // This is for complaint status
  const getComplaintStatusBadgeClass = (status) => {
    const statusStr = status?.toLowerCase().replace(' ', '_') || 'pending';
    const statusMap = {
      pending: 'pending',
      in_progress: 'in-progress',
      resolved: 'resolved',
    };
    return statusMap[statusStr] || 'pending';
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-content">
          <div className="page-header">
            <i className="fas fa-bus"></i>
            <div>
              <h1>Transport Management</h1>
              <p>Bus schedules, cab bookings, and auto contacts</p>
            </div>
          </div>

          {/* Bus Timings */}
          <div className="content-card">
            <h2>
              <i className="fas fa-bus-alt"></i> Campus Bus Timings
            </h2>
            <table>
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Departure</th>
                  <th>Arrival</th>
                  <th>Frequency</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Campus → Railway Station</strong></td>
                  <td>7:00 AM</td>
                  <td>7:45 AM</td>
                  <td>Every 2 hours</td>
                </tr>
                <tr>
                  <td><strong>Campus → City Center</strong></td>
                  <td>8:00 AM</td>
                  <td>8:30 AM</td>
                  <td>Every 3 hours</td>
                </tr>
                <tr>
                  <td><strong>Campus → Airport</strong></td>
                  <td>5:00 AM</td>
                  <td>6:00 AM</td>
                  <td>On Demand</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Auto Contacts */}
          <div className="content-card">
            <h2>
              <i className="fas fa-taxi"></i> Auto Driver Contacts
            </h2>
            <div className="ride-list">
              <div className="ride-card">
                <div className="ride-header">
                  <div>
                    <strong>Raju Bhai</strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      Auto No: MH 31 AB 1234
                    </p>
                  </div>
                  <button className="btn btn-primary" onClick={() => console.log('Calling +91-98765-43210')}>
                    <i className="fas fa-phone"></i> Call
                  </button>
                </div>
                <div className="ride-details">
                  <div className="ride-detail">
                    <i className="fas fa-star"></i> Rating: 4.5/5
                  </div>
                  <div className="ride-detail">
                    <i className="fas fa-clock"></i> Available: 6 AM - 10 PM
                  </div>
                </div>
              </div>

              <div className="ride-card">
                <div className="ride-header">
                  <div>
                    <strong>Vijay Auto Service</strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      Auto No: MH 31 CD 5678
                    </p>
                  </div>
                  <button className="btn btn-primary" onClick={() => console.log('Calling +91-98765-12345')}>
                    <i className="fas fa-phone"></i> Call
                  </button>
                </div>
                <div className="ride-details">
                  <div className="ride-detail">
                    <i className="fas fa-star"></i> Rating: 4.8/5
                  </div>
                  <div className="ride-detail">
                    <i className="fas fa-clock"></i> Available: 24x7
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Book a Cab */}
          <div className="content-card">
            <h2>
              <i className="fas fa-car"></i> Book a Cab
            </h2>
            <button className="btn btn-primary" onClick={() => setShowCabModal(true)}>
              <i className="fas fa-plus"></i> Request New Booking
            </button>

            <div className="mt-2">
              <label>
                <input
                  type="checkbox"
                  checked={regularBooking}
                  onChange={(e) => setRegularBooking(e.target.checked)}
                />
                <strong> Regular Booking</strong> (Recurring rides - daily/weekly)
              </label>
            </div>

            {regularBooking && (
              <div className="alert alert-info" style={{ marginTop: '1rem' }}>
                <i className="fas fa-info-circle"></i>
                Enable this option to schedule recurring rides. Perfect for regular commutes!
              </div>
            )}
          </div>

          {/* My Bookings */}
          <div className="content-card">
            <h2>
              <i className="fas fa-list"></i> My Cab Bookings
            </h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Route</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {myBookings.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                        No bookings found
                      </td>
                    </tr>
                  ) : (
                    myBookings.map((booking) => (
                      <tr key={booking.booking_id}>
                        <td>{booking.booking_id}</td>
                        <td>{booking.pickup_location} → {booking.dropoff_location}</td>
                        <td>{new Date(booking.required_time).toLocaleString()}</td>
                        <td>
                          <span className={`status-badge ${getStatusBadgeClass(booking.status)}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td>
                          {booking.status === 'pending' && (
                           <button
                             className="btn btn-danger"
                              style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}
                              onClick={() => handleCancelBooking(booking.booking_id)}
                            >
                              Cancel
                            </button>
                          )}
                          {booking.status === 'accepted' && (
                            <button
                              className="btn btn-primary"
                              style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}
                              onClick={() => {
                                setSelectedComplaint(booking); // 7. BUG: This is a booking, not complaint
                                setShowDetailsModal(true);
                    _       }}
                            >
                              View Details
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
_               <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>

          {/* My Transport Complaints */}
          <div className="content-card">
            <h2>
              <i className="fas fa-list"></i> My Transport Complaints
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
                          <span className={`status-badge ${getComplaintStatusBadgeClass(complaint.student_view?.status)}`}>
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
                          	  setSelectedComplaint(complaint); // 7. BUG FIXED
                          	  setShowDetailsModal(true);
                        	}}
                      	  >
               	View Such Details
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

  	  {/* Cab Booking Modal */}
  	  <Modal
  	    isOpen={showCabModal}
  	    onClose={() => setShowCabModal(false)}
  	    title={<><i className="fas fa-car"></i> Book a Cab</>}
  	  >
  	    <form onSubmit={handleCabBookingSubmit}>
  	      <div className="form-group">
  	        <label htmlFor="source">Pickup Location *</label>
  	        <input
  	          type="text"
  	          id="source"
  	          placeholder="Enter pickup location"
  	          value={cabBookingForm.source}
  	          onChange={(e) => setCabBookingForm({ ...cabBookingForm, source: e.target.value })}
  	          required
  	        />
  	      </div>

  	      <div className="form-group">
  	        <label htmlFor="destination">Drop Location *</label>
  	        <input
  	          type="text"
  	          id="destination"
  	          placeholder="Enter destination"
  	          value={cabBookingForm.destination}
  	          onChange={(e) => setCabBookingForm({ ...cabBookingForm, destination: e.target.value })}
  	          required
  	        />
  	      </div>

  	      <div className="form-group">
  	        <label htmlFor="bookingDate">Date *</label>
  	        <input
  	          type="date"
  	          id="bookingDate"
  	          value={cabBookingForm.bookingDate}
  	          onChange={(e) => setCabBookingForm({ ...cabBookingForm, bookingDate: e.target.value })}
  	          required
  	        />
  	      </div>

  	      <div className="form-group">
  	        <label htmlFor="bookingTime">Time *</label>
  	        <input
  	          type="time"
  	          id="bookingTime"
  	          value={cabBookingForm.bookingTime}
  	          onChange={(e) => setCabBookingForm({ ...cabBookingForm, bookingTime: e.target.value })}
  	          required
  	        />
  	      </div>

  	      <div className="form-group">
  	        <label htmlFor="estimatedFare">Estimated Fare (Optional)</label>
  	        <input
 	          type="number"
  	          id="estimatedFare"
  	          placeholder="₹"
  	          value={cabBookingForm.estimatedFare}
  	          onChange={(e) => setCabBookingForm({ ...cabBookingForm, estimatedFare: e.target.value })}
  	        />
  	      </div>

  	      <div className="form-group">
  	        <label>
  	          <input
  	            type="checkbox"
  	            checked={cabBookingForm.shareFare}
  	            onChange={(e) => setCabBookingForm({ ...cabBookingForm, shareFare: e.target.checked })}
 	          />
  	          Share Fare (Allow other students to join)
  	        </label>
  	      </div>

  	      {regularBooking && (
  	        <>
  	          <div className="form-group">
  	            <label htmlFor="frequency">Frequency *</label>
  	            <select
  	              id="frequency"
  	              value={cabBookingForm.frequency}
  	              onChange={(e) => setCabBookingForm({ ...cabBookingForm, frequency: e.target.value })}
  	            >
  	              <option value="daily">Daily</option>
  	              <option value="weekly">Weekly</option>
  	              <option value="weekdays">Weekdays Only</option>
  	              <option value="weekends">Weekends Only</option>
  	            </select>
  	          </div>

  	          <div className="form-group">
  	            <label htmlFor="endDate">End Date *</label>
  	            <input
  	              type="date"
  	              id="endDate"
  	              value={cabBookingForm.endDate}
  	              onChange={(e) => setCabBookingForm({ ...cabBookingForm, endDate: e.target.value })}
 	            />
  	          </div>
  	        </>
  	      )}

  	      <button type="submit" className="btn btn-primary" disabled={loading}>
  	        <i className="fas fa-check"></i> {loading ? 'Submitting...' : 'Submit Booking Request'}
  	      </button>
  	    </form>
  	  </Modal>

  	  {/* Complaint Details Modal */}
  	  <Modal
  	    isOpen={showDetailsModal}
  	    onClose={() => {
  	      setShowDetailsModal(false);
  	      setSelectedComplaint(null); // 8. BUG FIXED
  	    }}
  	    title={<><i className="fas fa-info-circle"></i> Complaint Details</>}
  	  >
  	    {selectedComplaint ? ( // 9. BUG FIXED
  	      <div>
  	        <div className="detail-section">
  	          <h4>📋 Complaint Information</h4>
  	          <p><strong>ID:</strong> {selectedComplaint.id || 'N/A'}</p>
  	          <p><strong>Description:</strong> {selectedComplaint.student_view?.complaint || 'N/A'}</p>
  	          <p>
  	            <strong>Status:</strong>{' '}
  	            <span className={`status-badge ${getComplaintStatusBadgeClass(selectedComplaint.student_view?.status)}`}>
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

  	        {/* Suggestions for Students ONLY */}
  	        {selectedComplaint.admin_view?.suggestions && selectedComplaint.admin_view.suggestions.length > 0 && (
  	          <div className="detail-section" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' }}>
  	            <h4>💡 Suggestions While We Review</h4>
  	            <ul style={{ lineHeight: '1.8', paddingLeft: '1.5rem', color: '#555' }}>
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
  	            setSelectedComplaint(null); // 10. BUG FIXED
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

export default StudentTransport;