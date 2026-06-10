import { useState, useEffect } from 'react';
import { Database } from '../../services/db';

export function HIPAASecurityShield() {
    const [auditLogs, setAuditLogs] = useState([]);
    
    // Table States
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState('timestamp');
    const [sortDirection, setSortDirection] = useState('desc'); // 'asc' or 'desc'
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const refreshData = () => {
        setAuditLogs(Database.get('psypyrus_audit_logs'));
    };

    useEffect(() => {
        refreshData();
        window.addEventListener('psypyrus_db_change', refreshData);
        return () => window.removeEventListener('psypyrus_db_change', refreshData);
    }, []);

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    // Filter and Sort logs
    const handleSort = (field) => {
        const isAsc = sortField === field && sortDirection === 'asc';
        setSortDirection(isAsc ? 'desc' : 'asc');
        setSortField(field);
    };

    const getSortedLogs = () => {
        let filtered = auditLogs.filter(log => 
            log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.actor.toLowerCase().includes(searchQuery.toLowerCase())
        );

        filtered.sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];

            if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    };

    const sortedLogs = getSortedLogs();
    const totalItems = sortedLogs.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedLogs = sortedLogs.slice(startIndex, startIndex + itemsPerPage);

    // Export functions
    const handleExportJson = () => {
        const blob = new Blob([JSON.stringify(auditLogs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PsyPyrus_HIPAA_Audit_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExportCsv = () => {
        const headers = ['ID', 'Action', 'Details', 'Actor', 'Timestamp', 'IP Address', 'Encryption'];
        const csvRows = [headers.join(',')];

        auditLogs.forEach(log => {
            const row = [
                log.id,
                `"${log.action.replace(/"/g, '""')}"`,
                `"${log.details.replace(/"/g, '""')}"`,
                `"${log.actor.replace(/"/g, '""')}"`,
                `"${new Date(log.timestamp).toISOString()}"`,
                `"${log.ipAddress}"`,
                `"${log.encryptionStandard}"`
            ];
            csvRows.push(row.join(','));
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PsyPyrus_HIPAA_Audit_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="screen-container active" id="screen-hipaa-shield">
            <style>{`
                .hipaa-shield-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }
                .shield-status-card {
                    background: rgba(255,255,255,0.01);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 10px;
                    padding: 16px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .shield-icon-wrapper {
                    width: 42px;
                    height: 42px;
                    border-radius: 10px;
                    background: rgba(16, 185, 129, 0.08);
                    color: var(--color-success);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                }
                .shield-icon-wrapper.warn {
                    background: rgba(245, 166, 35, 0.08);
                    color: var(--color-warning);
                }
                .shield-icon-wrapper.info {
                    background: var(--color-primary-glow);
                    color: var(--color-primary);
                }
                .audit-data-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 12.5px;
                    text-align: left;
                    margin-top: 12px;
                }
                .audit-data-table th, .audit-data-table td {
                    padding: 10px 12px;
                    border-bottom: 1px solid rgba(255,255,255,0.04);
                }
                .audit-data-table th {
                    color: var(--text-muted);
                    font-weight: 600;
                    cursor: pointer;
                    user-select: none;
                    background: rgba(255,255,255,0.02);
                }
                .audit-data-table th:hover {
                    color: var(--text-light);
                    background: rgba(255,255,255,0.04);
                }
                .audit-pagination-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 16px;
                    font-size: 12px;
                    color: var(--text-muted);
                }
            `}</style>

            <div className="section-header-block">
                <i className="fa-solid fa-user-shield"></i>
                <h2>HIPAA Shield & Secure Cryptography</h2>
            </div>

            {/* Compliance Status Cards */}
            <div className="hipaa-shield-grid">
                <div className="shield-status-card">
                    <div className="shield-icon-wrapper">
                        <i className="fa-solid fa-lock"></i>
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--text-light)' }}>Encryption standard</h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AES-GCM-256 Active</span>
                    </div>
                </div>

                <div className="shield-status-card">
                    <div className="shield-icon-wrapper">
                        <i className="fa-solid fa-cloud-arrow-down"></i>
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--text-light)' }}>Network Traffic</h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Isolated (Local Sandbox)</span>
                    </div>
                </div>

                <div className="shield-status-card">
                    <div className="shield-icon-wrapper info">
                        <i className="fa-solid fa-fingerprint"></i>
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--text-light)' }}>Session integrity</h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Biometric Lock active</span>
                    </div>
                </div>

                <div className="shield-status-card">
                    <div className="shield-icon-wrapper warn">
                        <i className="fa-solid fa-scale-balanced"></i>
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--text-light)' }}>EHR Vault Status</h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>HIPAA / GDPR Verified</span>
                    </div>
                </div>
            </div>

            {/* Audit Log Table Container */}
            <div className="workspace-card">
                <div className="card-title-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <h3>HIPAA Compliance access Ledger</h3>
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input 
                            type="text" 
                            className="input-text-field"
                            style={{ margin: 0, padding: '4px 8px', fontSize: '11px', width: '160px' }}
                            placeholder="Fuzzy search logs..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        />
                        <button className="patient-filter-chip active" style={{ margin: 0, fontSize: '11px' }} onClick={handleExportJson}>
                            <i className="fa-solid fa-file-code"></i> JSON
                        </button>
                        <button className="patient-filter-chip active" style={{ margin: 0, fontSize: '11px' }} onClick={handleExportCsv}>
                            <i className="fa-solid fa-file-csv"></i> CSV
                        </button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="audit-data-table">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('id')}>ID {sortField === 'id' && (sortDirection === 'asc' ? '▲' : '▼')}</th>
                                <th onClick={() => handleSort('action')}>Action {sortField === 'action' && (sortDirection === 'asc' ? '▲' : '▼')}</th>
                                <th>Details</th>
                                <th onClick={() => handleSort('actor')}>Actor {sortField === 'actor' && (sortDirection === 'asc' ? '▲' : '▼')}</th>
                                <th>IP Address</th>
                                <th onClick={() => handleSort('timestamp')}>Timestamp {sortField === 'timestamp' && (sortDirection === 'asc' ? '▲' : '▼')}</th>
                                <th>Encryption</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                                        No matching audit trails found in ledger.
                                    </td>
                                </tr>
                            ) : (
                                paginatedLogs.map((log) => (
                                    <tr key={log.id}>
                                        <td style={{ fontWeight: 'bold' }}>#{log.id}</td>
                                        <td style={{ color: 'var(--color-primary)', fontWeight: 500 }}>{log.action}</td>
                                        <td>{log.details}</td>
                                        <td>{log.actor}</td>
                                        <td style={{ fontFamily: 'monospace' }}>{log.ipAddress}</td>
                                        <td style={{ fontSize: '11px' }}>{formatTimestamp(log.timestamp)}</td>
                                        <td style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{log.encryptionStandard}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="audit-pagination-row">
                    <span>
                        Showing {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} logs
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            className="patient-filter-chip" 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            style={{ margin: 0, opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                        >
                            Previous
                        </button>
                        <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontWeight: 'bold' }}>
                            Page {currentPage} of {totalPages}
                        </span>
                        <button 
                            className="patient-filter-chip" 
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            style={{ margin: 0, opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
