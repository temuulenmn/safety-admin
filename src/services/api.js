import axios from 'axios'
import { message as antdMessage } from 'antd'

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3500').replace(/\/+$/, '')

const notify = {
  success: (m) => antdMessage.success(m || 'Амжилттай'),
  error:   (m) => antdMessage.error(m || 'Алдаа гарлаа'),
  warning: (m) => antdMessage.warning(m),
}

const client = axios.create({ baseURL: `${BASE_URL}/api` })

client.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  if (!cfg.headers['Content-Type']) cfg.headers['Content-Type'] = 'application/json'
  return cfg
})

client.interceptors.response.use(
  (res) => {
    if (res.config.method !== 'get' && res.data?.message) notify.success(res.data.message)
    return res.data
  },
  (err) => {
    if (!err.response) {
      notify.error('Сүлжээний алдаа')
    } else {
      const { status, data } = err.response
      if (status === 401) {
        notify.warning('Нэвтрэх шаардлагатай')
        localStorage.clear()
        window.location.href = '/#/login'
      } else {
        notify.error(data?.message)
      }
    }
    return Promise.reject(err)
  }
)

const api = {
  // ── Auth ──────────────────────────────────────────────────────────
  login:          (data)   => client.post('/auth/login', data),
  me:             ()       => client.get('/auth/me'),
  changePassword: (data)   => client.put('/auth/change-password', data),
  getUsers:       ()       => client.get('/auth/users'),
  createUser:     (data)   => client.post('/auth/users', data),
  toggleUser:     (id)     => client.patch(`/auth/users/${id}/toggle`),

  // ── Companies ─────────────────────────────────────────────────────
  getSubscription:    ()     => client.get('/companies/my/subscription'),
  getBilling:         ()     => client.get('/companies/my/billing'),
  getInvoices:        ()     => client.get('/companies/my/invoices'),
  getPlans:           ()     => client.get('/companies/plans'),
  updateCompany:      (id, data) => client.put(`/companies/${id}`, data),

  // ── Departments ───────────────────────────────────────────────────
  getDepartments:     ()          => client.get('/departments'),
  createDepartment:   (data)      => client.post('/departments', data),
  updateDepartment:   (id, data)  => client.put(`/departments/${id}`, data),
  deleteDepartment:   (id)        => client.delete(`/departments/${id}`),

  // ── Employees ─────────────────────────────────────────────────────
  getEmployees:       (params)    => client.get('/employees', { params }),
  getEmployee:        (id)        => client.get(`/employees/${id}`),
  createEmployee:     (data)      => client.post('/employees', data),
  updateEmployee:     (id, data)  => client.put(`/employees/${id}`, data),
  terminateEmployee:  (id, data)  => client.post(`/employees/${id}/terminate`, data),
  setEmployeePin:     (id, data)  => client.post(`/employees/${id}/set-pin`, data),
  getEmployeeQrToken: (id)        => client.get (`/employees/${id}/qr-token`),
  issueEmployeeQr:    (id)        => client.post(`/employees/${id}/qr-token`),

  // ── Attendance ────────────────────────────────────────────────────
  getAttendance:      (params)    => client.get('/attendance', { params }),
  getTodayAttendance: ()          => client.get('/attendance/today'),
  getAttendanceSummary:(params)   => client.get('/attendance/summary', { params }),
  checkIn:            (data)      => client.post('/attendance/check-in', data),
  checkOut:           (id, data)  => client.put(`/attendance/${id}/check-out`, data),
  updateAttendance:   (id, data)  => client.put(`/attendance/${id}`, data),

  // ── Work Schedules ────────────────────────────────────────────────
  getSchedules:       (params)    => client.get('/schedules', { params }),
  createSchedule:     (data)      => client.post('/schedules', data),
  bulkCreateSchedule: (data)      => client.post('/schedules/bulk', data),
  updateSchedule:     (id, data)  => client.put(`/schedules/${id}`, data),
  deleteSchedule:     (id)        => client.delete(`/schedules/${id}`),

  // ── Payroll ───────────────────────────────────────────────────────
  getPayrollPeriods:  ()          => client.get('/payroll'),
  createPayrollPeriod:(data)      => client.post('/payroll', data),
  approvePeriod:      (id)        => client.post(`/payroll/${id}/approve`),
  getPeriodSummary:   (id)        => client.get(`/payroll/${id}/summary`),
  getPeriodEntries:   (id)        => client.get(`/payroll/${id}/entries`),
  upsertEntry:        (id, data)  => client.post(`/payroll/${id}/entries`, data),
  bulkUpsertEntries:  (id, data)  => client.post(`/payroll/${id}/entries/bulk`, data),
  generatePayroll:    (id)        => client.post(`/payroll/${id}/generate`),

  // ── RFID ─────────────────────────────────────────────────────────
  getRfidReaders:     ()          => client.get('/rfid/readers'),
  createRfidReader:   (data)      => client.post('/rfid/readers', data),
  updateRfidReader:   (id, data)  => client.put(`/rfid/readers/${id}`, data),
  getRfidCards:       (params)    => client.get('/rfid/cards', { params }),
  createRfidCard:     (data)      => client.post('/rfid/cards', data),
  toggleRfidCard:     (id)        => client.patch(`/rfid/cards/${id}/toggle`),
  getRfidScans:       (params)    => client.get('/rfid/scans', { params }),
  getRfidScanStats:   (params)    => client.get('/rfid/scans/stats', { params }),

  // ── PPE ───────────────────────────────────────────────────────────
  getPpeCategories:   ()          => client.get('/ppe/categories'),
  createPpeCategory:  (data)      => client.post('/ppe/categories', data),
  updatePpeCategory:  (id, data)  => client.put(`/ppe/categories/${id}`, data),
  deletePpeCategory:  (id)        => client.delete(`/ppe/categories/${id}`),
  getPpeItems:        (params)    => client.get('/ppe/items', { params }),
  createPpeItem:      (data)      => client.post('/ppe/items', data),
  updatePpeItem:      (id, data)  => client.put(`/ppe/items/${id}`, data),
  getPpeChecks:       (params)    => client.get('/ppe/checks', { params }),
  getPpeCheckStats:   (params)    => client.get('/ppe/checks/stats', { params }),

  // ── Training ──────────────────────────────────────────────────────
  getTrainings:       ()          => client.get('/training'),
  createTraining:     (data)      => client.post('/training', data),
  updateTraining:     (id, data)  => client.put(`/training/${id}`, data),
  deleteTraining:     (id)        => client.delete(`/training/${id}`),
  getTrainingRecords: (params)    => client.get('/training/records', { params }),
  createTrainingRecord:(data)     => client.post('/training/records', data),
  getTrainingStatus:  (params)    => client.get('/training/status', { params }),

  // ── Clothing Orders ───────────────────────────────────────────────
  getClothing:        (params)    => client.get('/clothing', { params }),
  createClothing:     (data)      => client.post('/clothing', data),
  updateClothing:     (id, data)  => client.put(`/clothing/${id}`, data),
  approveClothing:    (id)        => client.post(`/clothing/${id}/approve`),
  rejectClothing:     (id)        => client.post(`/clothing/${id}/reject`),
  issueClothing:      (id)        => client.post(`/clothing/${id}/issue`),

  // ── Site Access ───────────────────────────────────────────────────
  getSiteAccess:      ()          => client.get('/site-access'),
  createSiteAccess:   (data)      => client.post('/site-access', data),
  updateSiteAccess:   (id, data)  => client.put(`/site-access/${id}`, data),
  deleteSiteAccess:   (id)        => client.delete(`/site-access/${id}`),
  checkAccess:        (data)      => client.post('/site-access/check', data),

  // ── Dashboard ─────────────────────────────────────────────────────
  getDashboardOverview:       ()        => client.get('/dashboard/overview'),
  getAttendanceTrend:         (params)  => client.get('/dashboard/attendance-trend', { params }),
  getRfidDeniedReasons:       (params)  => client.get('/dashboard/rfid-denied-reasons', { params }),
  getTrainingCompliance:      ()        => client.get('/dashboard/training-compliance'),

  // ── Marketplace (company-side) ────────────────────────────────────
  getMarketCatalog:        (params)     => client.get('/marketplace/items', { params }),
  getMarketCategories:     ()           => client.get('/marketplace/items/categories'),
  getMarketCatalogItem:    (id)         => client.get(`/marketplace/items/${id}`),
  getMarketOrders:         (params)     => client.get('/marketplace/orders', { params }),
  getMarketOrder:          (id)         => client.get(`/marketplace/orders/${id}`),
  createMarketOrder:       (data)       => client.post('/marketplace/orders', data),
  cancelMarketOrder:       (id)         => client.post(`/marketplace/orders/${id}/cancel`),

  // ── Tools & checkouts ────────────────────────────────────────────
  getToolStats:        ()         => client.get('/tools/stats'),
  getTools:            (params)   => client.get('/tools', { params }),
  createTool:          (data)     => client.post('/tools', data),
  updateTool:          (id, data) => client.put(`/tools/${id}`, data),
  deleteTool:          (id)       => client.delete(`/tools/${id}`),
  getCheckouts:        (params)   => client.get('/tools/checkouts', { params }),
  checkoutTool:        (data)     => client.post('/tools/checkouts', data),
  scanCheckoutTool:    (data)     => client.post('/tools/checkouts/scan', data),
  returnTool:          (id, data) => client.post(`/tools/checkouts/${id}/return`, data),

  // ── Violations & penalty fund ────────────────────────────────────
  getViolationStats:   (params)   => client.get('/violations/stats', { params }),
  getViolations:       (params)   => client.get('/violations', { params }),
  createViolation:     (data)     => client.post('/violations', data),
  updateViolation:     (id, data) => client.put(`/violations/${id}`, data),
  deleteViolation:     (id)       => client.delete(`/violations/${id}`),
  getViolationSettings:()         => client.get('/violations/settings'),
  updateViolationSettings:(data)  => client.put('/violations/settings', data),
  getFundBalance:      ()         => client.get('/violations/fund/balance'),
  getFundExpenses:     ()         => client.get('/violations/fund/expenses'),
  createFundExpense:   (data)     => client.post('/violations/fund/expenses', data),
  deleteFundExpense:   (id)       => client.delete(`/violations/fund/expenses/${id}`),

  // ── Training shop (browse catalog + order trainings) ─────────────
  getTrainingCatalog:        (params)     => client.get('/training-shop/catalog', { params }),
  getTrainingCategories:     ()           => client.get('/training-shop/catalog/categories'),
  getTrainingOrders:         (params)     => client.get('/training-shop/orders', { params }),
  getTrainingOrder:          (id)         => client.get(`/training-shop/orders/${id}`),
  createTrainingOrder:       (data)       => client.post('/training-shop/orders', data),
  cancelTrainingOrder:       (id)         => client.post(`/training-shop/orders/${id}/cancel`),
  addTrainingParticipants:   (id, data)   => client.post(`/training-shop/orders/${id}/participants`, data),
  removeTrainingParticipant: (id, pid)    => client.delete(`/training-shop/orders/${id}/participants/${pid}`),
  updateTrainingParticipant: (id, pid, data) => client.put(`/training-shop/orders/${id}/participants/${pid}`, data),
  bulkUpdateParticipants:    (id, data)   => client.post(`/training-shop/orders/${id}/participants/bulk-update`, data),

  // ── Brigades ─────────────────────────────────────────────────────
  getBrigadeStats:     ()         => client.get('/brigades/stats'),
  getBrigades:         (params)   => client.get('/brigades', { params }),
  getBrigade:          (id)       => client.get(`/brigades/${id}`),
  createBrigade:       (data)     => client.post('/brigades', data),
  updateBrigade:       (id, data) => client.put(`/brigades/${id}`, data),
  deleteBrigade:       (id)       => client.delete(`/brigades/${id}`),
  addBrigadeMembers:   (id, data) => client.post(`/brigades/${id}/members`, data),
  removeBrigadeMember: (mid)      => client.delete(`/brigades/members/${mid}`),

  // ── Brigade tasks (assignments) ──────────────────────────────────
  getBrigadeTaskStats: ()         => client.get('/brigades/tasks/stats'),
  getBrigadeTasks:     (params)   => client.get('/brigades/tasks', { params }),
  createBrigadeTask:   (data)     => client.post('/brigades/tasks', data),
  updateBrigadeTask:   (id, data) => client.put(`/brigades/tasks/${id}`, data),
  deleteBrigadeTask:   (id)       => client.delete(`/brigades/tasks/${id}`),

  // ── Brigade contracts ────────────────────────────────────────────
  getBrigadeContracts: (params)   => client.get('/brigades/contracts', { params }),
  getBrigadeContract:  (id)       => client.get(`/brigades/contracts/${id}`),
  createBrigadeContract:(data)    => client.post('/brigades/contracts', data),
  updateBrigadeContract:(id,data) => client.put(`/brigades/contracts/${id}`, data),
  startBrigadeContract:    (id)   => client.post(`/brigades/contracts/${id}/start`),
  completeBrigadeContract: (id)   => client.post(`/brigades/contracts/${id}/complete`),
  cancelBrigadeContract:   (id)   => client.post(`/brigades/contracts/${id}/cancel`),
  recordBrigadePayment:(id, data) => client.post(`/brigades/contracts/${id}/payments`, data),
  deleteBrigadePayment:(pid)      => client.delete(`/brigades/contracts/payments/${pid}`),

  // ── Danger zones (#1) ────────────────────────────────────────────
  getDangerZones:      (params)   => client.get('/safety/danger-zones', { params }),
  getDangerZonesLive:  (params)   => client.get('/safety/danger-zones/live', { params }),
  createDangerZone:    (data)     => client.post('/safety/danger-zones', data),
  updateDangerZone:    (id, data) => client.put(`/safety/danger-zones/${id}`, data),
  deleteDangerZone:    (id)       => client.delete(`/safety/danger-zones/${id}`),

  // ── Morning inspections (#4) ─────────────────────────────────────
  getMorningToday:     ()         => client.get('/safety/morning-inspections/today'),
  getMorningInspections:(params)  => client.get('/safety/morning-inspections', { params }),
  createMorningInspection:(data)  => client.post('/safety/morning-inspections', data),
  deleteMorningInspection:(id)    => client.delete(`/safety/morning-inspections/${id}`),

  // ── Document library (#3, #7) — read only ────────────────────────
  getDocuments:        (params)   => client.get('/safety/documents', { params }),
  getDocWorkTypes:     ()         => client.get('/safety/documents/work-types'),

  // ── Worker clothing (RFID-tagged PPE) ────────────────────────────
  getWorkerClothing:   (params)   => client.get('/worker-clothing', { params }),
  createWorkerClothing:(data)     => client.post('/worker-clothing', data),
  updateWorkerClothing:(id, data) => client.put(`/worker-clothing/${id}`, data),
  deleteWorkerClothing:(id)       => client.delete(`/worker-clothing/${id}`),

  // ── Material estimation (талбайн хэмжээнээс материал бодох) ───────
  getMaterialNorms:    (params)   => client.get('/materials/norms', { params }),
  createMaterialNorm:  (data)     => client.post('/materials/norms', data),
  updateMaterialNorm:  (id, data) => client.put(`/materials/norms/${id}`, data),
  deleteMaterialNorm:  (id)       => client.delete(`/materials/norms/${id}`),
  calculateMaterials:  (data)     => client.post('/materials/calculate', data),
  getMaterialEstimates:()         => client.get('/materials/estimates'),
  getMaterialEstimate: (id)       => client.get(`/materials/estimates/${id}`),
  saveMaterialEstimate:(data)     => client.post('/materials/estimates', data),
  deleteMaterialEstimate:(id)     => client.delete(`/materials/estimates/${id}`),

  // ── KPI ──────────────────────────────────────────────────────────
  getKpiOverview:      (params)   => client.get('/kpi/overview', { params }),
  getKpiTargets:       ()         => client.get('/kpi/targets'),
  updateKpiTarget:     (data)     => client.put('/kpi/targets', data),

  // ── Projects / Objects (ERP backbone) ────────────────────────────
  getProjects:         (params)   => client.get('/projects', { params }),
  getProjectStats:     ()         => client.get('/projects/stats'),
  getProjectLeaderboard: (params) => client.get('/projects/leaderboard', { params }),
  getProject:          (id)       => client.get(`/projects/${id}`),
  getProjectKpi:       (id, params) => client.get(`/projects/${id}/kpi`, { params }),
  createProject:       (data)     => client.post('/projects', data),
  updateProject:       (id, data) => client.put(`/projects/${id}`, data),
  deleteProject:       (id)       => client.delete(`/projects/${id}`),

  // ── Insurance (ХАБЭА хууль 28.4) ─────────────────────────────────
  getInsurances:       (params)   => client.get('/insurances', { params }),
  getInsuranceStats:   ()         => client.get('/insurances/stats'),
  getUncoveredWorkers: ()         => client.get('/insurances/uncovered'),
  createInsurance:     (data)     => client.post('/insurances', data),
  updateInsurance:     (id, data) => client.put(`/insurances/${id}`, data),
  deleteInsurance:     (id)       => client.delete(`/insurances/${id}`),

  // ── Accidents (Үйлдвэрлэлийн осол) ───────────────────────────────
  getAccidents:        (params)   => client.get('/accidents', { params }),
  getAccidentStats:    ()         => client.get('/accidents/stats'),
  getAccident:         (id)       => client.get(`/accidents/${id}`),
  createAccident:      (data)     => client.post('/accidents', data),
  updateAccident:      (id, data) => client.put(`/accidents/${id}`, data),
  deleteAccident:      (id)       => client.delete(`/accidents/${id}`),

  // ── Health checks (Эрүүл мэндийн үзлэг) ──────────────────────────
  getHealthChecks:     (params)   => client.get('/health-checks', { params }),
  getHealthCheckDue:   (params)   => client.get('/health-checks/due', { params }),
  getHealthCheckStats: ()         => client.get('/health-checks/stats'),
  createHealthCheck:   (data)     => client.post('/health-checks', data),
  updateHealthCheck:   (id, data) => client.put(`/health-checks/${id}`, data),
  deleteHealthCheck:   (id)       => client.delete(`/health-checks/${id}`),

  // ── OSH Committee (Аюулгүйн зөвлөл) ──────────────────────────────
  getOshMembers:       ()         => client.get('/osh-committee/members'),
  addOshMember:        (data)     => client.post('/osh-committee/members', data),
  updateOshMember:     (id, data) => client.put(`/osh-committee/members/${id}`, data),
  removeOshMember:     (id)       => client.delete(`/osh-committee/members/${id}`),
  getOshMeetings:      (params)   => client.get('/osh-committee/meetings', { params }),
  createOshMeeting:    (data)     => client.post('/osh-committee/meetings', data),
  updateOshMeeting:    (id, data) => client.put(`/osh-committee/meetings/${id}`, data),
  removeOshMeeting:    (id)       => client.delete(`/osh-committee/meetings/${id}`),

  // ── Chemicals (Химийн бодис) ─────────────────────────────────────
  getChemicals:        (params)   => client.get('/chemicals', { params }),
  getChemicalStats:    ()         => client.get('/chemicals/stats'),
  createChemical:      (data)     => client.post('/chemicals', data),
  updateChemical:      (id, data) => client.put(`/chemicals/${id}`, data),
  deleteChemical:      (id)       => client.delete(`/chemicals/${id}`),

  // ── Fire safety (Галын аюулгүй байдал) ──────────────────────────
  getFireStats:        ()         => client.get('/fire-safety/stats'),
  getFireEquipment:    (params)   => client.get('/fire-safety/equipment', { params }),
  createFireEquipment: (data)     => client.post('/fire-safety/equipment', data),
  updateFireEquipment: (id, data) => client.put(`/fire-safety/equipment/${id}`, data),
  deleteFireEquipment: (id)       => client.delete(`/fire-safety/equipment/${id}`),
  getFireInspections:  ()         => client.get('/fire-safety/inspections'),
  createFireInspection:(data)     => client.post('/fire-safety/inspections', data),

  // ── Risk Assessment ──────────────────────────────────────────────
  getRiskAssessments:  (params)   => client.get('/risk-assessments', { params }),
  getRiskStats:        ()         => client.get('/risk-assessments/stats'),
  createRiskAssessment:(data)     => client.post('/risk-assessments', data),
  updateRiskAssessment:(id, data) => client.put(`/risk-assessments/${id}`, data),
  deleteRiskAssessment:(id)       => client.delete(`/risk-assessments/${id}`),

  // ── Detox rations ────────────────────────────────────────────────
  getDetoxRations:     (params)   => client.get('/detox-rations', { params }),
  getDetoxMissing:     ()         => client.get('/detox-rations/missing'),
  createDetoxRation:   (data)     => client.post('/detox-rations', data),
  deleteDetoxRation:   (id)       => client.delete(`/detox-rations/${id}`),

  // ── Tool inspections + expiring certs ────────────────────────────
  getToolInspections:  (params)   => client.get('/tool-inspections', { params }),
  getExpiringCerts:    ()         => client.get('/tool-inspections/expiring'),
  createToolInspection:(data)     => client.post('/tool-inspections', data),
  deleteToolInspection:(id)       => client.delete(`/tool-inspections/${id}`),

  // ── OSH Budget (1.5% rule) ───────────────────────────────────────
  getOshBudgetSummary: (params)   => client.get('/osh-budget/summary', { params }),
  getOshBaseline:      (params)   => client.get('/osh-budget/baseline', { params }),
  suggestOshBaseline:  (params)   => client.get('/osh-budget/baseline/suggest', { params }),
  setOshBaseline:      (data)     => client.put('/osh-budget/baseline', data),
  getOshExpenses:      (params)   => client.get('/osh-budget/expenses', { params }),
  createOshExpense:    (data)     => client.post('/osh-budget/expenses', data),
  deleteOshExpense:    (id)       => client.delete(`/osh-budget/expenses/${id}`),

  // ── Training compliance ──────────────────────────────────────────
  getTrainingMatrix:   (params)   => client.get('/training-compliance/matrix', { params }),
  getTrainingComplianceSummary: (params) => client.get('/training-compliance/summary', { params }),

  // ── Notifications ────────────────────────────────────────────────
  getNotificationEvents: ()         => client.get('/notifications/events'),
  getRecipients:         ()         => client.get('/notifications/recipients'),
  createRecipient:       (data)     => client.post('/notifications/recipients', data),
  updateRecipient:       (id, data) => client.put(`/notifications/recipients/${id}`, data),
  removeRecipient:       (id)       => client.delete(`/notifications/recipients/${id}`),
  setRecipientSubs:      (id, data) => client.put(`/notifications/recipients/${id}/subs`, data),
  getNotificationLog:    (params)   => client.get('/notifications/log', { params }),
  testSendNotification:  (data)     => client.post('/notifications/test', data),
  runReportManually:     (kind)     => client.post(`/notifications/run/${kind}`),
}

export default api
