import styles from './KPICard.module.scss';

function KPICard({ label, value, icon }) {
  return (
    <div className={`card h-100`}>
      <div className="card-body d-flex align-items-center justify-content-between">
        <div>
          <div className="text-muted small fw-medium text-uppercase">{label}</div>
          <div className="fs-4 fw-bold mt-1">{value}</div>
        </div>
        <div className={styles.iconWrap}>
          {icon || <span className="bi bi-graph-up"></span>}
        </div>
      </div>
    </div>
  );
}

export default KPICard;

