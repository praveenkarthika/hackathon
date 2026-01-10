import React from 'react';

function WidgetCard({ title, children, actions = true, className = '', onViewDetails }) {
  return (
    <div className={`card h-100 ${className}`}>
      <div className="card-header d-flex justify-content-between align-items-center">
        <h6 className="card-title text-muted mb-0 fw-semibold text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
          {title}
        </h6>
        {actions && (
          <div className="d-flex gap-2 text-muted opacity-50">
            <i className="bi bi-pencil-square" style={{ fontSize: '0.8rem', cursor: 'pointer' }}></i>
            <i className="bi bi-dash-lg" style={{ fontSize: '0.8rem', cursor: 'pointer' }}></i>
            <i className="bi bi-x-lg" style={{ fontSize: '0.8rem', cursor: 'pointer' }}></i>
          </div>
        )}
      </div>
      <div className="card-body d-flex flex-column">
        <div className="flex-grow-1">
          {children}
        </div>
        <div className="text-end mt-2">
           <span 
             className="text-primary fw-semibold small" 
             style={{ fontSize: '0.75rem', cursor: 'pointer' }}
             onClick={onViewDetails}
           >
             View Details <i className="bi bi-arrow-right ms-1"></i>
           </span>
        </div>
      </div>
    </div>
  );
}

export default WidgetCard;
