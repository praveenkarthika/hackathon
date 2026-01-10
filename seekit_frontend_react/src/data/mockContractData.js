
export const mockVendors = [
  {
    vendor_id: 'V-1001',
    vendor_name: 'Microsoft',
    vendor_type: 'SaaS',
    contact_name: 'John Smith',
    contact_email: 'support@microsoft.com',
    contact_phone: '+1-555-0101',
    support_portal_url: 'https://admin.microsoft.com',
    notes: 'Enterprise Agreement for O365',
    created_at: '2023-01-01',
    updated_at: '2023-06-15'
  },
  {
    vendor_id: 'V-1002',
    vendor_name: 'Adobe',
    vendor_type: 'License',
    contact_name: 'Sarah Connor',
    contact_email: 'account-team@adobe.com',
    contact_phone: '+1-555-0102',
    support_portal_url: 'https://account.adobe.com',
    notes: 'Creative Cloud All Apps',
    created_at: '2023-02-10',
    updated_at: '2023-02-10'
  },
  {
    vendor_id: 'V-1003',
    vendor_name: 'AWS',
    vendor_type: 'SaaS',
    contact_name: 'Cloud Support',
    contact_email: 'support@aws.amazon.com',
    contact_phone: '+1-555-0103',
    support_portal_url: 'https://console.aws.amazon.com',
    notes: 'Hosting Infrastructure',
    created_at: '2022-11-20',
    updated_at: '2023-08-01'
  },
  {
    vendor_id: 'V-1004',
    vendor_name: 'Zoom',
    vendor_type: 'SaaS',
    contact_name: 'Video Ops',
    contact_email: 'billing@zoom.us',
    contact_phone: '+1-555-0104',
    support_portal_url: 'https://zoom.us/account',
    notes: 'Corporate Webinar License',
    created_at: '2023-03-05',
    updated_at: '2023-03-05'
  },
  {
    vendor_id: 'V-1005',
    vendor_name: 'Dell Financial Services',
    vendor_type: 'Hardware',
    contact_name: 'Leasing Team',
    contact_email: 'leasing@dell.com',
    contact_phone: '+1-555-0105',
    support_portal_url: 'https://dfs.dell.com',
    notes: 'Laptop Leasing Contract',
    created_at: '2022-05-15',
    updated_at: '2023-05-15'
  }
];

export const mockSubscriptions = [
  {
    subscription_id: 'SUB-2001',
    contract_name: 'Microsoft 365 E5 Enterprise',
    vendor_id: 'V-1001',
    service_name: 'Office 365',
    subscription_type: 'Per User',
    contract_start_date: '2023-01-01',
    contract_end_date: '2024-01-01',
    renewal_type: 'Auto',
    renewal_notice_days: 30,
    billing_cycle: 'Annual',
    currency: 'USD',
    total_cost: 120000,
    cost_per_unit: 35,
    quantity: 285, // Approx derived
    status: 'Active',
    purchase_order_ref: 'PO-2023-001',
    invoice_ref: 'INV-MS-9988',
    created_by: 'Admin',
    remarks: 'Includes Power BI Pro'
  },
  {
    subscription_id: 'SUB-2002',
    contract_name: 'Adobe Creative Cloud Teams',
    vendor_id: 'V-1002',
    service_name: 'Creative Cloud',
    subscription_type: 'Per User',
    contract_start_date: '2023-03-01',
    contract_end_date: '2024-03-01',
    renewal_type: 'Manual',
    renewal_notice_days: 60,
    billing_cycle: 'Annual',
    currency: 'USD',
    total_cost: 45000,
    cost_per_unit: 900,
    quantity: 50,
    status: 'Active',
    purchase_order_ref: 'PO-2023-045',
    invoice_ref: 'INV-AD-7766',
    created_by: 'Admin',
    remarks: 'Marketing & Design Team'
  },
  {
    subscription_id: 'SUB-2003',
    contract_name: 'AWS Production Environment',
    vendor_id: 'V-1003',
    service_name: 'AWS EC2/S3',
    subscription_type: 'Usage Based',
    contract_start_date: '2022-06-01',
    contract_end_date: '2025-06-01',
    renewal_type: 'Auto',
    renewal_notice_days: 90,
    billing_cycle: 'Monthly',
    currency: 'USD',
    total_cost: 85000, // Annual estimate
    cost_per_unit: 0,
    quantity: 1,
    status: 'Active',
    purchase_order_ref: 'PO-2022-102',
    invoice_ref: 'INV-AWS-MONTHLY',
    created_by: 'DevOps Lead',
    remarks: '3 Year Reserved Instances'
  },
  {
    subscription_id: 'SUB-2004',
    contract_name: 'Zoom Business Plan',
    vendor_id: 'V-1004',
    service_name: 'Zoom Meetings',
    subscription_type: 'Per User',
    contract_start_date: '2023-02-15',
    contract_end_date: '2024-02-15',
    renewal_type: 'Auto',
    renewal_notice_days: 30,
    billing_cycle: 'Annual',
    currency: 'USD',
    total_cost: 15000,
    cost_per_unit: 200,
    quantity: 75,
    status: 'Expiring Soon', // Logic should handle this, but mocking for initial view
    purchase_order_ref: 'PO-2023-022',
    invoice_ref: 'INV-ZM-3322',
    created_by: 'Admin',
    remarks: 'Global Sales Team'
  },
  {
    subscription_id: 'SUB-2005',
    contract_name: 'Legacy CRM System',
    vendor_id: 'V-1001', // Hypothetical
    service_name: 'Old CRM',
    subscription_type: 'Site License',
    contract_start_date: '2020-01-01',
    contract_end_date: '2023-12-31',
    renewal_type: 'Manual',
    renewal_notice_days: 90,
    billing_cycle: 'Annual',
    currency: 'USD',
    total_cost: 50000,
    cost_per_unit: 50000,
    quantity: 1,
    status: 'Expired',
    purchase_order_ref: 'PO-2020-999',
    invoice_ref: 'INV-OLD-001',
    created_by: 'Admin',
    remarks: 'Replaced by Salesforce, pending archive'
  }
];

export const mockAssignments = [
  {
    assignment_id: 'ASN-3001',
    subscription_id: 'SUB-2002',
    assigned_to_type: 'Department',
    assigned_to_id: 'DEPT-MKT',
    assigned_to_name: 'Marketing',
    allocation_start_date: '2023-03-01',
    allocation_end_date: '2024-03-01',
    usage_status: 'Active',
    comments: 'Full team access'
  },
  {
    assignment_id: 'ASN-3002',
    subscription_id: 'SUB-2002',
    assigned_to_type: 'User',
    assigned_to_id: 'USR-001',
    assigned_to_name: 'Jane Doe',
    allocation_start_date: '2023-03-05',
    allocation_end_date: '2024-03-01',
    usage_status: 'Active',
    comments: 'Design Lead'
  },
  {
    assignment_id: 'ASN-3003',
    subscription_id: 'SUB-2004',
    assigned_to_type: 'Department',
    assigned_to_id: 'DEPT-SALES',
    assigned_to_name: 'Sales',
    allocation_start_date: '2023-02-15',
    allocation_end_date: '2024-02-15',
    usage_status: 'Active',
    comments: 'Global License Pool'
  }
];
