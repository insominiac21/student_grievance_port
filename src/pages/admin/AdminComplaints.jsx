import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import Modal from '../../components/shared/Modal';

const FLASK_API = 'http://localhost:5000';

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${FLASK_API}/complaints`);
      setComplaints(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedComplaint || !newStatus) return;

    try {
      // Update complaint status in storage
      const updatedComplaints = complaints.map((complaint) => {
        if (complaint.id === selectedComplaint.id) {
          return {
            ...complaint,
            student_view: {
              ...complaint.student_view,
              status: newStatus,
            },
          };
        }
        return complaint;
      });

      // Save to backend
      await axios.post(`${FLASK_API}/complaints/update`, {
        complaint_id: selectedComplaint.id,
        status: newStatus,
      });

      setComplaints(updatedComplaints);
      setSelectedComplaint({
        ...selectedComplaint,
        student_view: {
          ...selectedComplaint.student_view,
          status: newStatus,
        },
      });

      alert('Status updated successfully!');
      setNewStatus('');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      Pending: 'pending',
      'In Progress': 'in-progress',
      Resolved: 'resolved',
    };
    return statusMap[status] || 'pending';
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-content">
          <div className="page-header">
            <i className="fas fa-tasks"></i>
            <div>
              <h1>Complaint Management</h1>
              <p>View and manage all student complaints</p>
            </div>
          </div>

          <div className="content-card">
            <h2>
              <i className="fas fa-list"></i> All Complaints
            </h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Complaint</th>
                    <th>Severity</th>
                    <th>Departments</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                        No complaints found
                      </td>
                    </tr>
                  ) : (
                    complaints.map((complaint) => (
                      <tr key={complaint.id}>
                        <td>{complaint.id}</td>
                        <td>{complaint.student_view?.complaint?.substring(0, 40) || 'N/A'}...</td>
                        <td>
                          <span style={{
                            backgroundColor: complaint.admin_view?.severity >= 4 ? '#ff4444' : '#ffbb00',
                            color: 'white',
                            padding: '0.3rem 0.8rem',
                            borderRadius: '4px',
                          }}>
                            {complaint.admin_view?.severity || 'N/A'} / 5
                          </span>
                        </td>
                        <td>
                          {complaint.admin_view?.departments?.join(', ') || 'N/A'}
                        </td>
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
                              setNewStatus(complaint.student_view?.status || 'Pending');
                              setShowDetailsModal(true);
                            }}
                          >
                            Manage
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

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedComplaint(null);
          setNewStatus('');
        }}
        title={<><i className="fas fa-info-circle"></i> Manage Complaint</>}
      >
        {selectedComplaint ? (
          <div>
            <div className="detail-section">
              <h4>📋 Complaint Details</h4>
              <p><strong>ID:</strong> {selectedComplaint.id}</p>
              <p><strong>Description:</strong> {selectedComplaint.student_view?.complaint}</p>
              <p><strong>Severity:</strong> {selectedComplaint.admin_view?.severity} / 5</p>
              <p><strong>Summary:</strong> {selectedComplaint.admin_view?.summary}</p>
              <p><strong>Departments:</strong> {selectedComplaint.admin_view?.departments?.join(', ')}</p>
            </div>

            <div className="detail-section" style={{ marginTop: '1.5rem' }}>
              <h4>🔄 Update Status</h4>
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    width: '100%',
                  }}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={handleUpdateStatus}
              >
                Update Status
              </button>
            </div>

            {selectedComplaint.admin_view?.suggestions && (
              <div className="detail-section" style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                <h4>💡 Suggestions</h4>
                <ul style={{ lineHeight: '1.8', paddingLeft: '1.5rem' }}>
                  {selectedComplaint.admin_view.suggestions.map((sugg, idx) => (
                    <li key={idx}>{sugg}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      <Footer />
    </>
  );
};

export default AdminComplaints;
